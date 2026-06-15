import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth, useToast } from '../App';
import StarRating from '../components/StarRating';
import { getTypeTagClass, getTypeCoverClass, getTypeEmoji, renderDifficulty, formatDate, getStatusLabel } from '../utils/helpers';

export default function ScriptDetail() {
  const { id } = useParams<{ id: string }>();
  const [script, setScript] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) loadScript(id);
  }, [id]);

  const loadScript = async (scriptId: string) => {
    setLoading(true);
    try {
      const data = await api.getScript(scriptId);
      setScript(data);
    } catch (err) {
      showToast('加载失败', 'error');
    } finally {
      setLoading(false);
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
        roomId: selectedRoomId,
        rating: reviewRating,
        content: reviewContent
      });
      showToast('评价成功！', 'success');
      setShowReviewModal(false);
      setReviewContent('');
      setReviewRating(5);
      if (id) loadScript(id);
    } catch (err: any) {
      showToast(err.message || '评价失败', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      showToast('请先登录', 'error');
      return;
    }
    if (!id) return;

    setFavoriteLoading(true);
    try {
      if (script.is_favorited) {
        await api.unfavoriteScript(id);
        showToast('已取消收藏', 'success');
        setScript({ ...script, is_favorited: false, favorite_count: Math.max(0, (script.favorite_count || 0) - 1) });
      } else {
        await api.favoriteScript(id);
        showToast('收藏成功！有新场次时会通知您', 'success');
        setScript({ ...script, is_favorited: true, favorite_count: (script.favorite_count || 0) + 1 });
      }
    } catch (err: any) {
      showToast(err.message || '操作失败', 'error');
    } finally {
      setFavoriteLoading(false);
    }
  };

  if (loading) {
    return <div className="loading"><div className="spinner"></div><span>加载中...</span></div>;
  }

  if (!script) {
    return (
      <div className="page">
        <div className="container">
          <div className="empty-state">
            <div className="empty-state-icon">😕</div>
            <p className="empty-state-text">剧本不存在</p>
            <button className="btn btn-primary" onClick={() => navigate('/scripts')}>返回剧本库</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <div className="detail-header">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <div className={`detail-cover ${getTypeCoverClass(script.type)}`} style={{ borderRadius: 'var(--radius-sm)', flexShrink: 0, width: 200, height: 200, margin: 0 }}>
              {getTypeEmoji(script.type)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div className="detail-title" style={{ margin: 0 }}>{script.name}</div>
                <button
                  className={`btn ${script.is_favorited ? 'btn-warning' : 'btn-ghost'}`}
                  onClick={handleToggleFavorite}
                  disabled={favoriteLoading}
                  style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                >
                  {favoriteLoading ? '处理中...' : (script.is_favorited ? '❤️ 已收藏' : '🤍 收藏')}
                  {script.favorite_count > 0 && (
                    <span style={{ marginLeft: 4, fontSize: 12, opacity: 0.8 }}>({script.favorite_count})</span>
                  )}
                </button>
              </div>
              <div className="detail-meta" style={{ marginTop: 8 }}>
                <span className={`tag ${getTypeTagClass(script.type)}`}>{script.type}</span>
                <span className="tag tag-default">难度: {renderDifficulty(script.difficulty)}</span>
                <span className="tag tag-default">👥 {script.min_players}-{script.max_players}人</span>
                <span className="tag tag-default">⏱ {script.duration}分钟</span>
                <span className="tag tag-default">⭐ {script.avg_rating > 0 ? script.avg_rating.toFixed(1) : '暂无评分'}</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 16, marginTop: 8 }}>
                店家: {script.store_title || script.store_name}
                {script.store_address && ` · ${script.store_address}`}
              </p>
            </div>
          </div>
          <div className="detail-desc">{script.description}</div>
          {script.tags && JSON.parse(typeof script.tags === 'string' ? script.tags : '[]').length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
              {JSON.parse(typeof script.tags === 'string' ? script.tags : '[]').map((tag: string, i: number) => (
                <span key={i} className="tag tag-default">#{tag}</span>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming rooms */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <span>🎯 即将开场</span>
          </div>
          <div className="card-body">
            {script.rooms && script.rooms.length > 0 ? (
              script.rooms.map((room: any) => (
                <div key={room.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 0', borderBottom: '1px solid var(--border)'
                }}>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{formatDate(room.start_time)}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-light)' }}>
                      📍 {room.location || '待定'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className={`status status-${room.status}`}>{getStatusLabel(room.status)}</span>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => navigate(`/rooms/${room.id}`)}
                    >
                      查看详情
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state" style={{ padding: 30 }}>
                <p>暂无场次</p>
              </div>
            )}
          </div>
        </div>

        {/* Reviews */}
        <div className="card">
          <div className="card-header">
            <span>💬 评价 ({script.reviews?.length || 0})</span>
          </div>
          <div className="card-body">
            {script.reviews && script.reviews.length > 0 ? (
              script.reviews.map((review: any) => (
                <div key={review.id} className="review-card">
                  <div className="review-card-header">
                    <div>
                      <span className="review-card-user">{review.user_name}</span>
                      <StarRating rating={review.rating} readonly size={14} />
                    </div>
                    <span className="review-card-date">{formatDate(review.created_at)}</span>
                  </div>
                  <div className="review-card-content">{review.content}</div>
                </div>
              ))
            ) : (
              <div className="empty-state" style={{ padding: 30 }}>
                <div className="empty-state-icon">💬</div>
                <p>暂无评价</p>
              </div>
            )}
          </div>
        </div>
      </div>

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
