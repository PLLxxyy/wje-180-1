import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, useToast } from '../App';
import { api } from '../utils/api';

export default function Register() {
  const [role, setRole] = useState<'player' | 'store'>('player');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [storeName, setStoreName] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || !nickname) {
      showToast('请填写所有必填字段', 'error');
      return;
    }
    if (role === 'store' && !storeName) {
      showToast('请填写店铺名称', 'error');
      return;
    }

    setLoading(true);
    try {
      const data = await api.register({
        username, password, nickname, role,
        storeName, storeAddress, phone
      });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      showToast('注册成功！', 'success');
      navigate('/');
    } catch (err: any) {
      showToast(err.message || '注册失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="logo">🎭</div>
        <h1>注册新账号</h1>
        <p className="subtitle">加入剧本杀组局平台</p>

        <div className="role-selector">
          <div
            className={`role-option ${role === 'player' ? 'selected' : ''}`}
            onClick={() => setRole('player')}
          >
            <div className="role-option-icon">🎯</div>
            <div className="role-option-label">我是玩家</div>
          </div>
          <div
            className={`role-option ${role === 'store' ? 'selected' : ''}`}
            onClick={() => setRole('store')}
          >
            <div className="role-option-icon">🏪</div>
            <div className="role-option-label">我是店家</div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">用户名 *</label>
            <input
              type="text"
              className="form-input"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="请输入用户名"
            />
          </div>
          <div className="form-group">
            <label className="form-label">密码 *</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="请输入密码"
            />
          </div>
          <div className="form-group">
            <label className="form-label">昵称 *</label>
            <input
              type="text"
              className="form-input"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              placeholder="请输入昵称"
            />
          </div>
          <div className="form-group">
            <label className="form-label">手机号</label>
            <input
              type="tel"
              className="form-input"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="请输入手机号"
            />
          </div>

          {role === 'store' && (
            <>
              <div className="form-group">
                <label className="form-label">店铺名称 *</label>
                <input
                  type="text"
                  className="form-input"
                  value={storeName}
                  onChange={e => setStoreName(e.target.value)}
                  placeholder="请输入店铺名称"
                />
              </div>
              <div className="form-group">
                <label className="form-label">店铺地址</label>
                <input
                  type="text"
                  className="form-input"
                  value={storeAddress}
                  onChange={e => setStoreAddress(e.target.value)}
                  placeholder="请输入店铺地址"
                />
              </div>
            </>
          )}

          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
            {loading ? '注册中...' : '注册'}
          </button>
        </form>

        <div className="auth-footer">
          已有账号？ <Link to="/login">立即登录</Link>
        </div>
      </div>
    </div>
  );
}
