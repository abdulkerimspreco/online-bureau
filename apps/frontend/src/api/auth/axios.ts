import axios from 'axios';

// change this to env variable
const API_BASE_PORT = 3000;
const API_BASE_URL = `http://localhost:${API_BASE_PORT}`;

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

