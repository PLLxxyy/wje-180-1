import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from './db';

console.log('Seeding database...');

// Clear existing data
db.exec('DELETE FROM notifications');
db.exec('DELETE FROM reviews');
db.exec('DELETE FROM bookings');
db.exec('DELETE FROM rooms');
db.exec('DELETE FROM scripts');
db.exec('DELETE FROM users');

// Create users
const adminId = uuidv4();
const store1Id = uuidv4();
const store2Id = uuidv4();
const player1Id = uuidv4();
const player2Id = uuidv4();
const player3Id = uuidv4();
const player4Id = uuidv4();
const player5Id = uuidv4();

const hashedPw = bcrypt.hashSync('123456', 10);
const adminPw = bcrypt.hashSync('admin123', 10);

const insertUser = db.prepare(`
  INSERT INTO users (id, username, password, nickname, role, store_name, store_address, phone, store_status, achievements)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

insertUser.run(adminId, 'admin', adminPw, '系统管理员', 'admin', '', '', '13800000000', 'approved', '[]');
insertUser.run(store1Id, 'store1', hashedPw, '探案馆小王', 'store', '探案馆旗舰店', '上海市南京西路100号3楼', '13800000001', 'approved', '[]');
insertUser.run(store2Id, 'store2', hashedPw, '悬疑屋小李', 'store', '悬疑屋剧本杀', '北京市朝阳区三里屯路88号', '13800000002', 'approved', '[]');
insertUser.run(player1Id, 'player1', hashedPw, '推理小能手', 'player', '', '', '13900000001', 'approved', '[]');
insertUser.run(player2Id, 'player2', hashedPw, '剧本杀迷', 'player', '', '', '13900000002', 'approved', '[]');
insertUser.run(player3Id, 'player3', hashedPw, '新手小白', 'player', '', '', '13900000003', 'approved', '[]');
insertUser.run(player4Id, 'player4', hashedPw, '恐怖达人', 'player', '', '', '13900000004', 'approved', '[]');
insertUser.run(player5Id, 'player5', hashedPw, '情感本玩家', 'player', '', '', '13900000005', 'approved', '[]');

console.log('Users created.');

// Create scripts
const script1Id = uuidv4();
const script2Id = uuidv4();
const script3Id = uuidv4();
const script4Id = uuidv4();
const script5Id = uuidv4();
const script6Id = uuidv4();
const script7Id = uuidv4();
const script8Id = uuidv4();

const insertScript = db.prepare(`
  INSERT INTO scripts (id, store_id, name, type, difficulty, min_players, max_players, duration, description, tags, avg_rating, review_count)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

insertScript.run(script1Id, store1Id, '消失的证人', '推理', 4, 4, 7, 240,
  '一场法庭上的谋杀案，唯一的证人离奇消失。每个嫌疑人都有不在场证明，但真相只有一个。你需要通过缜密的推理找出真正的凶手。',
  JSON.stringify(['硬核推理', '法庭', '悬疑']), 4.5, 2);

insertScript.run(script2Id, store1Id, '樱花树下的约定', '情感', 2, 4, 6, 180,
  '春天的樱花树下，五个年轻人重聚。十年前的约定、被遗忘的承诺、深藏心底的秘密，一段关于友情与爱情的感人故事。',
  JSON.stringify(['催泪', '友情', '爱情']), 4.8, 3);

insertScript.run(script3Id, store1Id, '午夜凶铃', '恐怖', 4, 5, 8, 300,
  '一栋百年老宅，一封神秘的邀请函。午夜的钟声响起时，真相将浮出水面。胆小者慎入！本剧本包含恐怖元素和惊吓环节。',
  JSON.stringify(['沉浸恐怖', '古宅', '惊悚']), 4.2, 1);

insertScript.run(script4Id, store2Id, '欢乐大本营', '欢乐', 1, 4, 8, 150,
  '一场欢乐的聚会，一个有趣的案件。轻松愉快的推理过程，适合新手入门和朋友聚会。保证让你笑到肚子疼！',
  JSON.stringify(['欢乐', '新手友好', '搞笑']), 4.0, 2);

insertScript.run(script5Id, store2Id, '暗夜追踪', '推理', 5, 6, 8, 360,
  '连环杀手在城市中游荡，警方束手无策。你作为特别调查组的一员，必须在凶手再次作案前找出他的真实身份。高难度硬核推理。',
  JSON.stringify(['硬核推理', '连环杀手', '刑侦']), 4.9, 1);

insertScript.run(script6Id, store2Id, '时光邮局', '情感', 2, 3, 5, 200,
  '一家只在午夜营业的邮局，可以寄送跨越时空的信件。每个人都有一个想要改变的过去，但时间真的可以重来吗？',
  JSON.stringify(['奇幻', '催泪', '穿越']), 4.6, 2);

insertScript.run(script7Id, store1Id, '密室逃脱：终极挑战', '推理', 3, 4, 6, 180,
  '你们被困在一个神秘的密室中，只有破解所有谜题才能逃出。但密室中还隐藏着一个更大的秘密……',
  JSON.stringify(['密室', '解谜', '推理']), 4.3, 0);

insertScript.run(script8Id, store2Id, '江湖恩仇录', '情感', 3, 5, 7, 270,
  '江湖风云变幻，恩怨情仇交织。一个神秘的武林大会，一场未了的恩仇。在刀光剑影中，感受侠骨柔情。',
  JSON.stringify(['武侠', '古风', '情感']), 4.7, 1);

console.log('Scripts created.');

// Create rooms (some past, some upcoming)
const now = new Date();
const insertRoom = db.prepare(`
  INSERT INTO rooms (id, script_id, store_id, start_time, end_time, max_players, current_players, status, location, price, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
`);

// Upcoming rooms
const room1Id = uuidv4();
const room2Id = uuidv4();
const room3Id = uuidv4();
const room4Id = uuidv4();
const room5Id = uuidv4();
const room6Id = uuidv4();
const room7Id = uuidv4();
const room8Id = uuidv4();

const futureDate1 = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
const futureDate2 = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
const futureDate3 = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
const futureDate4 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
const futureDate5 = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

insertRoom.run(room1Id, script1Id, store1Id,
  futureDate1.toISOString().replace('T', ' ').substring(0, 19),
  new Date(futureDate1.getTime() + 4 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19),
  6, 3, 'open', '上海市南京西路100号3楼 A房', 128);

insertRoom.run(room2Id, script2Id, store1Id,
  futureDate2.toISOString().replace('T', ' ').substring(0, 19),
  new Date(futureDate2.getTime() + 3 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19),
  5, 5, 'full', '上海市南京西路100号3楼 B房', 108);

insertRoom.run(room3Id, script3Id, store1Id,
  futureDate3.toISOString().replace('T', ' ').substring(0, 19),
  new Date(futureDate3.getTime() + 5 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19),
  7, 1, 'open', '上海市南京西路100号3楼 C房', 158);

insertRoom.run(room4Id, script4Id, store2Id,
  futureDate5.toISOString().replace('T', ' ').substring(0, 19),
  new Date(futureDate5.getTime() + 2.5 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19),
  6, 2, 'open', '北京市朝阳区三里屯路88号 大厅', 88);

insertRoom.run(room5Id, script5Id, store2Id,
  futureDate4.toISOString().replace('T', ' ').substring(0, 19),
  new Date(futureDate4.getTime() + 6 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19),
  8, 0, 'open', '北京市朝阳区三里屯路88号 VIP房', 188);

insertRoom.run(room6Id, script6Id, store2Id,
  futureDate2.toISOString().replace('T', ' ').substring(0, 19),
  new Date(futureDate2.getTime() + 3.5 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19),
  4, 1, 'open', '北京市朝阳区三里屯路88号 包间A', 98);

insertRoom.run(room7Id, script7Id, store1Id,
  futureDate3.toISOString().replace('T', ' ').substring(0, 19),
  new Date(futureDate3.getTime() + 3 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19),
  5, 0, 'open', '上海市南京西路100号3楼 D房', 118);

insertRoom.run(room8Id, script8Id, store2Id,
  futureDate4.toISOString().replace('T', ' ').substring(0, 19),
  new Date(futureDate4.getTime() + 4.5 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19),
  6, 2, 'open', '北京市朝阳区三里屯路88号 包间B', 138);

// Past completed rooms
const pastDate1 = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
const pastDate2 = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
const pastDate3 = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

const pastRoom1Id = uuidv4();
const pastRoom2Id = uuidv4();
const pastRoom3Id = uuidv4();

insertRoom.run(pastRoom1Id, script1Id, store1Id,
  pastDate1.toISOString().replace('T', ' ').substring(0, 19),
  new Date(pastDate1.getTime() + 4 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19),
  6, 5, 'completed', '上海市南京西路100号3楼 A房', 128);

insertRoom.run(pastRoom2Id, script2Id, store1Id,
  pastDate2.toISOString().replace('T', ' ').substring(0, 19),
  new Date(pastDate2.getTime() + 3 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19),
  5, 4, 'completed', '上海市南京西路100号3楼 B房', 108);

insertRoom.run(pastRoom3Id, script4Id, store2Id,
  pastDate3.toISOString().replace('T', ' ').substring(0, 19),
  new Date(pastDate3.getTime() + 2.5 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19),
  6, 6, 'completed', '北京市朝阳区三里屯路88号 大厅', 88);

console.log('Rooms created.');

// Create bookings for upcoming rooms
const insertBooking = db.prepare(`
  INSERT INTO bookings (id, room_id, user_id, role_name, status, created_at)
  VALUES (?, ?, ?, ?, ?, datetime('now'))
`);

// Room 1 bookings (3/6)
insertBooking.run(uuidv4(), room1Id, player1Id, '侦探', 'confirmed');
insertBooking.run(uuidv4(), room1Id, player2Id, '嫌疑人A', 'confirmed');
insertBooking.run(uuidv4(), room1Id, player3Id, '', 'confirmed');

// Room 2 bookings (5/5 - full)
insertBooking.run(uuidv4(), room2Id, player1Id, '女主', 'confirmed');
insertBooking.run(uuidv4(), room2Id, player2Id, '男主', 'confirmed');
insertBooking.run(uuidv4(), room2Id, player3Id, '闺蜜', 'confirmed');
insertBooking.run(uuidv4(), room2Id, player4Id, '青梅竹马', 'confirmed');
insertBooking.run(uuidv4(), room2Id, player5Id, '老师', 'confirmed');

// Room 3 bookings (1/7)
insertBooking.run(uuidv4(), room3Id, player4Id, '', 'confirmed');

// Room 4 bookings (2/6)
insertBooking.run(uuidv4(), room4Id, player1Id, '', 'confirmed');
insertBooking.run(uuidv4(), room4Id, player3Id, '', 'confirmed');

// Room 6 bookings (1/4)
insertBooking.run(uuidv4(), room6Id, player5Id, '信使', 'confirmed');

// Room 8 bookings (2/6)
insertBooking.run(uuidv4(), room8Id, player2Id, '剑客', 'confirmed');
insertBooking.run(uuidv4(), room8Id, player4Id, '侠女', 'confirmed');

// Past room bookings (completed)
insertBooking.run(uuidv4(), pastRoom1Id, player1Id, '侦探', 'completed');
insertBooking.run(uuidv4(), pastRoom1Id, player2Id, '嫌疑人A', 'completed');
insertBooking.run(uuidv4(), pastRoom1Id, player3Id, '嫌疑人B', 'completed');
insertBooking.run(uuidv4(), pastRoom1Id, player4Id, '证人', 'completed');
insertBooking.run(uuidv4(), pastRoom1Id, player5Id, '检察官', 'completed');

insertBooking.run(uuidv4(), pastRoom2Id, player1Id, '女主', 'completed');
insertBooking.run(uuidv4(), pastRoom2Id, player2Id, '男主', 'completed');
insertBooking.run(uuidv4(), pastRoom2Id, player3Id, '闺蜜', 'completed');
insertBooking.run(uuidv4(), pastRoom2Id, player5Id, '老师', 'completed');

insertBooking.run(uuidv4(), pastRoom3Id, player1Id, '', 'completed');
insertBooking.run(uuidv4(), pastRoom3Id, player2Id, '', 'completed');
insertBooking.run(uuidv4(), pastRoom3Id, player3Id, '', 'completed');
insertBooking.run(uuidv4(), pastRoom3Id, player4Id, '', 'completed');
insertBooking.run(uuidv4(), pastRoom3Id, player5Id, '', 'completed');

console.log('Bookings created.');

// Create reviews for past rooms
const insertReview = db.prepare(`
  INSERT INTO reviews (id, room_id, script_id, user_id, rating, content, created_at)
  VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
`);

// Reviews for script1 (消失的证人)
insertReview.run(uuidv4(), pastRoom1Id, script1Id, player1Id, 5, '非常精彩的推理体验！线索环环相扣，最后的反转出乎意料。强烈推荐给推理爱好者！');
insertReview.run(uuidv4(), pastRoom1Id, script1Id, player2Id, 4, '剧本设计很巧妙，但有些线索太隐晦了，需要DM适当提示。整体体验很好。');

// Reviews for script2 (樱花树下的约定)
insertReview.run(uuidv4(), pastRoom2Id, script2Id, player1Id, 5, '哭得稀里哗啦的，剧本把友情和爱情的描写做到了极致。每个人物都很立体。');
insertReview.run(uuidv4(), pastRoom2Id, script2Id, player2Id, 5, '太感人了！最后的反转让我措手不及，是今年玩过最好的情感本。');
insertReview.run(uuidv4(), pastRoom2Id, script2Id, player3Id, 4, '故事很美，代入感很强。就是有些地方节奏有点慢，但瑕不掩瑜。');

// Reviews for script4 (欢乐大本营)
insertReview.run(uuidv4(), pastRoom3Id, script4Id, player1Id, 4, '非常适合新手入门的欢乐本，全程笑声不断。推理部分比较简单，但欢乐就完事了！');
insertReview.run(uuidv4(), pastRoom3Id, script4Id, player2Id, 4, '和朋友们玩得很开心，虽然推理不难但互动性很强。推荐聚会时玩。');

// Reviews for script8 (江湖恩仇录)
// No reviews yet for script8

console.log('Reviews created.');

// Create some notifications
const insertNotification = db.prepare(`
  INSERT INTO notifications (id, user_id, title, content, type, created_at)
  VALUES (?, ?, ?, ?, ?, datetime('now'))
`);

insertNotification.run(uuidv4(), player1Id, '欢迎加入剧本杀平台', '欢迎来到剧本杀线上组局平台！快去组局广场看看有什么好玩的场次吧！', 'system');
insertNotification.run(uuidv4(), player2Id, '欢迎加入剧本杀平台', '欢迎来到剧本杀线上组局平台！快去组局广场看看有什么好玩的场次吧！', 'system');
insertNotification.run(uuidv4(), store1Id, '店铺审核通过', '恭喜！您的店铺"探案馆旗舰店"已通过审核，现在可以发布剧本和创建场次了。', 'system');
insertNotification.run(uuidv4(), store2Id, '店铺审核通过', '恭喜！您的店铺"悬疑屋剧本杀"已通过审核，现在可以发布剧本和创建场次了。', 'system');
insertNotification.run(uuidv4(), player1Id, '场次已满员', '您预约的"樱花树下的约定"场次已满员！请于' + futureDate2.toISOString().substring(0, 10) + '到达场地。', 'full');
insertNotification.run(uuidv4(), player1Id, '场次结束', '您参加的"消失的证人"场次已结束，快来给这次体验打分吧！', 'complete');

console.log('Notifications created.');
console.log('Database seeded successfully!');
console.log('');
console.log('Test accounts:');
console.log('  Admin: admin / admin123');
console.log('  Store: store1 / 123456 (探案馆旗舰店)');
console.log('  Store: store2 / 123456 (悬疑屋剧本杀)');
console.log('  Player: player1~player5 / 123456');
