import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useToast } from '../App';
import StarRating from '../components/StarRating';
import { formatDate, getTypeTagClass, getStatusLabel, getTypeEmoji, renderDifficulty } from '../utils/helpers';

export default function MyBookings() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadBookings();
  }, [statusFilter]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const data = await api.getMyBookings(statusFilter === 'all' ? undefined : statusFilter);
      setBookings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('确定要取消预约吗？')) return;
    try {
      await api.cancelBooking(bookingId);
      showToast('已取消预约', 'success');
      loadBookings();
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
      await api.createReview({
        roomId: selectedBooking.room_id,
        rating: reviewRating,
        content: reviewContent
      });
      showToast('评价成功！', 'success');
      setShowReviewModal(false);
      setReviewContent('');
      setReviewRating(5);
      loadBookings();
    } catch (err: any) {
      showToast(err.message || '评价失败', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openReviewModal = (booking: any) => {
    setSelectedBooking(booking);
    setShowReviewModal(true);
  };

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>📋 我的预约</h1>
          <p>查看和管理你的场次预约</p>
        </div>

        {/* Filters */}
        <div className="filters">
          <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">全部状态</option>
            <option value="confirmed">已确认</option>
            <option value="completed">已结束</option>
            <option value="cancelled">已取消</option>
          </select>
        </div>

        {loading ? (
          <div className="loading"><div className="spinner"></div><span>加载中...</span></div>
        ) : bookings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <p className="empty-state-text">暂无预约记录</p>
            <button className="btn btn-primary" onClick={() => navigate('/rooms')}>去组局广场看看</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {bookings.map((booking: any) => (
              <div key={booking.id} className="card">
                <div className="card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span className={`tag ${getTypeTagClass(booking.script_type)}`}>
                          {getTypeEmoji(booking.script_type)} {booking.script_type}
                        </span>
                        <span className={`status status-${booking.status}`}>{getStatusLabel(booking.status)}</span>
                        <span className={`status status-${booking.room_status}`}>{getStatusLabel(booking.room_status)}</span>
                      </div>
                      <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, cursor: 'pointer' }}
                        onClick={() => navigate(`/rooms/${booking.room_id}`)}>
                        {booking.script_name}
                      </h3>
                      <p style={{ fontSize: 13, color: 'var(--text-light)' }}>
                        🏪 {booking.store_title}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary)' }}>¥{booking.price}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-lighter)' }}>每人</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 13, color: 'var(--text-light)', marginBottom: 16 }}>
                    <span>📅 {formatDate(booking.start_time)}</span>
                    <span>📍 {booking.location || '待定'}</span>
                    <span>难度: {renderDifficulty(booking.difficulty)}</span>
                    {booking.role_name && <span>角色: {booking.role_name}</span>}
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/rooms/${booking.room_id}`)}>
                      查看场次
                    </button>
                    {booking.status === 'confirmed' && (
                      <button className="btn btn-danger btn-sm" onClick={() => handleCancelBooking(booking.id)}>
                        取消预约
                      </button>
                    )}
                    {booking.status === 'completed' && (
                      <button className="btn btn-success btn-sm" onClick={() => openReviewModal(booking)}>
                        写评价
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedBooking && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>评价: {selectedBooking.script_name}</h2>
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
