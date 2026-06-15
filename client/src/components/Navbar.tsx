import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { api } from '../utils/api';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      api.getUnreadCount().then(data => setUnreadCount(data.count)).catch(() => {});
    }
  }, [user, location.pathname]);

  const handleShowNotifications = async () => {
    if (!showNotifications) {
      const data = await api.getNotifications();
      setNotifications(data);
      setShowNotifications(true);
    } else {
      setShowNotifications(false);
    }
  };

  const handleMarkAllRead = async () => {
    await api.markAllAsRead();
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, read: 1 })));
  };

  const handleNotificationClick = async (notif: any) => {
    if (!notif.read) {
      await api.markAsRead(notif.id);
      setUnreadCount(prev => Math.max(0, prev - 1));
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: 1 } : n));
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <>
      <nav className="navbar">
        <div className="container">
          <Link to="/" className="navbar-brand">
            <span>🎭</span>
            剧本杀组局
          </Link>
          <div className="navbar-links">
            <Link to="/rooms" className={`nav-link ${isActive('/rooms') ? 'active' : ''}`}>
              组局广场
            </Link>
            <Link to="/scripts" className={`nav-link ${isActive('/scripts') ? 'active' : ''}`}>
              剧本库
            </Link>
            {user.role === 'player' && (
              <>
                <Link to="/my-bookings" className={`nav-link ${isActive('/my-bookings') ? 'active' : ''}`}>
                  我的预约
                </Link>
                <Link to="/profile" className={`nav-link ${isActive('/profile') ? 'active' : ''}`}>
                  个人中心
                </Link>
              </>
            )}
            {user.role === 'store' && (
              <>
                <Link to="/create-script" className={`nav-link ${isActive('/create-script') ? 'active' : ''}`}>
                  发布剧本
                </Link>
                <Link to="/create-room" className={`nav-link ${isActive('/create-room') ? 'active' : ''}`}>
                  创建场次
                </Link>
                <Link to="/store" className={`nav-link ${isActive('/store') ? 'active' : ''}`}>
                  店家后台
                </Link>
              </>
            )}
            {user.role === 'admin' && (
              <Link to="/admin" className={`nav-link ${isActive('/admin') ? 'active' : ''}`}>
                管理后台
              </Link>
            )}
            <button className="nav-link" onClick={handleShowNotifications} style={{ position: 'relative' }}>
              🔔
              {unreadCount > 0 && <span className="nav-badge">{unreadCount}</span>}
            </button>
            <div className="nav-user">
              <span className="nav-user-name">{user.nickname}</span>
              <button className="btn btn-ghost btn-sm" onClick={handleLogout}>退出</button>
            </div>
          </div>
        </div>
      </nav>

      <div className={`notification-panel ${showNotifications ? 'open' : ''}`}>
        <div className="notification-panel-header">
          <span>消息通知</span>
          {unreadCount > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={handleMarkAllRead}>全部已读</button>
          )}
        </div>
        {notifications.length === 0 ? (
          <div className="empty-state" style={{ padding: '40px 20px' }}>
            <div className="empty-state-icon">📭</div>
            <p>暂无通知</p>
          </div>
        ) : (
          notifications.map((notif: any) => (
            <div
              key={notif.id}
              className={`notification-item ${!notif.read ? 'unread' : ''}`}
              onClick={() => handleNotificationClick(notif)}
            >
              <div className="notification-item-title">{notif.title}</div>
              <div className="notification-item-content">{notif.content}</div>
              <div className="notification-item-time">{new Date(notif.created_at).toLocaleString('zh-CN')}</div>
            </div>
          ))
        )}
      </div>

      {showNotifications && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 199 }}
          onClick={() => setShowNotifications(false)}
        />
      )}
    </>
  );
}
