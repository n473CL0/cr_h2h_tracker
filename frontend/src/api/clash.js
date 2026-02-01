import axios from 'axios';

// SECURITY FIX: Do not hardcode IPs. Use Environment Variables.
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper 1: For components that pass the token explicitly (Legacy/Auth flow)
const getAuthHeader = (token) => ({ Authorization: `Bearer ${token}` });

// Helper 2: For components that expect the token to be in localStorage (New Social features)
const getAuthHeaders = () => {
  const tokenStr = localStorage.getItem('clash_user');
  if (!tokenStr) return {};
  try {
    const token = JSON.parse(tokenStr).access_token;
    return { Authorization: `Bearer ${token}` };
  } catch (e) {
    console.error("Error parsing token", e);
    return {};
  }
};

export const api = {
  // --- Auth & User Management ---
  signup: async (userData) => {
    const response = await client.post('/auth/signup', userData);
    return response.data;
  },

  login: async (email, password) => {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    
    const response = await client.post('/auth/login', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getMe: async (token) => {
    const response = await client.get('/users/me', { headers: getAuthHeader(token) });
    return response.data;
  },

  linkTag: async (playerTag, token) => {
    const response = await client.put('/users/link-tag', 
      { player_tag: playerTag },
      { headers: getAuthHeader(token) }
    );
    return response.data;
  },
  
  linkPlayerTag: async (playerTag) => {
      const response = await client.put('/users/link-tag', 
        { player_tag: playerTag },
        { headers: getAuthHeaders() } // Uses localStorage
      );
      return response.data;
  },

  forgotPassword: async (email) => {
      const response = await client.post('/auth/forgot-password', { email });
      return response.data;
  },

  resetPassword: async (token, newPassword) => {
      const response = await client.post('/auth/reset-password', { token, new_password: newPassword });
      return response.data;
  },

  // --- Social Features (Updated to use axios + getAuthHeaders) ---

  getInvite: async (token) => {
    // If token passed explicitly, use it, otherwise fallback to storage
    const headers = token ? getAuthHeader(token) : getAuthHeaders();
    const response = await client.get(`/invites/${token}`, { headers });
    return response.data;
  },

  createInvite: async (targetTag, token) => {
    const headers = token ? getAuthHeader(token) : getAuthHeaders();
    const response = await client.post('/invites/', 
      { target_tag: targetTag }, 
      { headers }
    );
    return response.data;
  },

  searchPlayer: async (query, token) => {
    const headers = token ? getAuthHeader(token) : getAuthHeaders();
    const response = await client.get(`/search/player?query=${encodeURIComponent(query)}`, { headers });
    return response.data;
  },

  // Note: This endpoint was duplicated in your previous file. Standardized here.
  addFriend: async (targetId) => {
    // Payload matches backend expectation (user_id_2)
    const response = await client.post('/friends/add', 
      { user_id_2: targetId },
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  getFriends: async (userId, token) => {
    const headers = token ? getAuthHeader(token) : getAuthHeaders();
    const response = await client.get(`/users/${userId}/friends`, { headers });
    return response.data;
  },

  getMatches: async (playerTag, token) => {
    const headers = token ? getAuthHeader(token) : getAuthHeaders();
    const response = await client.get(`/matches`, { headers });
    return response.data;
  },

  syncBattles: async (playerTag, token) => {
    const cleanTag = playerTag.replace('#', '');
    const headers = token ? getAuthHeader(token) : getAuthHeaders();
    const response = await client.post(`/sync/${cleanTag}`, {}, { headers });
    return response.data;
  },

  submitFeedback: async (data, token) => {
    const headers = token ? getAuthHeader(token) : getAuthHeaders();
    const response = await client.post('/feedback', data, { headers });
    return response.data;
  },

  // --- New Step 3 Features ---

  getFeed: async (skip = 0, limit = 10) => {
    const response = await client.get(`/feed?skip=${skip}&limit=${limit}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  getUser: async (userId) => {
    const response = await client.get(`/users/${userId}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  getUserMatches: async (userId, skip = 0, limit = 10) => {
    const response = await client.get(`/users/${userId}/matches?skip=${skip}&limit=${limit}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  completeOnboarding: async () => {
    const response = await client.post('/users/onboarding', {}, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  getAdvancedLeaderboard: async () => {
    const response = await client.get('/stats/leaderboard', {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  getH2HStats: async (friendId) => {
    const response = await client.get(`/stats/h2h/${friendId}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  }
};