import axios from 'axios';

const API_URL = 'http://192.168.0.50:8000';

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
    // Backend expects 'username' field in FormData to carry the email
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

  // Invite Logic
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

  // Unified Search
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
  }
};