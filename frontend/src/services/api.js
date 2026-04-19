import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
});

// Добавляем токен в каждый запрос
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

export const questsAPI = {
    getAll: () => api.get('/quests'),
    getById: (id) => api.get(`/quests/${id}`),
    start: (questId, difficulty) => api.post(`/quests/${questId}/start`, { difficulty }),
    checkLocation: (progressId, locationId, latitude, longitude, time_spent_seconds) => 
      api.post(`/progress/${progressId}/check-location`, { locationId, latitude, longitude, time_spent_seconds }),
    pause: (progressId) => api.post(`/progress/${progressId}/pause`),
    resume: (progressId) => api.post(`/progress/${progressId}/resume`),
    abort: (progressId) => api.post(`/progress/${progressId}/abort`),
    create: (data) => api.post('/quests', data),
    getMyQuests: () => api.get('/quests/my'),
    addLocation: (questId, data) => api.post(`/quests/${questId}/locations`, data),
    deleteLocation: (locationId) => api.delete(`/locations/${locationId}`),
    publish: (questId) => api.post(`/quests/${questId}/publish`),
    reorderLocations: (questId, locations) => api.put(`/quests/${questId}/locations/reorder`, { locations }),
    delete: (id) => api.delete(`/quests/${id}`),
    update: (id, data) => api.put(`/quests/${id}`, data),
};

export const leaderboardAPI = {
  getGlobal: () => api.get('/leaderboard'),
  getWeekly: () => api.get('/leaderboard/weekly'),
};

export const userAPI = {
    getAchievements: () => api.get('/user/achievements'),
    getCompletedQuests: () => api.get('/user/completed-quests'),
  };

  export const adminAPI = {
    getUsers: () => api.get('/admin/users'),
    getPendingQuests: () => api.get('/admin/quests/pending'),
    moderateQuest: (questId, status) => api.post(`/admin/quests/${questId}/moderate`, { status }),
    changeRole: (userId, role) => api.put(`/admin/users/${userId}/role`, { role }),
    getLogs: () => api.get('/admin/logs'),
    getManualRequests: () => api.get('/admin/manual-requests'),
    approveRequest: (id) => api.post(`/admin/manual-requests/${id}/approve`),
    rejectRequest: (id) => api.post(`/admin/manual-requests/${id}/reject`),
  };

  export const progressAPI = {
    start: (questId, difficulty) => api.post(`/quests/${questId}/start`, { difficulty }),
    checkLocation: (progressId, locationId, latitude, longitude, time_spent_seconds) => 
      api.post(`/progress/${progressId}/check-location`, { locationId, latitude, longitude, time_spent_seconds }),
    pause: (progressId) => api.post(`/progress/${progressId}/pause`),
    resume: (progressId) => api.post(`/progress/${progressId}/resume`),
    abort: (progressId) => api.post(`/progress/${progressId}/abort`),
    requestManualCheck: (progressId, locationId) => 
      api.post(`/progress/${progressId}/request-manual-check`, { locationId }),
  };

  
export default api;