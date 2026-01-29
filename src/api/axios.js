import axios from 'axios';

const api = axios.create({

  // baseURL을 도메인 기반의 상대 경로로 변경합니다.
  // 이렇게 하면 https://admin.koreanlifeline.org/api 로 요청이 전달됩니다.
  baseURL: '/api',
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