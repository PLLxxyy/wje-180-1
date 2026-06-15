import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Create review
router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { roomId, rating, content } = req.body;

    if (!roomId || !rating || !content) {
      return res.status(400).json({ error: '请填写所有字段' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: '评分应在1-5之间' });
    }

    // Check if user attended this room
    const booking = db.prepare("SELECT * FROM bookings WHERE room_id = ? AND user_id = ? AND status = 'completed'").get(roomId, req.user!.id);
    if (!booking) {
      return res.status(400).json({ error: '您还未参加过该场次或场次尚未结束' });
    }

    // Check if already reviewed
    const existing = db.prepare('SELECT * FROM reviews WHERE room_id = ? AND user_id = ?').get(roomId, req.user!.id);
    if (existing) {
      return res.status(400).json({ error: '您已评价过该场次' });
    }

    const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(roomId) as any;
    if (!room) {
      return res.status(404).json({ error: '场次不存在' });
    }

    const id = uuidv4();

    db.prepare(`
      INSERT INTO reviews (id, room_id, script_id, user_id, rating, content)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, roomId, room.script_id, req.user!.id, rating, content);

    // Update script average rating
    const stats = db.prepare(`
      SELECT AVG(rating) as avg_rating, COUNT(*) as count
      FROM reviews WHERE script_id = ?
    `).get(room.script_id) as any;

    db.prepare(`
      UPDATE scripts SET avg_rating = ?, review_count = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(Math.round(stats.avg_rating * 10) / 10, stats.count, room.script_id);

    // Check and update achievements
    checkAchievements(req.user!.id);

    res.status(201).json({ message: '评价成功', id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get reviews for a script
router.get('/script/:scriptId', (req: AuthRequest, res: Response) => {
  try {
    const reviews = db.prepare(`
      SELECT r.*, u.nickname as user_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.script_id = ?
      ORDER BY r.created_at DESC
    `).all(req.params.scriptId);

    res.json(reviews);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get user's reviews
router.get('/my', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const reviews = db.prepare(`
      SELECT r.*, s.name as script_name, s.type as script_type
      FROM reviews r
      JOIN scripts s ON r.script_id = s.id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
    `).all(req.user!.id);

    res.json(reviews);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

function checkAchievements(userId: string) {
  const user = db.prepare('SELECT achievements FROM users WHERE id = ?').get(userId) as any;
  const currentAchievements: string[] = JSON.parse(user?.achievements || '[]');
  const newAchievements: string[] = [...currentAchievements];

  // Count completed games
  const completedCount = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE user_id = ? AND status = 'completed'").get(userId) as any;

  if (completedCount.count >= 1 && !newAchievements.includes('初出茅庐')) {
    newAchievements.push('初出茅庐');
  }
  if (completedCount.count >= 5 && !newAchievements.includes('剧本杀爱好者')) {
    newAchievements.push('剧本杀爱好者');
  }
  if (completedCount.count >= 10 && !newAchievements.includes('资深玩家')) {
    newAchievements.push('资深玩家');
  }
  if (completedCount.count >= 20 && !newAchievements.includes('剧本杀达人')) {
    newAchievements.push('剧本杀达人');
  }

  // Count reviews
  const reviewCount = db.prepare('SELECT COUNT(*) as count FROM reviews WHERE user_id = ?').get(userId) as any;
  if (reviewCount.count >= 5 && !newAchievements.includes('点评专家')) {
    newAchievements.push('点评专家');
  }

  // Count different types played
  const typeCount = db.prepare(`
    SELECT COUNT(DISTINCT s.type) as count
    FROM bookings b
    JOIN rooms r ON b.room_id = r.id
    JOIN scripts s ON r.script_id = s.id
    WHERE b.user_id = ? AND b.status = 'completed'
  `).get(userId) as any;
  if (typeCount.count >= 3 && !newAchievements.includes('全能玩家')) {
    newAchievements.push('全能玩家');
  }

  // Check if user played mystery type a lot (推理达人)
  const mysteryCount = db.prepare(`
    SELECT COUNT(*) as count
    FROM bookings b
    JOIN rooms r ON b.room_id = r.id
    JOIN scripts s ON r.script_id = s.id
    WHERE b.user_id = ? AND b.status = 'completed' AND s.type = '推理'
  `).get(userId) as any;
  if (mysteryCount.count >= 3 && !newAchievements.includes('推理达人')) {
    newAchievements.push('推理达人');
  }

  if (newAchievements.length !== currentAchievements.length) {
    db.prepare("UPDATE users SET achievements = ?, updated_at = datetime('now') WHERE id = ?")
      .run(JSON.stringify(newAchievements), userId);
  }
}

export default router;
