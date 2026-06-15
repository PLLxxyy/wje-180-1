import { Router, Response } from 'express';
import db from '../db';
import { authMiddleware, adminAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// Get pending stores
router.get('/stores/pending', authMiddleware, adminAuth, (req: AuthRequest, res: Response) => {
  try {
    const stores = db.prepare("SELECT * FROM users WHERE role = 'store' AND store_status = 'pending' ORDER BY created_at DESC").all();
    res.json(stores.map((s: any) => ({
      id: s.id, username: s.username, nickname: s.nickname,
      storeName: s.store_name, storeAddress: s.store_address,
      phone: s.phone, createdAt: s.created_at
    })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get all stores
router.get('/stores', authMiddleware, adminAuth, (req: AuthRequest, res: Response) => {
  try {
    const stores = db.prepare("SELECT * FROM users WHERE role = 'store' ORDER BY created_at DESC").all();
    res.json(stores.map((s: any) => ({
      id: s.id, username: s.username, nickname: s.nickname,
      storeName: s.store_name, storeAddress: s.store_address,
      phone: s.phone, status: s.store_status, createdAt: s.created_at
    })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Approve/reject store
router.put('/stores/:id/status', authMiddleware, adminAuth, (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: '无效的状态' });
    }

    const store = db.prepare("SELECT * FROM users WHERE id = ? AND role = 'store'").get(req.params.id) as any;
    if (!store) {
      return res.status(404).json({ error: '店家不存在' });
    }

    db.prepare("UPDATE users SET store_status = ?, updated_at = datetime('now') WHERE id = ?").run(status, req.params.id);

    // Notify store
    const { v4: uuidv4 } = require('uuid');
    const title = status === 'approved' ? '店铺审核通过' : '店铺审核未通过';
    const content = status === 'approved' ? '恭喜！您的店铺已通过审核，现在可以发布剧本了。' : '很抱歉，您的店铺审核未通过，请联系管理员了解详情。';

    db.prepare('INSERT INTO notifications (id, user_id, title, content, type) VALUES (?, ?, ?, ?, ?)')
      .run(uuidv4(), req.params.id, title, content, 'system');

    res.json({ message: status === 'approved' ? '已通过审核' : '已拒绝审核' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Dashboard stats
router.get('/stats', authMiddleware, adminAuth, (req: AuthRequest, res: Response) => {
  try {
    const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'player'").get() as any;
    const totalStores = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'store'").get() as any;
    const totalScripts = db.prepare('SELECT COUNT(*) as count FROM scripts').get() as any;
    const totalRooms = db.prepare('SELECT COUNT(*) as count FROM rooms').get() as any;
    const completedRooms = db.prepare("SELECT COUNT(*) as count FROM rooms WHERE status = 'completed'").get() as any;
    const totalBookings = db.prepare('SELECT COUNT(*) as count FROM bookings').get() as any;
    const totalReviews = db.prepare('SELECT COUNT(*) as count FROM reviews').get() as any;

    // Recent activity (last 7 days)
    const recentRooms = db.prepare(`
      SELECT COUNT(*) as count FROM rooms
      WHERE created_at >= datetime('now', '-7 days')
    `).get() as any;

    const recentUsers = db.prepare(`
      SELECT COUNT(*) as count FROM users
      WHERE created_at >= datetime('now', '-7 days')
    `).get() as any;

    // Popular scripts
    const popularScripts = db.prepare(`
      SELECT s.name, s.type, s.avg_rating, s.review_count, u.store_name
      FROM scripts s
      JOIN users u ON s.store_id = u.id
      ORDER BY s.review_count DESC
      LIMIT 10
    `).all();

    // Room type distribution
    const typeDistribution = db.prepare(`
      SELECT s.type, COUNT(*) as count
      FROM rooms r
      JOIN scripts s ON r.script_id = s.id
      GROUP BY s.type
      ORDER BY count DESC
    `).all();

    // Daily rooms in last 7 days
    const dailyRooms = db.prepare(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM rooms
      WHERE created_at >= datetime('now', '-7 days')
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `).all();

    res.json({
      totalUsers: totalUsers.count,
      totalStores: totalStores.count,
      totalScripts: totalScripts.count,
      totalRooms: totalRooms.count,
      completedRooms: completedRooms.count,
      totalBookings: totalBookings.count,
      totalReviews: totalReviews.count,
      recentRooms: recentRooms.count,
      recentUsers: recentUsers.count,
      popularScripts,
      typeDistribution,
      dailyRooms
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Store dashboard stats
router.get('/store-stats', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const storeId = req.user!.id;

    const totalScripts = db.prepare('SELECT COUNT(*) as count FROM scripts WHERE store_id = ?').get(storeId) as any;
    const totalRooms = db.prepare('SELECT COUNT(*) as count FROM rooms WHERE store_id = ?').get(storeId) as any;
    const completedRooms = db.prepare("SELECT COUNT(*) as count FROM rooms WHERE store_id = ? AND status = 'completed'").get(storeId) as any;
    const totalBookings = db.prepare(`
      SELECT COUNT(*) as count FROM bookings b
      JOIN rooms r ON b.room_id = r.id
      WHERE r.store_id = ?
    `).get(storeId) as any;

    const totalRevenue = db.prepare(`
      SELECT COALESCE(SUM(r.price * b.count), 0) as total
      FROM rooms r
      JOIN (SELECT room_id, COUNT(*) as count FROM bookings WHERE status IN ('confirmed', 'completed') GROUP BY room_id) b ON r.id = b.room_id
      WHERE r.store_id = ? AND r.status = 'completed'
    `).get(storeId) as any;

    // Popular scripts for this store
    const popularScripts = db.prepare(`
      SELECT s.name, s.type, s.avg_rating, s.review_count
      FROM scripts s
      WHERE s.store_id = ?
      ORDER BY s.review_count DESC
      LIMIT 10
    `).all(storeId);

    // Recent rooms
    const recentRooms = db.prepare(`
      SELECT r.*, s.name as script_name,
        (SELECT COUNT(*) FROM bookings WHERE room_id = r.id AND status = 'confirmed') as booking_count
      FROM rooms r
      JOIN scripts s ON r.script_id = s.id
      WHERE r.store_id = ?
      ORDER BY r.created_at DESC
      LIMIT 10
    `).all(storeId);

    res.json({
      totalScripts: totalScripts.count,
      totalRooms: totalRooms.count,
      completedRooms: completedRooms.count,
      totalBookings: totalBookings.count,
      totalRevenue: totalRevenue.total || 0,
      popularScripts,
      recentRooms
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
