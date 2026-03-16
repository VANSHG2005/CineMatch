import axios from 'axios';

// Default to localhost if the env variable isn't set
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Needed for session cookies (Flask-Login)
  headers: {
    'Content-Type': 'application/json',
  },
});

// TMDB related endpoints
export const tmdbApi = {
  getInitData: () => api.get('/init-data'),
  getGenres: () => api.get('/genres'),
  getGenreContent: (type, id) => api.get(`/genre/${type}/${id}`),
  getMoviesByCategory: (category) => api.get(`/movies/${category}`),
  getTvByCategory: (category) => api.get(`/tv/${category}`),
  getMovieDetail: (id) => api.get(`/movie/${id}`),
  getTvDetail: (id) => api.get(`/tv/${id}`),
  getPersonDetail: (id) => api.get(`/person/${id}`),
  search: (query) => api.get(`/search`, { params: { query } }),
  recommend: (name, contentType) => api.post('/recommend', { name, content_type: contentType }),
};

// User and Auth endpoints
export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  signup: (name, email, password) => api.post('/auth/signup', { name, email, password }),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/update', data),
};

// Watchlist endpoints
export const watchlistApi = {
  getWatchlist: () => api.get('/watchlist'),
  add: (item) => api.post('/watchlist/add', item),
  remove: (itemId) => api.delete(`/watchlist/remove/${itemId}`),
  removeToggle: (itemId, itemType) => api.delete(`/watchlist/remove_toggle/${itemId}/${itemType}`),
};

// Commenting system
export const commentsApi = {
  getComments: (itemId, itemType) => api.get(`/comments/${itemId}/${itemType}`),
  postComment: (data) => api.post('/comments', data),
  deleteComment: (commentId) => api.delete(`/comments/${commentId}`),
};

export default api;
