import React from 'react';
import { Input, Button, Form } from 'antd';

const Login = ({ onLogin }) => {
  return (
    <div className="login-box" style={{
      width: '70%',           // 너비를 90%에서 70%로 줄여 컴팩트하게 변경
      maxWidth: '900px',      // 최대 너비 제한
      padding: '60px 50px',   // 내부 패딩 축소 (기존 100px -> 60px)
      margin: '50px auto',    // 상단 마진 50px 추가하여 내비바와 간격 확보
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      border: '3px solid #002060',
      borderRadius: '30px',
      backgroundColor: '#ffffff',
      boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
    }}>
      {/* 제목: 80% 크기 조정 (72px -> 56px) */}
      <h1 style={{
        marginBottom: '50px',
        fontSize: '56px',
        fontWeight: 'bold',
        textAlign: 'center',
        width: '100%'
      }}>
        로그인 해주세요.
      </h1>

      <Form
        onFinish={onLogin}
        style={{ width: '100%' }}
      >
        {/* 아이디 영역: 폰트 및 높이 80% 조정 */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px', width: '100%' }}>
          <span style={{ fontSize: '32px', fontWeight: 'bold', width: '160px', flexShrink: 0 }}>아이디</span>
          <Form.Item name="accountId" style={{ flex: 1, margin: 0 }}>
            <Input
              size="large"
              style={{
                height: '80px',       // 100px -> 80px
                fontSize: '28px',     // 36px -> 28px
                backgroundColor: '#D9D9D9',
                border: 'none',
                borderRadius: '10px'
              }}
            />
          </Form.Item>
        </div>

        {/* 비밀번호 영역 */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '50px', width: '100%' }}>
          <span style={{ fontSize: '32px', fontWeight: 'bold', width: '160px', flexShrink: 0 }}>비밀번호</span>
          <Form.Item name="password" style={{ flex: 1, margin: 0 }}>
            <Input.Password
              size="large"
              style={{
                height: '80px',       // 100px -> 80px
                fontSize: '28px',     // 36px -> 28px
                backgroundColor: '#D9D9D9',
                border: 'none',
                borderRadius: '10px'
              }}
            />
          </Form.Item>
        </div>

        {/* 버튼 영역: 크기 및 폰트 조정 */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '30px',
          width: '100%'
        }}>
          <Button
            type="primary"
            htmlType="submit"
            style={{
              width: '240px',      // 300px -> 240px
              height: '80px',       // 100px -> 80px
              fontSize: '32px',     // 40px -> 32px
              borderRadius: '15px',
              backgroundColor: '#4472C4'
            }}
          >
            로그인
          </Button>
          <Button
            style={{
              width: '240px',
              height: '80px',
              fontSize: '32px',
              borderRadius: '15px',
              backgroundColor: '#4472C4',
              color: 'white'
            }}
          >
            계정 찾기
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default Login;