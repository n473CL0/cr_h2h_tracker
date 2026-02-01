import axios from 'axios';

// SECURITY FIX: Do not hardcode IPs. Use Environment Variables.
// On Railway, this will read the HTTPS URL. Locally, it defaults to localhost.
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const getAuthHeader = (token) => ({ Authorization: `Bearer ${token}` });

export const api = {
  // userData: { email, password, invite_token, player_tag }
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
  
  // Helper for signup flow tag linking
  linkPlayerTag: async (playerTag) => {
      const tokenStr = localStorage.getItem('clash_user');
      if (!tokenStr) throw new Error("No session found");
      
      const token = JSON.parse(tokenStr).access_token;
      const response = await client.put('/users/link-tag', 
        { player_tag: playerTag },
        { headers: getAuthHeader(token) }
      );
      return response.data;
  },

  getInvite: async (token) => {
    const response = await client.get(`/invites/${token}`);
    return response.data;
  },

  createInvite: async (targetTag, token) => {
    const response = await client.post('/invites/', 
      { target_tag: targetTag }, 
      { headers: getAuthHeader(token) }
    );
    return response.data;
  },

  searchPlayer: async (query, token) => {
    const response = await client.get(`/search/player?query=${encodeURIComponent(query)}`, {
        headers: getAuthHeader(token)
    });
    return response.data;
  },

  addFriend: async (currentUserId, friendId, token) => {
    const response = await client.post('/friends/add', 
      { user_id_1: currentUserId, user_id_2: friendId },
      { headers: getAuthHeader(token) }
    );
    return response.data;
  },

  getMatches: async (playerTag, token) => {
    const response = await client.get(`/matches`, { headers: getAuthHeader(token) });
    return response.data;
  },

  syncBattles: async (playerTag, token) => {
    const cleanTag = playerTag.replace('#', '');
    const response = await client.post(`/sync/${cleanTag}`, {}, {
      headers: getAuthHeader(token)
    });
    return response.data;
  },

  getFriends: async (userId, token) => {
    const response = await client.get(`/users/${userId}/friends`, {
      headers: getAuthHeader(token)
    });
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

  submitFeedback: async (data, token) => {
    const response = await client.post('/feedback', data, {
      headers: getAuthHeader(token)
    });
    return response.data;
  },

  getFeed: async (skip = 0, limit = 10) => {
    const response = await fetch(`${API_URL}/feed?skip=${skip}&limit=${limit}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch feed');
    return response.json();
  },

  getUser: async (userId) => {
    const response = await fetch(`${API_URL}/users/${userId}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch user');
    return response.json();
  },

  getUserMatches: async (userId, skip = 0, limit = 10) => {
    const response = await fetch(`${API_URL}/users/${userId}/matches?skip=${skip}&limit=${limit}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch matches');
    return response.json();
  },

  addFriend: async (friendId) => {
    const response = await fetch(`${API_URL}/friends/${friendId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to add friend');
    return response.json();
  },

  completeOnboarding: async () => {
    const response = await fetch(`${API_URL}/users/onboarding`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to update onboarding status');
    return response.json();
  },

  getAdvancedLeaderboard: async () => {
    // Expected return: { nemesis: [], rivals: [], domination: [] }
    const response = await fetch(`${API_URL}/stats/leaderboard`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch leaderboard');
    return response.json();
  },

  getH2HStats: async (friendId) => {
    const response = await fetch(`${API_URL}/stats/h2h/${friendId}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch H2H stats');
    return response.json();
  }
};