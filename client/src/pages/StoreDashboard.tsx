import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useToast } from '../App';
import { formatDate, getStatusLabel, getTypeTagClass } from '../utils/helpers';

export default function StoreDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [scripts, setScripts] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, scriptsData, roomsData] = await Promise.all([
        api.getStoreStats(),
        api.getScripts(),
        api.getRooms({ status: 'all' })
      ]);
      setStats(statsData);
      setScripts(scriptsData);
      setRooms(roomsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteRoom = async (roomId: string) => {
    try {
      await api.completeRoom(roomId);
      showToast('场次已结束', 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || '操作失败', 'error');
    }
  };

  const handleCancelRoom = async (roomId: string) => {
    if (!confirm('确定要取消该场次吗？')) return;
    try {
      await api.cancelRoom(roomId);
      showToast('场次已取消', 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || '操作失败', 'error');
    }
  };

  const handleDeleteScript = async (scriptId: string) => {
    if (!confirm('确定要删除该剧本吗？')) return;
    try {
      await api.deleteScript(scriptId);
      showToast('剧本已删除', 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || '删除失败', 'error');
    }
  };

  if (loading) {
    return <div className="loading"><div className="spinner"></div><span>加载中...</span></div>;
  }

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>🏪 店家后台</h1>
          <p>管理剧本和场次，查看经营数据</p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-4" style={{ marginBottom: 24 }}>
            <div className="stat-card">
              <div className="stat-card-value">{stats.totalScripts}</div>
              <div className="stat-card-label">剧本数量</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-value">{stats.totalRooms}</div>
              <div className="stat-card-label">总场次</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-value">{stats.totalBookings}</div>
              <div className="stat-card-label">总报名</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-value">¥{stats.totalRevenue}</div>
              <div className="stat-card-label">总营收</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="tabs">
          <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
            数据概览
          </button>
          <button className={`tab ${activeTab === 'scripts' ? 'active' : ''}`} onClick={() => setActiveTab('scripts')}>
            剧本管理
          </button>
          <button className={`tab ${activeTab === 'rooms' ? 'active' : ''}`} onClick={() => setActiveTab('rooms')}>
            场次管理
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div>
            {/* Popular Scripts */}
            <div className="card" style={{ marginBottom: 24 }}>
              <div className="card-header">
                <span>🏆 热门剧本排行</span>
              </div>
              <div className="card-body">
                {stats.popularScripts.length > 0 ? (
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>排名</th>
                          <th>剧本名称</th>
                          <th>类型</th>
                          <th>评分</th>
                          <th>评价数</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.popularScripts.map((s: any, i: number) => (
                          <tr key={i}>
                            <td>
                              {i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}
                            </td>
                            <td style={{ fontWeight: 600 }}>{s.name}</td>
                            <td><span className={`tag ${getTypeTagClass(s.type)}`}>{s.type}</span></td>
                            <td>⭐ {s.avg_rating > 0 ? s.avg_rating.toFixed(1) : '-'}</td>
                            <td>{s.review_count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: 20 }}>暂无数据</p>
                )}
              </div>
            </div>

            {/* Recent Rooms */}
            <div className="card">
              <div className="card-header">
                <span>📋 最近场次</span>
              </div>
              <div className="card-body">
                {stats.recentRooms.length > 0 ? (
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>剧本</th>
                          <th>开始时间</th>
                          <th>状态</th>
                          <th>报名人数</th>
                          <th>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recentRooms.map((r: any) => (
                          <tr key={r.id}>
                            <td style={{ fontWeight: 600 }}>{r.script_name}</td>
                            <td>{formatDate(r.start_time)}</td>
                            <td><span className={`status status-${r.status}`}>{getStatusLabel(r.status)}</span></td>
                            <td>{r.booking_count}/{r.max_players}</td>
                            <td>
                              <div style={{ display: 'flex', gap: 8 }}>
                                {r.status === 'open' || r.status === 'full' ? (
                                  <>
                                    <button className="btn btn-success btn-sm" onClick={() => handleCompleteRoom(r.id)}>结束</button>
                                    <button className="btn btn-ghost btn-sm" onClick={() => handleCancelRoom(r.id)}>取消</button>
                                  </>
                                ) : null}
                                <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/rooms/${r.id}`)}>查看</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: 20 }}>暂无场次</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Scripts Tab */}
        {activeTab === 'scripts' && (
          <div>
            <div style={{ marginBottom: 16, textAlign: 'right' }}>
              <button className="btn btn-primary" onClick={() => navigate('/create-script')}>+ 发布剧本</button>
            </div>
            {scripts.length > 0 ? (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>剧本名称</th>
                      <th>类型</th>
                      <th>难度</th>
                      <th>人数</th>
                      <th>时长</th>
                      <th>评分</th>
                      <th>评价数</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scripts.map((s: any) => (
                      <tr key={s.id}>
                        <td style={{ fontWeight: 600 }}>{s.name}</td>
                        <td><span className={`tag ${getTypeTagClass(s.type)}`}>{s.type}</span></td>
                        <td>{'★'.repeat(s.difficulty)}{'☆'.repeat(5 - s.difficulty)}</td>
                        <td>{s.min_players}-{s.max_players}人</td>
                        <td>{s.duration}分钟</td>
                        <td>⭐ {s.avg_rating > 0 ? s.avg_rating.toFixed(1) : '-'}</td>
                        <td>{s.review_count}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/scripts/${s.id}`)}>查看</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDeleteScript(s.id)}>删除</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📚</div>
                <p className="empty-state-text">暂无剧本</p>
                <button className="btn btn-primary" onClick={() => navigate('/create-script')}>发布第一个剧本</button>
              </div>
            )}
          </div>
        )}

        {/* Rooms Tab */}
        {activeTab === 'rooms' && (
          <div>
            <div style={{ marginBottom: 16, textAlign: 'right' }}>
              <button className="btn btn-primary" onClick={() => navigate('/create-room')}>+ 创建场次</button>
            </div>
            {rooms.length > 0 ? (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>剧本</th>
                      <th>开始时间</th>
                      <th>结束时间</th>
                      <th>人数</th>
                      <th>状态</th>
                      <th>价格</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rooms.map((r: any) => (
                      <tr key={r.id}>
                        <td style={{ fontWeight: 600 }}>{r.script_name}</td>
                        <td>{formatDate(r.start_time)}</td>
                        <td>{formatDate(r.end_time)}</td>
                        <td>{r.booking_count}/{r.max_players}</td>
                        <td><span className={`status status-${r.status}`}>{getStatusLabel(r.status)}</span></td>
                        <td>¥{r.price}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 8 }}>
                            {(r.status === 'open' || r.status === 'full') && (
                              <>
                                <button className="btn btn-success btn-sm" onClick={() => handleCompleteRoom(r.id)}>结束</button>
                                <button className="btn btn-ghost btn-sm" onClick={() => handleCancelRoom(r.id)}>取消</button>
                              </>
                            )}
                            <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/rooms/${r.id}`)}>查看</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">🎯</div>
                <p className="empty-state-text">暂无场次</p>
                <button className="btn btn-primary" onClick={() => navigate('/create-room')}>创建第一个场次</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
