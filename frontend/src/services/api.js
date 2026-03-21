import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

export const tmdbApi = {
  getInitData: () => api.get('/init-data'),
  getGenres: () => api.get('/genres'),
  getGenreContent: (type, id) => api.get(`/genre/${type}/${id}`),
  getMoviesByCategory: (category, page = 1) => api.get(`/movies/${category}`, { params: { page } }),
  getTvByCategory: (category, page = 1) => api.get(`/tv/${category}`, { params: { page } }),
  getMovieDetail: (id) => api.get(`/movie/${id}`),
  getTvDetail: (id) => api.get(`/tv/${id}`),
  getPersonDetail: (id) => api.get(`/person/${id}`),
  search: (query) => api.get('/search', { params: { query } }),
  recommend: (name, contentType) => api.post('/recommend', { name, content_type: contentType }),
};

export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  signup: (name, email, password) => api.post('/auth/signup', { name, email, password }),
  // OTP email verification (Feature 8)
  sendOtp: (email, name) => api.post('/auth/send-otp', { email, name }),
  verifyOtpSignup: (data) => api.post('/auth/verify-otp', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/update', data),
};

export const watchlistApi = {
  getWatchlist: () => api.get('/watchlist'),
  add: (item) => api.post('/watchlist/add', item),
  remove: (itemId) => api.delete(`/watchlist/remove/${itemId}`),
  removeToggle: (itemId, itemType) => api.delete(`/watchlist/remove_toggle/${itemId}/${itemType}`),
  // Feature 6: watched toggle
  toggleWatched: (itemId, watched) => api.patch(`/watchlist/${itemId}/watched`, { watched }),
};

export const commentsApi = {
  getComments: (itemId, itemType) => api.get(`/comments/${itemId}/${itemType}`),
  // Feature 5: rating field included
  postComment: (data) => api.post('/comments', data),
  editComment: (commentId, data) => api.put(`/comments/${commentId}`, data),
  deleteComment: (commentId) => api.delete(`/comments/${commentId}`),
  getUserActivity: () => api.get("/comments/my-activity"),
};

export default api;

// Notifications API (Feature 2)
export const notificationsApi = {
  getAll: () => api.get('/notifications'),
  markAllRead: () => api.post('/notifications/read-all'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
};

// Friends API (Feature 3)
export const friendsApi = {
  getFriends: () => api.get('/friends'),
  searchUsers: (q) => api.get('/users/search', { params: { q } }),
  follow: (userId) => api.post(`/users/${userId}/follow`),
  unfollow: (userId) => api.delete(`/users/${userId}/unfollow`),
  getFriendWatchlist: (userId) => api.get(`/friends/${userId}/watchlist`),
};