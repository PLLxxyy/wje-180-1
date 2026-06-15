import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth, useToast } from '../App';

export default function CreateRoom() {
  const [scripts, setScripts] = useState<any[]>([]);
  const [scriptId, setScriptId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState(100);
  const [loading, setLoading] = useState(false);
  const [loadingScripts, setLoadingScripts] = useState(true);
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadScripts();
  }, []);

  const loadScripts = async () => {
    try {
      const data = await api.getScripts({ store_id: user?.id || '' });
      setScripts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingScripts(false);
    }
  };

  const selectedScript = scripts.find(s => s.id === scriptId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scriptId || !startTime || !endTime) {
      showToast('请填写所有必填字段', 'error');
      return;
    }

    if (new Date(startTime) >= new Date(endTime)) {
      showToast('结束时间必须晚于开始时间', 'error');
      return;
    }

    if (selectedScript && (maxPlayers < selectedScript.min_players || maxPlayers > selectedScript.max_players)) {
      showToast(`人数应在${selectedScript.min_players}-${selectedScript.max_players}之间`, 'error');
      return;
    }

    setLoading(true);
    try {
      await api.createRoom({
        scriptId, startTime, endTime, maxPlayers, location, price
      });
      showToast('场次创建成功！', 'success');
      navigate('/rooms');
    } catch (err: any) {
      showToast(err.message || '创建失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loadingScripts) {
    return <div className="loading"><div className="spinner"></div><span>加载中...</span></div>;
  }

  if (scripts.length === 0) {
    return (
      <div className="page">
        <div className="container" style={{ maxWidth: 700 }}>
          <div className="empty-state">
            <div className="empty-state-icon">📚</div>
            <p className="empty-state-text">您还没有发布剧本，请先创建剧本</p>
            <button className="btn btn-primary" onClick={() => navigate('/create-script')}>发布剧本</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 700 }}>
        <div className="page-header">
          <h1>🎯 创建场次</h1>
          <p>选择剧本，设置场次信息</p>
        </div>

        <div className="card">
          <div className="card-body" style={{ padding: 32 }}>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">选择剧本 *</label>
                <select className="form-select" value={scriptId} onChange={e => {
                  setScriptId(e.target.value);
                  const s = scripts.find(sc => sc.id === e.target.value);
                  if (s) setMaxPlayers(s.max_players);
                }}>
                  <option value="">请选择剧本</option>
                  {scripts.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.type} | {s.min_players}-{s.max_players}人 | {s.duration}分钟)
                    </option>
                  ))}
                </select>
              </div>

              {selectedScript && (
                <div style={{ padding: 16, background: 'var(--bg)', borderRadius: 'var(--radius-sm)', marginBottom: 16 }}>
                  <p style={{ fontWeight: 600, marginBottom: 4 }}>{selectedScript.name}</p>
                  <p style={{ fontSize: 13, color: 'var(--text-light)' }}>{selectedScript.description?.substring(0, 100)}...</p>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">开始时间 *</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">结束时间 *</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">
                    开局人数 *
                    {selectedScript && <span style={{ fontWeight: 400, color: 'var(--text-light)' }}> ({selectedScript.min_players}-{selectedScript.max_players}人)</span>}
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    value={maxPlayers}
                    onChange={e => setMaxPlayers(Number(e.target.value))}
                    min={selectedScript?.min_players || 1}
                    max={selectedScript?.max_players || 20}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">价格（元/人）</label>
                  <input
                    type="number"
                    className="form-input"
                    value={price}
                    onChange={e => setPrice(Number(e.target.value))}
                    min={0}
                    step={10}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">场地地址</label>
                <input
                  type="text"
                  className="form-input"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="留空则使用店铺默认地址"
                />
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                  {loading ? '创建中...' : '创建场次'}
                </button>
                <button type="button" className="btn btn-ghost btn-lg" onClick={() => navigate(-1)}>
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
