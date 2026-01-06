import React, { useEffect, useState, useCallback } from 'react';
import { Table, Button, Input, DatePicker, Space, Modal, Form, Select, message, Popconfirm } from 'antd';
import { SearchOutlined, HistoryOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../api/axios';

const { RangePicker } = DatePicker;

const ActivityManagement = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [counselors, setCounselors] = useState([]);

  const [filters, setFilters] = useState({ keyword: '', from: null, to: null });
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  const startTime = Form.useWatch('startTime', form);
  const endTime = Form.useWatch('endTime', form);

  const fetchActivities = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        keyword: filters.keyword,
        from: filters.from,
        to: filters.to
      };
      const response = await api.get('/current/all-activities', { params });
      setData(response.data.data);
      setTotal(response.data.total);
      setCurrentPage(page);
    } catch (error) {
      message.error('활동 이력을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchCounselors = async () => {
    try {
      const response = await api.get('/current/counselors');
      setCounselors(response.data);
    } catch (error) {
      message.error('상담원 목록을 불러올 수 없습니다.');
    }
  };

  useEffect(() => {
    fetchActivities();
    fetchCounselors();
  }, [fetchActivities]);

  useEffect(() => {
    if (startTime && endTime) {
      const diff = dayjs(endTime).diff(dayjs(startTime), 'hour', true);
      form.setFieldsValue({ hours: diff > 0 ? diff.toFixed(2) : 0 });
    }
  }, [startTime, endTime, form]);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/current/activity/${id}`);
      message.success('활동 내역이 삭제되었습니다.');
      fetchActivities(currentPage);
    } catch (error) {
      message.error('삭제 실패');
    }
  };

  const handleManualCreate = async (values) => {
    try {
      await api.post('/current/activity/manual', {
        accountId: values.accountId,
        start: values.startTime.toDate(),
        end: values.endTime.toDate(),
        hours: parseFloat(values.hours)
      });
      message.success('활동 기록이 수동으로 추가되었습니다.');
      setIsModalVisible(false);
      form.resetFields();
      fetchActivities(1);
    } catch (error) {
      message.error('기록 추가 실패');
    }
  };

  // 컬럼 내부 폰트 크기 조정
  const columns = [
    { title: <span style={{fontSize: '20px'}}>번호</span>, key: 'idx', width: '100px', render: (_, __, index) => <span style={{fontSize: '20px'}}>{(currentPage - 1) * 50 + index + 1}</span> },
    {
      title: <span style={{fontSize: '20px'}}>시작 시간</span>,
      dataIndex: 'start_time',
      render: (t) => <span style={{fontSize: '20px'}}>{dayjs(t).format('YYYY-MM-DD HH:mm')}</span>
    },
    {
      title: <span style={{fontSize: '20px'}}>종료 시간</span>,
      dataIndex: 'end_time',
      render: (t) => <span style={{fontSize: '20px'}}>{t ? dayjs(t).format('YYYY-MM-DD HH:mm') : <span style={{color: 'red', fontWeight: 'bold'}}>진행 중</span>}</span>
    },
    { title: <span style={{fontSize: '20px'}}>상담 시간(H)</span>, dataIndex: 'hours', render: (h) => <b style={{fontSize: '20px'}}>{h ?? '-'}</b> },
    { title: <span style={{fontSize: '20px'}}>상담원 성함</span>, dataIndex: 'account_name', render: (t) => <span style={{fontSize: '20px'}}>{t}</span> },
    {
      title: <span style={{fontSize: '20px'}}>관리</span>,
      key: 'action',
      render: (_, record) => (
        <Popconfirm title="기록을 삭제하시겠습니까?" onConfirm={() => handleDelete(record.id)} okText="예" cancelText="아니오">
          <Button danger icon={<DeleteOutlined />} size="large" style={{fontSize: '18px'}}>삭제</Button>
        </Popconfirm>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
        <h2 style={{ fontSize: '32px', margin: 0, fontWeight: 'bold' }}><HistoryOutlined /> 활동 이력 관리</h2>
        <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)} style={{ height: '50px', fontSize: '20px' }}>
          활동기록 추가
        </Button>
      </div>

      {/* 필터 영역 - 높이 및 폰트 조정 */}
      <div style={{ marginBottom: '20px', backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px' }}>
        <Space size="middle">
          <Input
            placeholder="상담원 이름 또는 ID"
            style={{ width: 300, height: '45px', fontSize: '18px' }}
            value={filters.keyword}
            onChange={e => setFilters({...filters, keyword: e.target.value})}
          />
          <RangePicker
            style={{ height: '45px', fontSize: '18px' }}
            onChange={(dates) => {
              setFilters({
                ...filters,
                from: dates ? dates[0].format('YYYY-MM-DD') : null,
                to: dates ? dates[1].format('YYYY-MM-DD') : null
              });
            }}
          />
          <Button type="primary" icon={<SearchOutlined />} size="large" onClick={() => fetchActivities(1)} style={{ height: '45px', fontSize: '18px' }}>
            찾기
          </Button>
        </Space>
      </div>

      <Table
        dataSource={data}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{
          current: currentPage,
          pageSize: 50,
          total: total,
          onChange: (page) => fetchActivities(page),
          showSizeChanger: false,
        }}
      />

      {/* 수동 추가 모달 - 라벨 및 입력창 폰트 조정 */}
      <Modal
        title={<span style={{fontSize: '24px'}}>활동 기록 수동 추가</span>}
        open={isModalVisible}
        onOk={() => form.submit()}
        onCancel={() => setIsModalVisible(false)}
        width={700}
        okText={<span style={{fontSize: '18px'}}>저장</span>}
        cancelText={<span style={{fontSize: '18px'}}>취소</span>}
      >
        <Form form={form} layout="vertical" onFinish={handleManualCreate} style={{ marginTop: '20px' }}>
          <Form.Item name="accountId" label={<span style={{fontSize: '18px'}}>상담원 선택</span>} rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="children" style={{ height: '45px', fontSize: '18px' }}>
              {counselors.map(c => (
                <Select.Option key={c.account_id} value={c.account_id}>
                  <span style={{fontSize: '18px'}}>{c.account_name} ({c.account_id})</span>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Form.Item name="startTime" label={<span style={{fontSize: '18px'}}>시작 일시</span>} style={{ flex: 1 }} rules={[{ required: true }]}>
              <DatePicker showTime format="YYYY-MM-DD HH:00" style={{ width: '100%', height: '45px', fontSize: '18px' }} />
            </Form.Item>
            <Form.Item name="endTime" label={<span style={{fontSize: '18px'}}>종료 일시</span>} style={{ flex: 1 }} rules={[{ required: true }]}>
              <DatePicker showTime format="YYYY-MM-DD HH:00" style={{ width: '100%', height: '45px', fontSize: '18px' }} />
            </Form.Item>
          </div>
          <Form.Item name="hours" label={<span style={{fontSize: '18px'}}>상담 시간 (자동계산)</span>}>
            <Input readOnly style={{ backgroundColor: '#f5f5f5', height: '45px', fontSize: '20px', fontWeight: 'bold' }} suffix={<span style={{fontSize: '16px'}}>시간</span>} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Select 내부와 텍스트를 위한 전역 스타일 살짝 추가 */}
      <style>{`
        .ant-select-selection-item { font-size: 18px !important; line-height: 43px !important; }
        .ant-table-thead > tr > th { font-size: 20px !important; }
        .ant-pagination { font-size: 18px !important; }
      `}</style>
    </div>
  );
};

export default ActivityManagement;