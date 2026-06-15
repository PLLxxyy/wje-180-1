import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Create booking
router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { roomId, roleName } = req.body;

    if (!roomId) {
      return res.status(400).json({ error: '请选择要加入的场次' });
    }

    const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(roomId) as any;
    if (!room) {
      return res.status(404).json({ error: '场次不存在' });
    }

    if (room.status !== 'open') {
      return res.status(400).json({ error: '该场次已无法报名' });
    }

    // Check if already booked
    const existing = db.prepare("SELECT * FROM bookings WHERE room_id = ? AND user_id = ? AND status = 'confirmed'").get(roomId, req.user!.id);
    if (existing) {
      return res.status(400).json({ error: '您已报名该场次' });
    }

    // Check if room is full
    const bookingCount = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE room_id = ? AND status = 'confirmed'").get(roomId) as any;
    if (bookingCount.count >= room.max_players) {
      return res.status(400).json({ error: '该场次已满员' });
    }

    const id = uuidv4();

    db.prepare(`
      INSERT INTO bookings (id, room_id, user_id, role_name, status)
      VALUES (?, ?, ?, ?, 'confirmed')
    `).run(id, roomId, req.user!.id, roleName || '');

    // Update room current_players
    db.prepare('UPDATE rooms SET current_players = current_players + 1, updated_at = datetime(\'now\') WHERE id = ?').run(roomId);

    // Check if room is now full
    const newCount = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE room_id = ? AND status = 'confirmed'").get(roomId) as any;
    if (newCount.count >= room.max_players) {
      // Update room status to full
      db.prepare("UPDATE rooms SET status = 'full', updated_at = datetime('now') WHERE id = ?").run(roomId);

      // Notify all participants
      const bookings = db.prepare("SELECT user_id FROM bookings WHERE room_id = ? AND status = 'confirmed'").all(roomId) as any[];
      const notifyStmt = db.prepare(`
        INSERT INTO notifications (id, user_id, title, content, type) VALUES (?, ?, ?, ?, ?)
      `);

      const script = db.prepare('SELECT name FROM scripts WHERE id = ?').get(room.script_id) as any;
      for (const booking of bookings) {
        notifyStmt.run(
          uuidv4(), booking.user_id, '场次已满员',
          `您预约的"${script?.name || '剧本'}"场次已满员！请于${room.start_time}到达场地。`,
          'full'
        );
      }
    }

    res.status(201).json({ message: '报名成功', id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Cancel booking
router.post('/:id/cancel', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const booking = db.prepare("SELECT * FROM bookings WHERE id = ? AND user_id = ? AND status = 'confirmed'").get(req.params.id, req.user!.id) as any;
    if (!booking) {
      return res.status(404).json({ error: '预约不存在或已取消' });
    }

    db.prepare("UPDATE bookings SET status = 'cancelled' WHERE id = ?").run(req.params.id);
    db.prepare('UPDATE rooms SET current_players = MAX(current_players - 1, 0), updated_at = datetime(\'now\') WHERE id = ?').run(booking.room_id);

    // If room was full, reopen it
    const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(booking.room_id) as any;
    if (room?.status === 'full') {
      db.prepare("UPDATE rooms SET status = 'open', updated_at = datetime('now') WHERE id = ?").run(booking.room_id);
    }

    res.json({ message: '已取消预约' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get user's bookings
router.get('/my', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT b.*, r.start_time, r.end_time, r.status as room_status, r.location, r.price,
             s.name as script_name, s.type as script_type, s.difficulty,
             u.store_name as store_title
      FROM bookings b
      JOIN rooms r ON b.room_id = r.id
      JOIN scripts s ON r.script_id = s.id
      JOIN users u ON r.store_id = u.id
      WHERE b.user_id = ?
    `;
    const params: any[] = [req.user!.id];

    if (status && status !== 'all') {
      query += ' AND b.status = ?';
      params.push(status);
    }

    query += ' ORDER BY r.start_time DESC';

    const bookings = db.prepare(query).all(...params);
    res.json(bookings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
