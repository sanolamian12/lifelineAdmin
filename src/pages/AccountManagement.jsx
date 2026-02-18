import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, message, Popconfirm, Checkbox } from 'antd';
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
      const response = await api.get('/auth/accounts');
      setAccounts(response.data);
    } catch (error) {
      message.error('상담원 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 2. 중복 체크 함수
  const checkIdDuplication = async (rule, value) => {
    if (!value) return Promise.resolve();
    try {
      await api.get(`/auth/check-duplicate?id=${value}`);
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(new Error('이미 사용 중인 아이디입니다.'));
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  // 3. 상담원 등록 처리
  const handleCreate = async (values) => {
    try {
      await api.post('/auth/create', {
        id: values.accountId,
        password: values.password,
        name: values.name,
        phone: values.phone,
        isChief: false,
      });
      message.success('상담원이 성공적으로 등록되었습니다.');
      setIsModalVisible(false);
      form.resetFields();
      fetchAccounts();
    } catch (error) {
      const errorMsg = error.response?.data?.message || '등록 실패';
      message.error(errorMsg);
    }
  };

  // 4. 상담원 삭제 처리 (Hard Delete)
  const handleDelete = async (targetId) => {
    try {
      await api.delete(`/auth/admin/delete-account?targetId=${targetId}`);
      message.success('삭제되었습니다.');
      fetchAccounts();
    } catch (error) {
      const errorMsg = error.response?.data?.message || '삭제 중 오류가 발생했습니다.';
      Modal.error({ title: '삭제 불가', content: errorMsg });
    }
  };

  // 5. 관리 권한(isChief) 변경
  const handleToggleChief = async (targetId, currentStatus) => {
    try {
      await api.patch(`/auth/admin/update-account?targetId=${targetId}`, {
        isChief: !currentStatus
      });
      message.success('관리 권한이 변경되었습니다.');
      fetchAccounts();
    } catch (error) {
      message.error('권한 변경에 실패했습니다.');
    }
  };

  // 6. [추가] 삭제 요청(isDeleted) 상태 변경
  const handleToggleWithdraw = async (targetId, currentStatus) => {
    try {
      await api.patch(`/auth/admin/update-account?targetId=${targetId}`, {
        isDeleted: !currentStatus
      });
      message.success(currentStatus ? '삭제 요청이 취소되었습니다.' : '삭제 요청 상태로 변경되었습니다.');
      fetchAccounts();
    } catch (error) {
      message.error('상태 변경에 실패했습니다.');
    }
  };

  const columns = [
    { title: '번호', dataIndex: 'index', key: 'index', render: (text, record, index) => <span style={{ fontSize: '18px' }}>{index + 1}</span>},
    { title: '아이디', dataIndex: 'account_id', key: 'account_id' , render: (text) => <span style={{ fontSize: '18px' }}>{text}</span>},
    { title: '성함', dataIndex: 'account_name', key: 'account_name' , render: (text) => <span style={{ fontSize: '18px' }}>{text}</span>},
    {
      title: '삭제 요청',
      key: 'isDeleted',
      align: 'center',
      render: (_, record) => (
        <Checkbox
          checked={record.isDeleted}
          onChange={() => handleToggleWithdraw(record.account_id, record.isDeleted)}
          style={{ transform: 'scale(1.3)' }}
        >
          <span style={{
            fontSize: '16px',
            marginLeft: '4px',
            color: record.isDeleted ? '#ff4d4f' : '#8c8c8c',
            fontWeight: record.isDeleted ? 'bold' : 'normal'
          }}>
            {record.isDeleted ? '삭제요청중' : '정상'}
          </span>
        </Checkbox>
      )
    },
    {
      title: '관리 권한',
      key: 'isChief',
      align: 'center',
      render: (_, record) => (
        <Checkbox
          checked={record.isChief}
          onChange={() => handleToggleChief(record.account_id, record.isChief)}
          style={{ transform: 'scale(1.3)' }}
        >
          <span style={{ fontSize: '16px', marginLeft: '4px' }}>마스터</span>
        </Checkbox>
      )
    },
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
          <Button type="primary" danger icon={<DeleteOutlined />} size="large">삭제</Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>상담원 관리</h2>
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

      <Modal
        title={<span style={{ fontSize: '20px' }}>새 상담원 등록</span>}
        open={isModalVisible}
        onOk={() => form.submit()}
        onCancel={() => setIsModalVisible(false)}
        okText="확인"
        cancelText="취소"
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="accountId" label="아이디"
            rules={[{ required: true, message: '아이디를 입력하세요' }, { validator: checkIdDuplication }]}
            validateTrigger="onBlur">
            <Input />
          </Form.Item>
          <Form.Item name="password" label="비밀번호" rules={[{ required: true, message: '비밀번호를 입력하세요' }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="name" label="성함" rules={[{ required: true, message: '이름을 입력하세요' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="전화번호" rules={[{ required: true, message: '전화번호를 입력하세요' }]}>
            <Input placeholder="04xx xxx xxx" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AccountManagement;