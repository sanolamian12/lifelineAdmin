import React from 'react';
import { Button } from 'antd';

const Dashboard = ({ user, onLogout }) => {
  return (
    <div className="main-container" style={{ textAlign: 'left', padding: '100px' }}>
      <h1 style={{ fontSize: '48px', fontWeight: 'bold' }}>
        {user?.name} 님 환영합니다!
      </h1>
      <p style={{ fontSize: '24px', color: '#666' }}>관리자 전용 홈페이지 입니다.</p>
      <p style={{ fontSize: '24px', color: '#666', marginBottom: '50px' }}>
        상단의 메뉴 버튼을 클릭해서 업무를 진행해주세요
      </p>

      <div style={{ display: 'flex', gap: '20px' }}>
        <Button
          onClick={onLogout}
          style={{ width: '200px', height: '60px', fontSize: '20px', backgroundColor: '#4472C4', color: 'white' }}
        >
          로그아웃
        </Button>
        <Button
          style={{ width: '200px', height: '60px', fontSize: '20px', backgroundColor: '#4472C4', color: 'white' }}
        >
          비밀번호 수정
        </Button>
      </div>
    </div>
  );
};

export default Dashboard;