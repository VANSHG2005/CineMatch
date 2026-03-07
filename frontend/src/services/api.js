import axios from 'axios';

let API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Ensure the URL ends with /api to match the backend blueprint
if (!API_URL.endsWith('/api')) {
  API_URL = API_URL.endsWith('/') ? `${API_URL}api` : `${API_URL}/api`;
}

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  signup: (name, email, password) => api.post('/auth/signup', { name, email, password }),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/update', data),
};

export const watchlistApi = {
  getWatchlist: () => api.get('/watchlist'),
  add: (item) => api.post('/watchlist/add', item),
  remove: (itemId) => api.delete(`/watchlist/remove/${itemId}`),
  removeToggle: (itemId, itemType) => api.delete(`/watchlist/remove_toggle/${itemId}/${itemType}`),
};

export const commentsApi = {
  getComments: (itemId, itemType) => api.get(`/comments/${itemId}/${itemType}`),
  postComment: (data) => api.post('/comments', data),
  deleteComment: (commentId) => api.delete(`/comments/${commentId}`),
};

export default api;
