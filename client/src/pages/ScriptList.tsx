import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth, useToast } from '../App';
import { getTypeTagClass, getTypeCoverClass, getTypeEmoji, renderDifficulty } from '../utils/helpers';

export default function ScriptList() {
  const [scripts, setScripts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [sort, setSort] = useState('latest');
  const [favoriteLoadingId, setFavoriteLoadingId] = useState<string | null>(null);
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadScripts();
  }, [type, sort]);

  const loadScripts = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (type !== 'all') params.type = type;
      if (sort !== 'latest') params.sort = sort;
      if (search) params.search = search;
      const data = await api.getScripts(params);
      setScripts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadScripts();
  };

  const handleToggleFavorite = async (e: React.MouseEvent, scriptId: string, isFavorited: boolean) => {
    e.stopPropagation();
    if (!user) {
      showToast('请先登录', 'error');
      return;
    }

    setFavoriteLoadingId(scriptId);
    try {
      if (isFavorited) {
        await api.unfavoriteScript(scriptId);
        showToast('已取消收藏', 'success');
      } else {
        await api.favoriteScript(scriptId);
        showToast('收藏成功！有新场次时会通知您', 'success');
      }
      setScripts(prev => prev.map(s =>
        s.id === scriptId ? { ...s, is_favorited: !isFavorited } : s
      ));
    } catch (err: any) {
      showToast(err.message || '操作失败', 'error');
    } finally {
      setFavoriteLoadingId(null);
    }
  };

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>📚 剧本库</h1>
          <p>发现精彩剧本，开启推理之旅</p>
        </div>

        <div className="filters">
          <input
            type="text"
            className="search-input"
            placeholder="搜索剧本名称或关键词..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          <select className="filter-select" value={type} onChange={e => setType(e.target.value)}>
            <option value="all">全部类型</option>
            <option value="推理">推理</option>
            <option value="情感">情感</option>
            <option value="恐怖">恐怖</option>
            <option value="欢乐">欢乐</option>
          </select>
          <select className="filter-select" value={sort} onChange={e => setSort(e.target.value)}>
            <option value="latest">最新发布</option>
            <option value="rating">评分最高</option>
            <option value="popular">最多评价</option>
          </select>
          <button className="btn btn-primary" onClick={handleSearch}>搜索</button>
        </div>

        {loading ? (
          <div className="loading"><div className="spinner"></div><span>加载中...</span></div>
        ) : scripts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📚</div>
            <p className="empty-state-text">暂无剧本</p>
          </div>
        ) : (
          <div className="grid grid-3">
            {scripts.map((script: any) => (
              <div
                key={script.id}
                className="script-card"
                onClick={() => navigate(`/scripts/${script.id}`)}
              >
                <div className={`script-card-cover ${getTypeCoverClass(script.type)}`}>
                  {getTypeEmoji(script.type)}
                  <button
                    onClick={(e) => handleToggleFavorite(e, script.id, !!script.is_favorited)}
                    disabled={favoriteLoadingId === script.id}
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      background: 'rgba(255,255,255,0.95)',
                      border: 'none',
                      borderRadius: 20,
                      width: 32,
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: favoriteLoadingId === script.id ? 'not-allowed' : 'pointer',
                      fontSize: 16,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      opacity: favoriteLoadingId === script.id ? 0.6 : 1,
                      transition: 'all 0.2s',
                    }}
                    title={script.is_favorited ? '取消收藏' : '收藏'}
                  >
                    {favoriteLoadingId === script.id ? '⏳' : (script.is_favorited ? '❤️' : '🤍')}
                  </button>
                </div>
                <div className="script-card-body">
                  <div className="script-card-title">{script.name}</div>
                  <div className="script-card-meta">
                    <span className={`tag ${getTypeTagClass(script.type)}`}>{script.type}</span>
                    <span className="tag tag-default">{renderDifficulty(script.difficulty)}</span>
                    <span className="tag tag-default">👥 {script.min_players}-{script.max_players}人</span>
                    <span className="tag tag-default">⏱ {script.duration}分钟</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <span style={{ fontSize: 13, color: 'var(--accent)' }}>
                      ★ {script.avg_rating > 0 ? script.avg_rating.toFixed(1) : '暂无'}
                      {script.review_count > 0 && <span style={{ color: 'var(--text-lighter)', marginLeft: 4 }}>({script.review_count}条)</span>}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-lighter)' }}>{script.store_title || script.store_name}</span>
                  </div>
                  <p className="script-card-desc" style={{ marginTop: 8 }}>{script.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
