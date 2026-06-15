# 剧本杀线上组局平台

一个全栈的剧本杀线上组局平台，支持店家发布剧本和创建场次、玩家浏览组局广场并加入场次、评分评价、个人成就等功能。

## 功能特性

### 店家端
- 注册登录（角色：店家）
- 发布剧本（名称、类型、难度、人数、时长、简介）
- 创建房间场次（关联剧本、时间段、人数）
- 管理剧本和场次
- 查看参与情况和营收统计
- 热门剧本排行

### 玩家端
- 注册登录（角色：玩家）
- 组局广场浏览即将开场的场次
- 查看剧本简介和报名人数
- 加入场次（可选角色）
- 满员通知
- 场次结束后评分写短评
- 个人中心：预约列表、角色记录、个人成就

### 管理员端
- 审核店家资质
- 查看平台组局量
- 用户活跃趋势

## 技术栈

- **前端**: Vite + React 18 + TypeScript (端口 5173)
- **后端**: Express + TypeScript + better-sqlite3 (端口 3000)
- **认证**: JWT + bcryptjs
- **样式**: 内联在 index.html 的 style 标签中

## 快速开始

```bash
# 安装依赖
npm install
cd server && npm install && cd ../client && npm install && cd ..

# 初始化测试数据
npm run seed

# 启动项目
npm run dev
```

访问 http://localhost:5173 查看前端页面。

## 测试账号

| 角色 | 账号 | 密码 |
|------|------|------|
| 管理员 | admin | admin123 |
| 店家 | store1 | 123456 |
| 店家 | store2 | 123456 |
| 玩家 | player1 | 123456 |
| 玩家 | player2 | 123456 |
| 玩家 | player3 | 123456 |

## 项目结构

```
wje-180/
├── package.json          # 根配置，concurrently 启动
├── server/               # 后端
│   ├── src/
│   │   ├── index.ts      # Express 入口
│   │   ├── db.ts         # 数据库初始化
│   │   ├── seed.ts       # 测试数据
│   │   ├── routes/       # 路由
│   │   ├── middleware/    # 中间件
│   │   └── utils/        # 工具函数
│   └── package.json
├── client/               # 前端
│   ├── index.html        # 含所有样式
│   ├── src/
│   │   ├── main.tsx      # 入口
│   │   ├── App.tsx       # 路由配置
│   │   ├── pages/        # 页面组件
│   │   ├── components/   # 通用组件
│   │   └── utils/        # 工具函数
│   ├── vite.config.ts
│   └── package.json
└── README.md
```
