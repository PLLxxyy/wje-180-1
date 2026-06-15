import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useToast } from '../App';

export default function CreateScript() {
  const [name, setName] = useState('');
  const [type, setType] = useState('推理');
  const [difficulty, setDifficulty] = useState(3);
  const [minPlayers, setMinPlayers] = useState(4);
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [duration, setDuration] = useState(180);
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description) {
      showToast('请填写剧本名称和简介', 'error');
      return;
    }
    if (minPlayers > maxPlayers) {
      showToast('最少人数不能大于最多人数', 'error');
      return;
    }

    setLoading(true);
    try {
      await api.createScript({
        name, type, difficulty,
        minPlayers, maxPlayers, duration, description,
        tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : []
      });
      showToast('剧本发布成功！', 'success');
      navigate('/scripts');
    } catch (err: any) {
      showToast(err.message || '发布失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 700 }}>
        <div className="page-header">
          <h1>📝 发布剧本</h1>
          <p>填写剧本信息，发布到平台</p>
        </div>

        <div className="card">
          <div className="card-body" style={{ padding: 32 }}>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">剧本名称 *</label>
                <input
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="输入剧本名称"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">剧本类型 *</label>
                  <select className="form-select" value={type} onChange={e => setType(e.target.value)}>
                    <option value="推理">推理</option>
                    <option value="情感">情感</option>
                    <option value="恐怖">恐怖</option>
                    <option value="欢乐">欢乐</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">难度等级 *</label>
                  <select className="form-select" value={difficulty} onChange={e => setDifficulty(Number(e.target.value))}>
                    <option value={1}>★☆☆☆☆ 新手友好</option>
                    <option value={2}>★★☆☆☆ 入门</option>
                    <option value={3}>★★★☆☆ 中等</option>
                    <option value={4}>★★★★☆ 进阶</option>
                    <option value={5}>★★★★★ 硬核</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">最少人数 *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={minPlayers}
                    onChange={e => setMinPlayers(Number(e.target.value))}
                    min={1}
                    max={20}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">最多人数 *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={maxPlayers}
                    onChange={e => setMaxPlayers(Number(e.target.value))}
                    min={1}
                    max={20}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">时长(分钟) *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={duration}
                    onChange={e => setDuration(Number(e.target.value))}
                    min={30}
                    step={30}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">剧本简介 *</label>
                <textarea
                  className="form-textarea"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="详细描述剧本的故事背景、特色亮点等..."
                  rows={5}
                />
              </div>

              <div className="form-group">
                <label className="form-label">标签（用逗号分隔）</label>
                <input
                  type="text"
                  className="form-input"
                  value={tags}
                  onChange={e => setTags(e.target.value)}
                  placeholder="例如：硬核推理, 悬疑, 反转"
                />
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                  {loading ? '发布中...' : '发布剧本'}
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
