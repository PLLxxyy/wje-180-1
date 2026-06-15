import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db';
import { authMiddleware, storeAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all rooms (public - for square)
router.get('/', (req: AuthRequest, res: Response) => {
  try {
    const { status, script_type, search } = req.query;
    let query = `
      SELECT r.*, s.name as script_name, s.type as script_type, s.difficulty,
             s.min_players, s.max_players as script_max_players, s.duration,
             s.description as script_description, s.avg_rating,
             u.store_name as store_title, u.store_address
      FROM rooms r
      JOIN scripts s ON r.script_id = s.id
      JOIN users u ON r.store_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status && status !== 'all') {
      query += ' AND r.status = ?';
      params.push(status);
    } else {
      query += " AND r.status IN ('open', 'full')";
    }

    if (script_type && script_type !== 'all') {
      query += ' AND s.type = ?';
      params.push(script_type);
    }

    if (search) {
      query += ' AND (s.name LIKE ? OR u.store_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY r.start_time ASC';

    const rooms = db.prepare(query).all(...params);

    // Get booking count for each room
    const roomsWithBookings = rooms.map((room: any) => {
      const bookings = db.prepare('SELECT COUNT(*) as count FROM bookings WHERE room_id = ? AND status = ?').get(room.id, 'confirmed') as any;
      return { ...room, booking_count: bookings.count };
    });

    res.json(roomsWithBookings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get single room
router.get('/:id', (req: AuthRequest, res: Response) => {
  try {
    const room = db.prepare(`
      SELECT r.*, s.name as script_name, s.type as script_type, s.difficulty,
             s.min_players, s.max_players as script_max_players, s.duration,
             s.description as script_description, s.avg_rating,
             u.store_name as store_title, u.store_address, u.phone as store_phone
      FROM rooms r
      JOIN scripts s ON r.script_id = s.id
      JOIN users u ON r.store_id = u.id
      WHERE r.id = ?
    `).get(req.params.id) as any;

    if (!room) {
      return res.status(404).json({ error: '场次不存在' });
    }

    const bookings = db.prepare(`
      SELECT b.*, u.nickname as user_name
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      WHERE b.room_id = ? AND b.status = 'confirmed'
      ORDER BY b.created_at ASC
    `).all(req.params.id);

    res.json({ ...room, bookings, booking_count: bookings.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create room (store only)
router.post('/', authMiddleware, storeAuth, (req: AuthRequest, res: Response) => {
  try {
    const { scriptId, startTime, endTime, maxPlayers, location, price } = req.body;

    if (!scriptId || !startTime || !endTime || !maxPlayers) {
      return res.status(400).json({ error: '请填写所有必填字段' });
    }

    // Verify script belongs to store
    const script = db.prepare('SELECT * FROM scripts WHERE id = ? AND store_id = ?').get(scriptId, req.user!.id) as any;
    if (!script) {
      return res.status(404).json({ error: '剧本不存在或无权使用' });
    }

    if (maxPlayers < script.min_players || maxPlayers > script.max_players) {
      return res.status(400).json({ error: `人数应在${script.min_players}-${script.max_players}之间` });
    }

    const user = db.prepare('SELECT store_address FROM users WHERE id = ?').get(req.user!.id) as any;
    const id = uuidv4();

    db.prepare(`
      INSERT INTO rooms (id, script_id, store_id, start_time, end_time, max_players, location, price)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, scriptId, req.user!.id, startTime, endTime, maxPlayers, location || user?.store_address || '', price || 0);

    // Notify all users who favorited this script
    const favoritedUsers = db.prepare(
      'SELECT user_id FROM favorites WHERE script_id = ?'
    ).all(scriptId) as any[];

    if (favoritedUsers.length > 0) {
      const storeInfo = db.prepare('SELECT store_name FROM users WHERE id = ?').get(req.user!.id) as any;
      const notifyStmt = db.prepare(`
        INSERT INTO notifications (id, user_id, title, content, type) VALUES (?, ?, ?, ?, ?)
      `);

      for (const favUser of favoritedUsers) {
        const notifyId = uuidv4();
        notifyStmt.run(
          notifyId,
          favUser.user_id,
          '收藏剧本新场次通知',
          `您收藏的剧本「${script.name}」有新场次啦！${storeInfo?.store_name || '店家'}将于 ${startTime} 开一场，${maxPlayers}人本，快去看看吧~`,
          'new_room'
        );
      }
    }

    res.status(201).json({ message: '场次创建成功', id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update room status
router.put('/:id', authMiddleware, storeAuth, (req: AuthRequest, res: Response) => {
  try {
    const room = db.prepare('SELECT * FROM rooms WHERE id = ? AND store_id = ?').get(req.params.id, req.user!.id) as any;
    if (!room) {
      return res.status(404).json({ error: '场次不存在或无权修改' });
    }

    const { status, location, price } = req.body;

    db.prepare(`
      UPDATE rooms SET
        status = COALESCE(?, status),
        location = COALESCE(?, location),
        price = COALESCE(?, price),
        updated_at = datetime('now')
      WHERE id = ?
    `).run(status, location, price, req.params.id);

    res.json({ message: '场次更新成功' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Cancel room
router.post('/:id/cancel', authMiddleware, storeAuth, (req: AuthRequest, res: Response) => {
  try {
    const room = db.prepare('SELECT * FROM rooms WHERE id = ? AND store_id = ?').get(req.params.id, req.user!.id) as any;
    if (!room) {
      return res.status(404).json({ error: '场次不存在或无权操作' });
    }

    db.prepare("UPDATE rooms SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?").run(req.params.id);

    // Notify all booked users
    const bookings = db.prepare("SELECT user_id FROM bookings WHERE room_id = ? AND status = 'confirmed'").all(req.params.id) as any[];
    const notifyStmt = db.prepare(`
      INSERT INTO notifications (id, user_id, title, content, type) VALUES (?, ?, ?, ?, ?)
    `);

    for (const booking of bookings) {
      notifyStmt.run(uuidv4(), booking.user_id, '场次取消通知', `您预约的场次"${room.id}"已被店家取消`, 'cancel');
    }

    db.prepare("UPDATE bookings SET status = 'cancelled' WHERE room_id = ? AND status = 'confirmed'").run(req.params.id);

    res.json({ message: '场次已取消' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Complete room
router.post('/:id/complete', authMiddleware, storeAuth, (req: AuthRequest, res: Response) => {
  try {
    const room = db.prepare('SELECT * FROM rooms WHERE id = ? AND store_id = ?').get(req.params.id, req.user!.id) as any;
    if (!room) {
      return res.status(404).json({ error: '场次不存在或无权操作' });
    }

    db.prepare("UPDATE rooms SET status = 'completed', updated_at = datetime('now') WHERE id = ?").run(req.params.id);
    db.prepare("UPDATE bookings SET status = 'completed' WHERE room_id = ? AND status = 'confirmed'").run(req.params.id);

    // Notify all participants
    const bookings = db.prepare("SELECT user_id FROM bookings WHERE room_id = ? AND status = 'completed'").all(req.params.id) as any[];
    const notifyStmt = db.prepare(`
      INSERT INTO notifications (id, user_id, title, content, type) VALUES (?, ?, ?, ?, ?)
    `);

    for (const booking of bookings) {
      notifyStmt.run(uuidv4(), booking.user_id, '场次结束', '场次已结束，快来给这次体验打分吧！', 'complete');
    }

    res.json({ message: '场次已结束' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
