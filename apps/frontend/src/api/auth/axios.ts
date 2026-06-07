import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_URL?.trim() || 'http://localhost:3000';

export const API = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

API.interceptors.request.use(
    // setting custom headers if needed
    (config) => {
        return config;
    },
    (error) => Promise.reject(error),
);

API.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error),
);

export const getApiBaseUrl = () => API_BASE_URL;
