import axios from 'axios';

const futsalApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://futsal-k08n.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adjuntar automáticamente el token en cada petición si existe
futsalApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default futsalApi;
