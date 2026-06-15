import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect, createContext, useContext } from 'react';
import { api } from './utils/api';
import Navbar from './components/Navbar';
import Toast from './components/Toast';
import Login from './pages/Login';
import Register from './pages/Register';
import ScriptList from './pages/ScriptList';
import ScriptDetail from './pages/ScriptDetail';
import RoomSquare from './pages/RoomSquare';
import RoomDetail from './pages/RoomDetail';
import CreateScript from './pages/CreateScript';
import CreateRoom from './pages/CreateRoom';
import StoreDashboard from './pages/StoreDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import MyBookings from './pages/MyBookings';

interface User {
  id: string;
  username: string;
  nickname: string;
  role: string;
  storeName?: string;
  storeStatus?: string;
  phone?: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  logout: () => {},
  loading: true,
});

export function useAuth() {
  return useContext(AuthContext);
}

interface ToastItem {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export const ToastContext = createContext<{
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.getMe()
        .then((data) => setUser(data))
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <span>加载中...</span>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, setUser, logout, loading }}>
      <ToastContext.Provider value={{ showToast }}>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
            <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
            <Route path="/*" element={
              <>
                <Navbar />
                <Routes>
                  <Route path="/" element={<RoomSquare />} />
                  <Route path="/scripts" element={<ScriptList />} />
                  <Route path="/scripts/:id" element={<ScriptDetail />} />
                  <Route path="/rooms" element={<RoomSquare />} />
                  <Route path="/rooms/:id" element={<RoomDetail />} />
                  <Route path="/create-script" element={user?.role === 'store' ? <CreateScript /> : <Navigate to="/login" />} />
                  <Route path="/create-room" element={user?.role === 'store' ? <CreateRoom /> : <Navigate to="/login" />} />
                  <Route path="/store" element={user?.role === 'store' ? <StoreDashboard /> : <Navigate to="/login" />} />
                  <Route path="/admin" element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/login" />} />
                  <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
                  <Route path="/my-bookings" element={user ? <MyBookings /> : <Navigate to="/login" />} />
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </>
            } />
          </Routes>
          <Toast toasts={toasts} />
        </BrowserRouter>
      </ToastContext.Provider>
    </AuthContext.Provider>
  );
}

export default App;
