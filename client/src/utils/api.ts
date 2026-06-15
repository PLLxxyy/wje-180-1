const API_BASE = '/api';

async function request(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || '请求失败');
  }

  return data;
}

export const api = {
  // Auth
  login: (username: string, password: string) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  register: (data: any) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request('/auth/me'),
  updateProfile: (data: any) =>
    request('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),

  // Scripts
  getScripts: (params?: Record<string, string>) => {
    const searchParams = new URLSearchParams(params);
    return request(`/scripts?${searchParams}`);
  },
  getScript: (id: string) => request(`/scripts/${id}`),
  createScript: (data: any) =>
    request('/scripts', { method: 'POST', body: JSON.stringify(data) }),
  updateScript: (id: string, data: any) =>
    request(`/scripts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteScript: (id: string) =>
    request(`/scripts/${id}`, { method: 'DELETE' }),

  // Favorites
  favoriteScript: (id: string) =>
    request(`/scripts/${id}/favorite`, { method: 'POST' }),
  unfavoriteScript: (id: string) =>
    request(`/scripts/${id}/favorite`, { method: 'DELETE' }),
  checkFavorite: (id: string) => request(`/scripts/${id}/favorite`),
  getMyFavorites: () => request('/scripts/my/favorites'),

  // Rooms
  getRooms: (params?: Record<string, string>) => {
    const searchParams = new URLSearchParams(params);
    return request(`/rooms?${searchParams}`);
  },
  getRoom: (id: string) => request(`/rooms/${id}`),
  createRoom: (data: any) =>
    request('/rooms', { method: 'POST', body: JSON.stringify(data) }),
  updateRoom: (id: string, data: any) =>
    request(`/rooms/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  cancelRoom: (id: string) =>
    request(`/rooms/${id}/cancel`, { method: 'POST' }),
  completeRoom: (id: string) =>
    request(`/rooms/${id}/complete`, { method: 'POST' }),

  // Bookings
  createBooking: (data: any) =>
    request('/bookings', { method: 'POST', body: JSON.stringify(data) }),
  cancelBooking: (id: string) =>
    request(`/bookings/${id}/cancel`, { method: 'POST' }),
  getMyBookings: (status?: string) =>
    request(`/bookings/my${status ? `?status=${status}` : ''}`),

  // Reviews
  createReview: (data: any) =>
    request('/reviews', { method: 'POST', body: JSON.stringify(data) }),
  getScriptReviews: (scriptId: string) =>
    request(`/reviews/script/${scriptId}`),
  getMyReviews: () => request('/reviews/my'),

  // Notifications
  getNotifications: () => request('/notifications'),
  getUnreadCount: () => request('/notifications/unread'),
  markAsRead: (id: string) =>
    request(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllAsRead: () =>
    request('/notifications/read-all', { method: 'PUT' }),

  // Users
  getUserProfile: () => request('/users/profile'),

  // Admin
  getAdminStats: () => request('/admin/stats'),
  getStoreStats: () => request('/admin/store-stats'),
  getPendingStores: () => request('/admin/stores/pending'),
  getAllStores: () => request('/admin/stores'),
  updateStoreStatus: (id: string, status: string) =>
    request(`/admin/stores/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
};

export default api;
