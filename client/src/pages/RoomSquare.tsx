import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth, useToast } from '../App';
import { formatDate, getTypeTagClass, getStatusLabel, getTypeEmoji, renderDifficulty } from '../utils/helpers';

export default function RoomSquare() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scriptType, setScriptType] = useState('all');
  const [search, setSearch] = useState('');
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadRooms();
  }, [scriptType]);

  const loadRooms = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (scriptType !== 'all') params.script_type = scriptType;
      if (search) params.search = search;
      const data = await api.getRooms(params);
      setRooms(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadRooms();
  };

  const handleJoin = async (roomId: string) => {
    if (!user) {
      showToast('请先登录', 'error');
      navigate('/login');
      return;
    }
    try {
      await api.createBooking({ roomId, roleName: '' });
      showToast('报名成功！', 'success');
      loadRooms();
    } catch (err: any) {
      showToast(err.message || '报名失败', 'error');
    }
  };

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>🎯 组局广场</h1>
          <p>找到志同道合的伙伴，一起开启剧本杀之旅</p>
        </div>

        <div className="filters">
          <input
            type="text"
            className="search-input"
            placeholder="搜索剧本名称或店家..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          <select className="filter-select" value={scriptType} onChange={e => setScriptType(e.target.value)}>
            <option value="all">全部类型</option>
            <option value="推理">推理</option>
            <option value="情感">情感</option>
            <option value="恐怖">恐怖</option>
            <option value="欢乐">欢乐</option>
          </select>
          <button className="btn btn-primary" onClick={handleSearch}>搜索</button>
        </div>

        {loading ? (
          <div className="loading"><div className="spinner"></div><span>加载中...</span></div>
        ) : rooms.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎯</div>
            <p className="empty-state-text">暂无场次，快去让店家创建吧</p>
          </div>
        ) : (
          <div className="grid grid-2">
            {rooms.map((room: any) => {
              const fillPercent = room.max_players > 0 ? (room.booking_count / room.max_players) * 100 : 0;
              const fillClass = fillPercent < 50 ? 'player-bar-fill-low' : fillPercent < 80 ? 'player-bar-fill-medium' : 'player-bar-fill-high';
              const canJoin = user?.role === 'player' && room.status === 'open' && room.booking_count < room.max_players;

              return (
                <div key={room.id} className="room-card" onClick={() => navigate(`/rooms/${room.id}`)}>
                  <div className="room-card-header">
                    <div>
                      <span className={`tag ${getTypeTagClass(room.script_type)}`} style={{ marginBottom: 8 }}>
                        {getTypeEmoji(room.script_type)} {room.script_type}
                      </span>
                      <div className="room-card-script" style={{ marginTop: 8 }}>{room.script_name}</div>
                    </div>
                    <span className={`status status-${room.status}`}>{getStatusLabel(room.status)}</span>
                  </div>

                  <div className="room-card-store">📍 {room.store_title} · {room.store_address || '地址待定'}</div>

                  <div className="room-card-info">
                    <span className="room-card-info-item">📅 {formatDate(room.start_time)}</span>
                    <span className="room-card-info-item">⏱ {room.duration}分钟</span>
                    <span className="room-card-info-item">难度: {renderDifficulty(room.difficulty)}</span>
                  </div>

                  <div className="room-card-players">
                    <span style={{ fontSize: 13, fontWeight: 600, color: room.booking_count >= room.max_players ? 'var(--danger)' : 'var(--success)' }}>
                      {room.booking_count}/{room.max_players}人
                    </span>
                    <div className="player-bar">
                      <div className={`player-bar-fill ${fillClass}`} style={{ width: `${fillPercent}%` }}></div>
                    </div>
                  </div>

                  <div className="room-card-footer">
                    <div className="room-card-price">
                      ¥{room.price} <span>/人</span>
                    </div>
                    {canJoin ? (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={(e) => { e.stopPropagation(); handleJoin(room.id); }}
                      >
                        我要加入
                      </button>
                    ) : room.status === 'full' ? (
                      <button className="btn btn-ghost btn-sm" disabled>已满员</button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
