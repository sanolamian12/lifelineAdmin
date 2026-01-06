import axios from 'axios';

const api = axios.create({
  baseURL: 'http://3.26.146.6:3000', // 실제 서버 IP 주소로 변경하세요
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터: 로컬 스토리지에 토큰이 있으면 모든 요청 헤더에 삽입
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;