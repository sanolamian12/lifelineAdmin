import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, message, Space, Popconfirm } from 'antd';
import { UserAddOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../api/axios';

const AccountManagement = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  // 1. 상담원 리스트 가져오기
  const fetchAccounts = async () => {
    setLoading(true);
    try {
      // 컨트롤러 설정에 따라 'auth/accounts' 또는 '/accounts' 호출
      const response = await api.get('/auth/accounts');
      setAccounts(response.data);
    } catch (error) {
      message.error('상담원 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 1. 중복 체크 함수 추가
  const checkIdDuplication = async (rule, value) => {
    if (!value) return Promise.resolve();

    try {
      // 백엔드의 GET /auth/check-duplicate?id=... API 활용
      await api.get(`/auth/check-duplicate?id=${value}`);
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(new Error('이미 사용 중인 아이디입니다.'));
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  // 2. 상담원 등록 처리
  const handleCreate = async (values) => {
    try {
      await api.post('/auth/create', {
        id: values.accountId,
        password: values.password,
        name: values.name,
        phone: values.phone,
        isChief: false, // 기본적으로 상담원으로 생성
      });
      message.success('상담원이 성공적으로 등록되었습니다.');
      setIsModalVisible(false);
      form.resetFields();
      fetchAccounts(); // 리스트 갱신
    } catch (error) {
      const errorMsg = error.response?.data?.message || '등록 실패';
      message.error(errorMsg);
    }
  };

  // 3. 상담원 삭제 처리
  const handleDelete = async (targetId) => {
    try {
      await api.delete(`/auth/admin/delete-account?targetId=${targetId}`);
      message.success('삭제되었습니다.');
      fetchAccounts();
    } catch (error) {
      // 백엔드에서 던지는 "시간표 배정 에러" 메시지를 그대로 출력
      const errorMsg = error.response?.data?.message || '삭제 중 오류가 발생했습니다.';
      Modal.error({
        title: '삭제 불가',
        content: errorMsg,
      });
    }
  };

  const columns = [
    { title: '번호', dataIndex: 'index', key: 'index', render: (text, record, index) => <span style={{ fontSize: '20px' }}>{index + 1}</span>},
    { title: '아이디', dataIndex: 'account_id', key: 'account_id' , render: (text) => <span style={{ fontSize: '20px' }}>{text}</span>},
    { title: '성함', dataIndex: 'account_name', key: 'account_name' , render: (text) => <span style={{ fontSize: '20px' }}>{text}</span>},
    { title: '전화번호', dataIndex: 'account_phone', key: 'account_phone' , render: (text) => <span style={{ fontSize: '20px' }}>{text}</span>},
    {
      title: '관리',
      key: 'action',
      render: (_, record) => (
        <Popconfirm
          title="정말 삭제하시겠습니까?"
          onConfirm={() => handleDelete(record.account_id)}
          okText="예"
          cancelText="아니오"
        >
          <Button type="primary" danger icon={<DeleteOutlined />} size="large" style={{ fontSize: '18px' }}>삭제</Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h2>상담원 관리</h2>
        <Button
          type="primary"
          icon={<UserAddOutlined />}
          onClick={() => setIsModalVisible(true)}
          size="large"
        >
          상담원 추가
        </Button>
      </div>

      <Table
        dataSource={accounts}
        columns={columns}
        rowKey="account_id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      {/* 상담원 추가 모달 */}
      <Modal
        title={<span style={{ fontSize: '24px' }}>새 상담원 등록</span>}
        open={isModalVisible}
        onOk={() => form.submit()}
        onCancel={() => setIsModalVisible(false)}
        okText="확인"
        cancelText="취소"
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="accountId" label={<span style={{ fontSize: '20px' }}>아이디</span>}
          rules={[
            { required: true, message: '아이디를 입력하세요' },
            { validator: checkIdDuplication } // 실시간 검증 추가
          ]}
          validateTrigger="onBlur">
            <Input style={{ fontSize: '18px', height: '45px' }} />
          </Form.Item>
          <Form.Item name="password" label={<span style={{ fontSize: '20px' }}>비밀번호</span>} rules={[{ required: true, message: '비밀번호를 입력하세요' }]}>
            <Input.Password style={{ fontSize: '18px', height: '45px' }} />
          </Form.Item>
          <Form.Item name="name" label={<span style={{ fontSize: '20px' }}>성함</span>} rules={[{ required: true, message: '이름을 입력하세요' }]}>
            <Input style={{ fontSize: '18px', height: '45px' }} />
          </Form.Item>
          <Form.Item name="phone" label={<span style={{ fontSize: '20px' }}>전화번호</span>} rules={[{ required: true, message: '전화번호를 입력하세요' }]}>
            <Input placeholder="04xx xxx xxx" style={{ fontSize: '18px', height: '45px' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AccountManagement;