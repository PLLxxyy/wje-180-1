import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useToast } from '../App';
import { formatDate, getStatusLabel, getTypeTagClass } from '../utils/helpers';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [pendingStores, setPendingStores] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, storesData, pendingData] = await Promise.all([
        api.getAdminStats(),
        api.getAllStores(),
        api.getPendingStores()
      ]);
      setStats(statsData);
      setStores(storesData);
      setPendingStores(pendingData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveStore = async (storeId: string, status: string) => {
    try {
      await api.updateStoreStatus(storeId, status);
      showToast(status === 'approved' ? '已通过审核' : '已拒绝审核', 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || '操作失败', 'error');
    }
  };

  if (loading) {
    return <div className="loading"><div className="spinner"></div><span>加载中...</span></div>;
  }

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>⚙️ 管理后台</h1>
          <p>平台数据概览与管理</p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-4" style={{ marginBottom: 24 }}>
            <div className="stat-card">
              <div className="stat-card-value">{stats.totalUsers}</div>
              <div className="stat-card-label">注册玩家</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-value">{stats.totalStores}</div>
              <div className="stat-card-label">注册店家</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-value">{stats.totalRooms}</div>
              <div className="stat-card-label">总组局量</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-value">{stats.totalBookings}</div>
              <div className="stat-card-label">总报名数</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="tabs">
          <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
            数据概览
          </button>
          <button className={`tab ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
            待审核店家
            {pendingStores.length > 0 && <span style={{ marginLeft: 8, background: 'var(--danger)', color: 'white', borderRadius: 10, padding: '2px 8px', fontSize: 12 }}>{pendingStores.length}</span>}
          </button>
          <button className={`tab ${activeTab === 'stores' ? 'active' : ''}`} onClick={() => setActiveTab('stores')}>
            全部店家
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div>
            {/* Recent activity */}
            <div className="grid grid-2" style={{ marginBottom: 24 }}>
              <div className="stat-card">
                <div className="stat-card-value" style={{ color: 'var(--success)' }}>{stats.recentUsers}</div>
                <div className="stat-card-label">近7天新用户</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-value" style={{ color: 'var(--accent)' }}>{stats.recentRooms}</div>
                <div className="stat-card-label">近7天新场次</div>
              </div>
            </div>

            {/* Type Distribution */}
            <div className="grid grid-2">
              <div className="card">
                <div className="card-header">
                  <span>📊 场次类型分布</span>
                </div>
                <div className="card-body">
                  {stats.typeDistribution.length > 0 ? (
                    stats.typeDistribution.map((t: any, i: number) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                        <span className={`tag ${getTypeTagClass(t.type)}`}>{t.type}</span>
                        <span style={{ fontWeight: 600 }}>{t.count}场</span>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: 20 }}>暂无数据</p>
                  )}
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <span>🏆 热门剧本排行</span>
                </div>
                <div className="card-body">
                  {stats.popularScripts.length > 0 ? (
                    stats.popularScripts.slice(0, 5).map((s: any, i: number) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                        <div>
                          <span style={{ marginRight: 8 }}>{i < 3 ? ['🥇', '🥈', '🥉'][i] : `${i + 1}.`}</span>
                          <span style={{ fontWeight: 600 }}>{s.name}</span>
                          <span className={`tag ${getTypeTagClass(s.type)}`} style={{ marginLeft: 8 }}>{s.type}</span>
                        </div>
                        <span style={{ fontSize: 13, color: 'var(--accent)' }}>⭐ {s.avg_rating > 0 ? s.avg_rating.toFixed(1) : '-'}</span>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: 20 }}>暂无数据</p>
                  )}
                </div>
              </div>
            </div>

            {/* Daily rooms */}
            {stats.dailyRooms.length > 0 && (
              <div className="card" style={{ marginTop: 24 }}>
                <div className="card-header">
                  <span>📈 近7天组局趋势</span>
                </div>
                <div className="card-body">
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 120 }}>
                    {stats.dailyRooms.map((d: any, i: number) => {
                      const maxCount = Math.max(...stats.dailyRooms.map((x: any) => x.count));
                      const height = maxCount > 0 ? (d.count / maxCount) * 100 : 0;
                      return (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 600 }}>{d.count}</span>
                          <div style={{ width: '100%', height: `${height}px`, background: 'var(--primary)', borderRadius: '4px 4px 0 0', minHeight: 4 }}></div>
                          <span style={{ fontSize: 11, color: 'var(--text-lighter)' }}>{d.date.substring(5)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pending Stores Tab */}
        {activeTab === 'pending' && (
          <div>
            {pendingStores.length > 0 ? (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>店家名称</th>
                      <th>用户名</th>
                      <th>店铺名</th>
                      <th>地址</th>
                      <th>手机号</th>
                      <th>注册时间</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingStores.map((s: any) => (
                      <tr key={s.id}>
                        <td style={{ fontWeight: 600 }}>{s.nickname}</td>
                        <td>{s.username}</td>
                        <td>{s.storeName || '-'}</td>
                        <td>{s.storeAddress || '-'}</td>
                        <td>{s.phone || '-'}</td>
                        <td>{formatDate(s.createdAt)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn btn-success btn-sm" onClick={() => handleApproveStore(s.id, 'approved')}>通过</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleApproveStore(s.id, 'rejected')}>拒绝</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">✅</div>
                <p className="empty-state-text">暂无待审核的店家</p>
              </div>
            )}
          </div>
        )}

        {/* All Stores Tab */}
        {activeTab === 'stores' && (
          <div>
            {stores.length > 0 ? (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>店家名称</th>
                      <th>用户名</th>
                      <th>店铺名</th>
                      <th>地址</th>
                      <th>状态</th>
                      <th>注册时间</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stores.map((s: any) => (
                      <tr key={s.id}>
                        <td style={{ fontWeight: 600 }}>{s.nickname}</td>
                        <td>{s.username}</td>
                        <td>{s.storeName || '-'}</td>
                        <td>{s.storeAddress || '-'}</td>
                        <td>
                          <span className={`tag tag-approval-${s.status}`}>
                            {getStatusLabel(s.status)}
                          </span>
                        </td>
                        <td>{formatDate(s.createdAt)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 8 }}>
                            {s.status === 'pending' && (
                              <>
                                <button className="btn btn-success btn-sm" onClick={() => handleApproveStore(s.id, 'approved')}>通过</button>
                                <button className="btn btn-danger btn-sm" onClick={() => handleApproveStore(s.id, 'rejected')}>拒绝</button>
                              </>
                            )}
                            {s.status === 'rejected' && (
                              <button className="btn btn-success btn-sm" onClick={() => handleApproveStore(s.id, 'approved')}>通过</button>
                            )}
                            {s.status === 'approved' && (
                              <button className="btn btn-ghost btn-sm" onClick={() => handleApproveStore(s.id, 'rejected')}>撤销</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">🏪</div>
                <p className="empty-state-text">暂无注册店家</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
