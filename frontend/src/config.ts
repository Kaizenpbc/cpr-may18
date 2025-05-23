export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
export const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001';

const config = {
  apiUrl: API_URL,
  wsUrl: WS_URL
};

export default config; 