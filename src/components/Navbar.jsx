import React from 'react';
import { Button } from 'antd';
import { BankOutlined } from '@ant-design/icons';

const Navbar = ({ isLoggedIn }) => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      padding: '20px 50px',
      borderBottom: '2px solid #336699',
      backgroundColor: 'white'
    }}>
      <div style={{ textAlign: 'center' }}>
        <BankOutlined style={{ fontSize: '40px' }} />
        <div style={{ fontSize: '12px', fontWeight: 'bold' }}>Go to main icon</div>
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        <Button size="large" type="primary" disabled={!isLoggedIn} style={{ height: '60px', width: '200px', fontSize: '24px' }}>
          상담원 관리
        </Button>
        <Button size="large" type="primary" disabled={!isLoggedIn} style={{ height: '60px', width: '200px', fontSize: '24px' }}>
          활동 이력 관리
        </Button>
        <Button size="large" type="primary" disabled={!isLoggedIn} style={{ height: '60px', width: '200px', fontSize: '24px' }}>
          스케줄 보기
        </Button>
        <Button size="large" type="primary" disabled={!isLoggedIn} style={{ height: '60px', width: '200px', fontSize: '24px' }}>
          새 시간표 작성
        </Button>
      </div>
    </div>
  );
};

export default Navbar;