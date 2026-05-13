import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Restore token synchronously on module load so requests made before
// App's useEffect runs are already authenticated.
const _savedToken = localStorage.getItem('token');
if (_savedToken) {
  api.defaults.headers.common.Authorization = `Bearer ${_savedToken}`;
}

export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('fullName');
    }
    return Promise.reject(error);
  }
);


export default api;
