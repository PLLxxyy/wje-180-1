import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth, useToast } from '../App';
import StarRating from '../components/StarRating';
import { formatDate, getTypeTagClass, getStatusLabel, getTypeEmoji, renderDifficulty } from '../utils/helpers';

export default function RoomDetail() {
  const { id } = useParams<{ id: string }>();
  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [roleName, setRoleName] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) loadRoom(id);
  }, [id]);

  const loadRoom = async (roomId: string) => {
    setLoading(true);
    try {
      const data = await api.getRoom(roomId);
      setRoom(data);
    } catch (err) {
      showToast('加载失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!user) {
      showToast('请先登录', 'error');
      navigate('/login');
      return;
    }

    setSubmitting(true);
    try {
      await api.createBooking({ roomId: id, roleName });
      showToast('报名成功！', 'success');
      setShowJoinModal(false);
      if (id) loadRoom(id);
    } catch (err: any) {
      showToast(err.message || '报名失败', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await api.cancelBooking(bookingId);
      showToast('已取消预约', 'success');
      if (id) loadRoom(id);
    } catch (err: any) {
      showToast(err.message || '取消失败', 'error');
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewContent.trim()) {
      showToast('请输入评价内容', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await api.createReview({ roomId: id, rating: reviewRating, content: reviewContent });
      showToast('评价成功！', 'success');
      setShowReviewModal(false);
      setReviewContent('');
      setReviewRating(5);
    } catch (err: any) {
      showToast(err.message || '评价失败', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading"><div className="spinner"></div><span>加载中...</span></div>;
  }

  if (!room) {
    return (
      <div className="page">
        <div className="container">
          <div className="empty-state">
            <div className="empty-state-icon">😕</div>
            <p className="empty-state-text">场次不存在</p>
            <button className="btn btn-primary" onClick={() => navigate('/rooms')}>返回组局广场</button>
          </div>
        </div>
      </div>
    );
  }

  const isBooked = room.bookings?.some((b: any) => b.user_id === user?.id);
  const myBooking = room.bookings?.find((b: any) => b.user_id === user?.id);
  const canJoin = user?.role === 'player' && room.status === 'open' && !isBooked;
  const canReview = room.status === 'completed' && isBooked;
  const fillPercent = room.max_players > 0 ? (room.booking_count / room.max_players) * 100 : 0;

  return (
    <div className="page">
      <div className="container">
        <div className="detail-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <span className={`tag ${getTypeTagClass(room.script_type)}`} style={{ fontSize: 14, padding: '6px 14px' }}>
              {getTypeEmoji(room.script_type)} {room.script_type}
            </span>
            <span className={`status status-${room.status}`} style={{ fontSize: 14, padding: '6px 14px' }}>
              {getStatusLabel(room.status)}
            </span>
          </div>

          <div className="detail-title">{room.script_name}</div>

          <div className="detail-meta">
            <span className="tag tag-default">难度: {renderDifficulty(room.difficulty)}</span>
            <span className="tag tag-default">👥 {room.min_players}-{room.script_max_players}人</span>
            <span className="tag tag-default">⏱ {room.duration}分钟</span>
            {room.avg_rating > 0 && <span className="tag tag-default">⭐ {room.avg_rating.toFixed(1)}</span>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, margin: '20px 0', padding: 20, background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 4 }}>开始时间</div>
              <div style={{ fontWeight: 600 }}>📅 {formatDate(room.start_time)}</div>
            </div>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 4 }}>结束时间</div>
              <div style={{ fontWeight: 600 }}>📅 {formatDate(room.end_time)}</div>
            </div>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 4 }}>店家</div>
              <div style={{ fontWeight: 600 }}>🏪 {room.store_title}</div>
            </div>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 4 }}>地点</div>
              <div style={{ fontWeight: 600 }}>📍 {room.location || '待定'}</div>
            </div>
          </div>

          {/* Player progress */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>
                已报名: {room.booking_count}/{room.max_players}人
              </span>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)' }}>
                ¥{room.price}/人
              </span>
            </div>
            <div className="player-bar" style={{ height: 10 }}>
              <div
                className={`player-bar-fill ${fillPercent < 50 ? 'player-bar-fill-low' : fillPercent < 80 ? 'player-bar-fill-medium' : 'player-bar-fill-high'}`}
                style={{ width: `${fillPercent}%` }}
              ></div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 12 }}>
            {canJoin && (
              <button className="btn btn-primary btn-lg" onClick={() => setShowJoinModal(true)}>
                我要加入
              </button>
            )}
            {isBooked && room.status !== 'completed' && (
              <button className="btn btn-danger" onClick={() => myBooking && handleCancelBooking(myBooking.id)}>
                取消预约
              </button>
            )}
            {canReview && (
              <button className="btn btn-success" onClick={() => setShowReviewModal(true)}>
                写评价
              </button>
            )}
            <button className="btn btn-ghost" onClick={() => navigate(`/scripts/${room.script_id}`)}>
              查看剧本详情
            </button>
          </div>
        </div>

        {/* Script description */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <span>📖 剧本简介</span>
          </div>
          <div className="card-body">
            <p style={{ lineHeight: 1.8, fontSize: 15 }}>{room.script_description}</p>
          </div>
        </div>

        {/* Participants */}
        <div className="card">
          <div className="card-header">
            <span>👥 已报名玩家 ({room.bookings?.length || 0})</span>
          </div>
          <div className="card-body">
            {room.bookings && room.bookings.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                {room.bookings.map((booking: any, index: number) => (
                  <div key={booking.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 16px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)'
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: 'var(--primary-light)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', fontSize: 16
                    }}>
                      {booking.user_name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{booking.user_name}</div>
                      {booking.role_name && (
                        <div style={{ fontSize: 12, color: 'var(--text-light)' }}>角色: {booking.role_name}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: 30 }}>
                <p>暂无玩家报名</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Join Modal */}
      {showJoinModal && (
        <div className="modal-overlay" onClick={() => setShowJoinModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>加入场次</h2>
              <button className="modal-close" onClick={() => setShowJoinModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: 16, color: 'var(--text-light)' }}>
                即将加入 "{room.script_name}" 的场次
              </p>
              <div className="form-group">
                <label className="form-label">选择角色（可选）</label>
                <input
                  type="text"
                  className="form-input"
                  value={roleName}
                  onChange={e => setRoleName(e.target.value)}
                  placeholder="输入你想扮演的角色名称，或留空"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowJoinModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleJoin} disabled={submitting}>
                {submitting ? '提交中...' : '确认加入'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>写评价</h2>
              <button className="modal-close" onClick={() => setShowReviewModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">评分</label>
                <StarRating rating={reviewRating} onChange={setReviewRating} size={28} />
              </div>
              <div className="form-group">
                <label className="form-label">评价内容</label>
                <textarea
                  className="form-textarea"
                  value={reviewContent}
                  onChange={e => setReviewContent(e.target.value)}
                  placeholder="分享你的体验..."
                  rows={4}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowReviewModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleSubmitReview} disabled={submitting}>
                {submitting ? '提交中...' : '提交评价'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
