import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { message } from 'antd';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import api from './api/axios';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // 1. 앱 시작 시 로컬 스토리지에서 세션 확인
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      setIsLoggedIn(true);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // 2. 로그인 처리 로직
  const handleLogin = async (values) => {
    try {
      const response = await api.post('/auth/login', {
        accountId: values.accountId,
        password: values.password,
      });

      const { access_token, user: userData } = response.data;

      // [백엔드 정보 반영] user_12 처럼 isChief가 true인 사람만 로그인 허용
      if (!userData.isChief) {
        message.error('운영자 권한이 없습니다. (서미진 운영자님 계정 등으로 로그인하세요)');
        return;
      }

      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));

      setIsLoggedIn(true);
      setUser(userData);
      message.success(`${userData.name} 운영자님, 환영합니다!`);
      navigate('/'); // 메인 화면으로 이동
    } catch (error) {
      const msg = error.response?.data?.message || '로그인 서버 연결 실패';
      message.error(msg);
    }
  };

  // 3. 로그아웃 처리 로직
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUser(null);
    message.info('로그아웃 되었습니다.');
    navigate('/login');
  };

  return (
    <div className="App">
      <Navbar isLoggedIn={isLoggedIn} />
      <div className="main-content-wrapper">
          <Routes>
            <Route path="/login" element={!isLoggedIn ? <Login onLogin={handleLogin} /> : <Dashboard user={user} onLogout={handleLogout} />} />
            <Route path="/" element={isLoggedIn ? <Dashboard user={user} onLogout={handleLogout} /> : <Login onLogin={handleLogin} />} />
            {/* 추후 /accounts (상담원 관리), /schedule (시간표 작성) 경로 추가 */}
          </Routes>
        </div>
    </div>
  );
}

export default App;