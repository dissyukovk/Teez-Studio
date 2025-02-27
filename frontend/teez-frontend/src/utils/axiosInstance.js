import axios from 'axios';
import dayjs from 'dayjs';
import { jwtDecode } from 'jwt-decode'; // именованный импорт
import { API_BASE_URL } from './config';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Authorization: localStorage.getItem('accessToken')
      ? `Bearer ${localStorage.getItem('accessToken')}`
      : '',
  },
});

axiosInstance.interceptors.request.use(
  async (req) => {
    const token = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    if (token) {
      const decoded = jwtDecode(token);
      const isExpired = dayjs.unix(decoded.exp).diff(dayjs()) < 1;
      if (isExpired && refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/api/token/refresh/`, {
            refresh: refreshToken,
          });
          localStorage.setItem('accessToken', response.data.access);
          req.headers.Authorization = `Bearer ${response.data.access}`;
        } catch (error) {
          console.error("Ошибка обновления токена", error);
          // Дополнительная логика (например, редирект)
        }
      }
    }
    return req;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;
