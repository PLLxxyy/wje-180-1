import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db';
import { authMiddleware, storeAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all scripts (public)
router.get('/', (req: AuthRequest, res: Response) => {
  try {
    const { type, difficulty, search, store_id, sort } = req.query;
    let query = `
      SELECT s.*, u.nickname as store_name, u.store_name as store_title
      FROM scripts s
      JOIN users u ON s.store_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (type && type !== 'all') {
      query += ' AND s.type = ?';
      params.push(type);
    }

    if (difficulty) {
      query += ' AND s.difficulty = ?';
      params.push(Number(difficulty));
    }

    if (search) {
      query += ' AND (s.name LIKE ? OR s.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (store_id) {
      query += ' AND s.store_id = ?';
      params.push(store_id);
    }

    if (sort === 'rating') {
      query += ' ORDER BY s.avg_rating DESC';
    } else if (sort === 'popular') {
      query += ' ORDER BY s.review_count DESC';
    } else {
      query += ' ORDER BY s.created_at DESC';
    }

    const scripts = db.prepare(query).all(...params) as any[];

    if (req.user) {
      const favoriteIds = db.prepare(
        'SELECT script_id FROM favorites WHERE user_id = ?'
      ).all(req.user.id).map((f: any) => f.script_id);
      const scriptsWithFav = scripts.map(s => ({
        ...s,
        is_favorited: favoriteIds.includes(s.id)
      }));
      res.json(scriptsWithFav);
    } else {
      res.json(scripts);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get my favorite scripts
router.get('/my/favorites', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const scripts = db.prepare(`
      SELECT s.*, u.nickname as store_name, u.store_name as store_title, f.created_at as favorited_at
      FROM favorites f
      JOIN scripts s ON f.script_id = s.id
      JOIN users u ON s.store_id = u.id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `).all(req.user!.id);
    res.json(scripts);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get single script
router.get('/:id', (req: AuthRequest, res: Response) => {
  try {
    const script = db.prepare(`
      SELECT s.*, u.nickname as store_name, u.store_name as store_title, u.store_address
      FROM scripts s
      JOIN users u ON s.store_id = u.id
      WHERE s.id = ?
    `).get(req.params.id) as any;

    if (!script) {
      return res.status(404).json({ error: '剧本不存在' });
    }

    // Get reviews
    const reviews = db.prepare(`
      SELECT r.*, u.nickname as user_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.script_id = ?
      ORDER BY r.created_at DESC
    `).all(req.params.id);

    // Get upcoming rooms
    const rooms = db.prepare(`
      SELECT r.*, u.store_name as store_title
      FROM rooms r
      JOIN users u ON r.store_id = u.id
      WHERE r.script_id = ? AND r.status IN ('open', 'full')
      ORDER BY r.start_time ASC
    `).all(req.params.id);

    // Check if favorited by current user
    let is_favorited = false;
    if (req.user) {
      const fav = db.prepare(
        'SELECT id FROM favorites WHERE user_id = ? AND script_id = ?'
      ).get(req.user.id, req.params.id);
      is_favorited = !!fav;
    }

    // Get favorite count
    const favCount = db.prepare(
      'SELECT COUNT(*) as count FROM favorites WHERE script_id = ?'
    ).get(req.params.id) as any;

    res.json({ ...script, reviews, rooms, is_favorited, favorite_count: favCount.count });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Favorite a script
router.post('/:id/favorite', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const script = db.prepare('SELECT id, name FROM scripts WHERE id = ?').get(req.params.id) as any;
    if (!script) {
      return res.status(404).json({ error: '剧本不存在' });
    }

    const existing = db.prepare(
      'SELECT id FROM favorites WHERE user_id = ? AND script_id = ?'
    ).get(req.user!.id, req.params.id);

    if (existing) {
      return res.status(400).json({ error: '已经收藏过该剧本' });
    }

    const id = uuidv4();
    db.prepare(
      'INSERT INTO favorites (id, user_id, script_id) VALUES (?, ?, ?)'
    ).run(id, req.user!.id, req.params.id);

    res.status(201).json({ message: '收藏成功' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Unfavorite a script
router.delete('/:id/favorite', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const result = db.prepare(
      'DELETE FROM favorites WHERE user_id = ? AND script_id = ?'
    ).run(req.user!.id, req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: '未收藏该剧本' });
    }

    res.json({ message: '取消收藏成功' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Check favorite status
router.get('/:id/favorite', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const fav = db.prepare(
      'SELECT id FROM favorites WHERE user_id = ? AND script_id = ?'
    ).get(req.user!.id, req.params.id);
    res.json({ is_favorited: !!fav });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create script (store only)
router.post('/', authMiddleware, storeAuth, (req: AuthRequest, res: Response) => {
  try {
    const { name, type, difficulty, minPlayers, maxPlayers, duration, description, tags } = req.body;

    if (!name || !type || !difficulty || !minPlayers || !maxPlayers || !duration || !description) {
      return res.status(400).json({ error: '请填写所有必填字段' });
    }

    // Check store approval
    const user = db.prepare('SELECT store_status FROM users WHERE id = ?').get(req.user!.id) as any;
    if (user?.store_status !== 'approved') {
      return res.status(403).json({ error: '您的店铺尚未通过审核，无法发布剧本' });
    }

    const id = uuidv4();

    db.prepare(`
      INSERT INTO scripts (id, store_id, name, type, difficulty, min_players, max_players, duration, description, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.user!.id, name, type, difficulty, minPlayers, maxPlayers, duration, description, JSON.stringify(tags || []));

    res.status(201).json({ message: '剧本发布成功', id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update script (store only)
router.put('/:id', authMiddleware, storeAuth, (req: AuthRequest, res: Response) => {
  try {
    const script = db.prepare('SELECT * FROM scripts WHERE id = ? AND store_id = ?').get(req.params.id, req.user!.id) as any;
    if (!script) {
      return res.status(404).json({ error: '剧本不存在或无权修改' });
    }

    const { name, type, difficulty, minPlayers, maxPlayers, duration, description, tags } = req.body;

    db.prepare(`
      UPDATE scripts SET
        name = COALESCE(?, name),
        type = COALESCE(?, type),
        difficulty = COALESCE(?, difficulty),
        min_players = COALESCE(?, min_players),
        max_players = COALESCE(?, max_players),
        duration = COALESCE(?, duration),
        description = COALESCE(?, description),
        tags = COALESCE(?, tags),
        updated_at = datetime('now')
      WHERE id = ?
    `).run(name, type, difficulty, minPlayers, maxPlayers, duration, description, tags ? JSON.stringify(tags) : null, req.params.id);

    res.json({ message: '剧本更新成功' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete script (store only)
router.delete('/:id', authMiddleware, storeAuth, (req: AuthRequest, res: Response) => {
  try {
    const script = db.prepare('SELECT * FROM scripts WHERE id = ? AND store_id = ?').get(req.params.id, req.user!.id) as any;
    if (!script) {
      return res.status(404).json({ error: '剧本不存在或无权删除' });
    }

    // Check if there are active rooms
    const activeRooms = db.prepare("SELECT COUNT(*) as count FROM rooms WHERE script_id = ? AND status IN ('open', 'full', 'in_progress')").get(req.params.id) as any;
    if (activeRooms.count > 0) {
      return res.status(400).json({ error: '该剧本有进行中的场次，无法删除' });
    }

    db.prepare('DELETE FROM scripts WHERE id = ?').run(req.params.id);
    res.json({ message: '剧本删除成功' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
