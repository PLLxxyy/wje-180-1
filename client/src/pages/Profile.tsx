import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth, useToast } from '../App';
import StarRating from '../components/StarRating';
import { formatDate, getTypeTagClass, getTypeEmoji } from '../utils/helpers';

export default function Profile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await api.getUserProfile();
      setProfile(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading"><div className="spinner"></div><span>加载中...</span></div>;
  }

  if (!profile) {
    return (
      <div className="page">
        <div className="container">
          <div className="empty-state">
            <p className="empty-state-text">加载失败</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        {/* Profile Header */}
        <div className="profile-header">
          <div className="profile-avatar">
            {profile.nickname?.charAt(0) || '?'}
          </div>
          <div className="profile-info">
            <h2>{profile.nickname}</h2>
            <p>@{profile.username}</p>
            {profile.phone && <p>📱 {profile.phone}</p>}
            <p style={{ fontSize: 12, color: 'var(--text-lighter)' }}>注册于 {formatDate(profile.createdAt)}</p>
          </div>
        </div>

        {/* Achievements */}
        {profile.achievements && profile.achievements.length > 0 && (
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header">
              <span>🏆 个人成就</span>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {profile.achievements.map((achievement: string, i: number) => (
                  <div key={i} className="achievement">
                    🏅 {achievement}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-3" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-card-value">{profile.stats.totalPlayed}</div>
            <div className="stat-card-label">玩过的剧本</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-value">{profile.stats.totalReviewed}</div>
            <div className="stat-card-label">写过的评价</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-value">{profile.stats.typeDistribution?.length || 0}</div>
            <div className="stat-card-label">体验过的类型</div>
          </div>
        </div>

        {/* Type Distribution */}
        {profile.stats.typeDistribution && profile.stats.typeDistribution.length > 0 && (
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header">
              <span>📊 剧本类型偏好</span>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {profile.stats.typeDistribution.map((t: any, i: number) => (
                  <div key={i} style={{ textAlign: 'center', flex: 1, minWidth: 100, padding: 16, background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>{getTypeEmoji(t.type)}</div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{t.type}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary)' }}>{t.count}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="tabs">
          <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
            玩过的剧本
          </button>
          <button className={`tab ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => setActiveTab('reviews')}>
            我的评价
          </button>
        </div>

        {/* Played Scripts */}
        {activeTab === 'overview' && (
          <div>
            {profile.playedScripts && profile.playedScripts.length > 0 ? (
              <div className="grid grid-3">
                {profile.playedScripts.map((script: any) => (
                  <div
                    key={script.id}
                    className="script-card"
                    onClick={() => navigate(`/scripts/${script.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="script-card-body">
                      <div className="script-card-title">{script.name}</div>
                      <div className="script-card-meta">
                        <span className={`tag ${getTypeTagClass(script.type)}`}>{getTypeEmoji(script.type)} {script.type}</span>
                        {script.role_name && <span className="tag tag-default">角色: {script.role_name}</span>}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-lighter)', marginTop: 8 }}>
                        体验时间: {formatDate(script.played_at)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">🎭</div>
                <p className="empty-state-text">还没有玩过任何剧本</p>
                <button className="btn btn-primary" onClick={() => navigate('/rooms')}>去组局广场看看</button>
              </div>
            )}
          </div>
        )}

        {/* Reviews */}
        {activeTab === 'reviews' && (
          <div>
            {profile.reviews && profile.reviews.length > 0 ? (
              profile.reviews.map((review: any) => (
                <div key={review.id} className="review-card">
                  <div className="review-card-header">
                    <div>
                      <span style={{ fontWeight: 600, marginRight: 8 }}>{review.script_name}</span>
                      <span className={`tag ${getTypeTagClass(review.script_type)}`}>{review.script_type}</span>
                      <StarRating rating={review.rating} readonly size={14} />
                    </div>
                    <span className="review-card-date">{formatDate(review.created_at)}</span>
                  </div>
                  <div className="review-card-content">{review.content}</div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">💬</div>
                <p className="empty-state-text">还没有写过评价</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
