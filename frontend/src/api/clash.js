import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // Register or fetch existing user
  registerUser: async (username, playerTag) => {
    // Ensure tag has '#' prefix
    const formattedTag = playerTag.startsWith('#') ? playerTag : `#${playerTag}`;
    const response = await client.post('/users/', { 
      username, 
      player_tag: formattedTag 
    });
    return response.data;
  },

  // Trigger backend sync with Supercell
  syncBattles: async (playerTag) => {
    // Backend expects tag encoded or raw, safe to pass encoded if needed, 
    // but usually axios handles URL parameters well. 
    // We'll strip the hash for the URL path parameter if the backend requires it,
    // but your backend test script suggests it handles standard tags.
    const cleanTag = playerTag.replace('#', '%23');
    const response = await client.post(`/sync/${cleanTag}`);
    return response.data;
  },

  // Get match history
  getMatches: async (playerTag) => {
    const cleanTag = playerTag.replace('#', '%23');
    const response = await client.get(`/players/${cleanTag}/matches`);
    return response.data;
  }
};