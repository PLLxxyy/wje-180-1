import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../db';
import { generateToken } from '../utils/jwt';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Register
router.post('/register', (req: Request, res: Response) => {
  try {
    const { username, password, nickname, role, storeName, storeAddress, phone } = req.body;

    if (!username || !password || !nickname || !role) {
      return res.status(400).json({ error: '请填写所有必填字段' });
    }

    if (!['player', 'store'].includes(role)) {
      return res.status(400).json({ error: '无效的角色类型' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
      return res.status(400).json({ error: '用户名已存在' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const id = uuidv4();

    db.prepare(`
      INSERT INTO users (id, username, password, nickname, role, store_name, store_address, phone, store_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, username, hashedPassword, nickname, role,
      role === 'store' ? (storeName || '') : '',
      role === 'store' ? (storeAddress || '') : '',
      phone || '',
      role === 'store' ? 'pending' : 'approved'
    );

    const token = generateToken({ id, username, role });

    res.status(201).json({
      message: '注册成功',
      token,
      user: { id, username, nickname, role }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/login', (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '请输入用户名和密码' });
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const token = generateToken({ id: user.id, username: user.username, role: user.role });

    res.json({
      message: '登录成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        role: user.role,
        storeName: user.store_name,
        storeStatus: user.store_status,
        phone: user.phone,
        avatar: user.avatar
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get current user
router.get('/me', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.id) as any;
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json({
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      role: user.role,
      storeName: user.store_name,
      storeAddress: user.store_address,
      storeStatus: user.store_status,
      phone: user.phone,
      avatar: user.avatar,
      achievements: JSON.parse(user.achievements || '[]'),
      createdAt: user.created_at
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update profile
router.put('/profile', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { nickname, phone, storeName, storeAddress } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.id) as any;

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    db.prepare(`
      UPDATE users SET
        nickname = COALESCE(?, nickname),
        phone = COALESCE(?, phone),
        store_name = COALESCE(?, store_name),
        store_address = COALESCE(?, store_address),
        updated_at = datetime('now')
      WHERE id = ?
    `).run(nickname || null, phone || null, storeName || null, storeAddress || null, req.user!.id);

    res.json({ message: '更新成功' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
