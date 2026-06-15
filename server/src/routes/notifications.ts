import { Router, Response } from 'express';
import db from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Get user notifications
router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const notifications = db.prepare(`
      SELECT * FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).all(req.user!.id);

    res.json(notifications);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get unread count
router.get('/unread', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const result = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0').get(req.user!.id) as any;
    res.json({ count: result.count });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Mark notification as read
router.put('/:id/read', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    db.prepare('UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user!.id);
    res.json({ message: '已标记为已读' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Mark all as read
router.put('/read-all', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ? AND read = 0').run(req.user!.id);
    res.json({ message: '全部已读' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
