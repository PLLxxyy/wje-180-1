import { Router, Response } from 'express';
import db from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Get user profile with stats
router.get('/profile', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.id) as any;
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // Get played scripts
    const playedScripts = db.prepare(`
      SELECT DISTINCT s.*, b.role_name, r.start_time as played_at
      FROM bookings b
      JOIN rooms r ON b.room_id = r.id
      JOIN scripts s ON r.script_id = s.id
      WHERE b.user_id = ? AND b.status = 'completed'
      ORDER BY r.start_time DESC
    `).all(req.user!.id);

    // Get reviews
    const reviews = db.prepare(`
      SELECT rv.*, s.name as script_name, s.type as script_type
      FROM reviews rv
      JOIN scripts s ON rv.script_id = s.id
      WHERE rv.user_id = ?
      ORDER BY rv.created_at DESC
    `).all(req.user!.id);

    // Stats
    const totalPlayed = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE user_id = ? AND status = 'completed'").get(req.user!.id) as any;
    const totalReviewed = db.prepare('SELECT COUNT(*) as count FROM reviews WHERE user_id = ?').get(req.user!.id) as any;

    // Type distribution
    const typeDistribution = db.prepare(`
      SELECT s.type, COUNT(*) as count
      FROM bookings b
      JOIN rooms r ON b.room_id = r.id
      JOIN scripts s ON r.script_id = s.id
      WHERE b.user_id = ? AND b.status = 'completed'
      GROUP BY s.type
    `).all(req.user!.id);

    res.json({
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar,
      achievements: JSON.parse(user.achievements || '[]'),
      createdAt: user.created_at,
      stats: {
        totalPlayed: totalPlayed.count,
        totalReviewed: totalReviewed.count,
        typeDistribution
      },
      playedScripts,
      reviews
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
