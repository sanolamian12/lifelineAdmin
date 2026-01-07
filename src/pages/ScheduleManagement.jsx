import React, { useState, useEffect } from 'react';
import { Button, Select, message, Spin } from 'antd';
import api from '../api/axios';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const ScheduleManagement = () => {
  const [loading, setLoading] = useState(true);
  const [counselors, setCounselors] = useState([]);
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState(null);

  const [touchedIds, setTouchedIds] = useState([]);
  const [appliedIds, setAppliedIds] = useState([]);

  // 상태 관리 변수
  const [isModified, setIsModified] = useState(false); // 수정 여부 (검증 버튼 활성화용)
  const [isValidated, setIsValidated] = useState(false); // 검증 완료 여부 (적용 버튼 활성화용)

  useEffect(() => { fetchInitialData(); }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [ordersRes, counselorRes, statusRes] = await Promise.all([
        api.get('/orders/all'),
        api.get('/current/counselors'),
        api.get('/current/status')
      ]);
      // [수정] 백엔드 필드 명세(id)에 맞게 uniqueKey 설정
      const sanitizedData = ordersRes.data.map((item, index) => ({
      ...item,
      uniqueKey: item.id || `idx-${item.day}-${index}`
        }));

      setOrders(sanitizedData);
      setCounselors(counselorRes.data);
      setStatus(statusRes.data);
      setLoading(false);
    } catch (error) {
      message.error("데이터 로딩 실패");
      setLoading(false);
    }
  };

  const handleCellChange = (targetKey, field, value) => {
    setOrders(prev => prev.map(o => {
      if (o.uniqueKey === targetKey) {
        const updated = { ...o, [field]: value };
        if (field === 'account_id') {
          const counselor = counselors.find(c => String(c.account_id) === String(value));
          updated.account = { ...o.account, account_name: counselor?.account_name };
        }
        return updated;
      }
      return o;
    }));

    setTouchedIds(prev => prev.includes(targetKey) ? prev : [...prev, targetKey]);
    setAppliedIds(prev => prev.filter(id => id !== targetKey));

    // 수정이 발생했으므로 검증하기 버튼 활성화, 적용하기 버튼은 비활성화
    setIsModified(true);
    setIsValidated(false);
  };

  // [추가/수정] 상단바 개별 변경 시 즉시 서버 반영 (백엔드의 Patch /current/select 연동 권장)
  const handleStatusChange = async (key, value) => {
      try {
          if (key === 'selectedCounselor') {
              await api.patch('/current/select', { selectedId: value });
              message.success("다음 대기자가 변경되었습니다.");
          } else if (key === 'currentCounselor') {
              await api.post('/current/force-change-current', { targetId: value });
              message.success("현재 상담원이 강제 변경되었습니다.");
          }
          fetchInitialData(); // 변경 후 상단바 정보 새로고침
      } catch (e) {
          message.error("상태 변경 실패");
      }
  };

  const getLabel = (key) => {
    const labels = {
      currentCounselor: "현재 차례 상담원",
      nextCounselor: "다음 차례 상담원",
      selectedCounselor: "수동 선택된 다음"
    };
    return labels[key] || key;
  };

  const validateSchedule = () => {
      // 1. 필수값 및 미배정 확인 (조건 3)
      const unassigned = orders.filter(o => !o.account_id);
      if (unassigned.length > 0) {
        return message.error(`Error: 상담원이 배정되지 않은 시간대가 ${unassigned.length}개 있습니다.`);
      }

      // 2. 동일 시간대 중복 배정 확인 (조건 2)
      const timeMap = {};
      let timeConflict = false;
      orders.forEach(o => {
        const key = `${o.day}-${o.time}`;
        if (timeMap[key]) timeConflict = true;
        timeMap[key] = true;
      });
      if (timeConflict) return message.error("Error: 동일한 요일/시간대에 중복된 설정이 있습니다.");

      // 3. 한 상담원이 다른 시간대에 배정된 것은 업무상 '중복'이 아닌 '다회 배정'일 수 있으나,
      // 요청하신 대로 "서로 다른 둘 이상의 시간대 배정"을 체크하려면 아래 로직을 씁니다. (조건 1)
      const counselorMap = {};
      orders.forEach(o => {
        if (!counselorMap[o.account_id]) counselorMap[o.account_id] = [];
        counselorMap[o.account_id].push(`${o.day} ${o.time}`);
      });

      const multipleAssignments = Object.entries(counselorMap).filter(([id, times]) => times.length > 1);
      if (multipleAssignments.length > 0) {
        const firstConflict = multipleAssignments[0];
        const name = counselors.find(c => String(c.account_id) === String(firstConflict[0]))?.account_name;
        message.warning(`Notice: ${name} 상담원이 ${firstConflict[1].length}개의 시간대에 배정되었습니다.`);
        // 업무상 허용된다면 경고(warning) 후 통과, 금지라면 error 후 return 하세요.
      }

      message.success("검증이 완료되었습니다. 이제 적용할 수 있습니다.");
      setIsValidated(true);
      setIsModified(false);
    };

  const applyChanges = async () => {
      try {
        setLoading(true);
        // [중요] 백엔드 bulk-update가 요구하는 필드(account_id, day, time)를 모두 포함
        const updateData = orders.map(o => ({
          account_id: o.account_id,
          day: o.day,
          time: o.time
        }));

        await api.post('/orders/bulk-update', updateData);
        message.success("시간표가 성공적으로 업데이트되었습니다.");

        // [핵심] 시간표가 바뀌면 현재/다음 상담원도 바뀌므로 데이터를 다시 불러옴
        await fetchInitialData();

        setAppliedIds([...touchedIds]);
        setTouchedIds([]);
        setIsValidated(false);
        setIsModified(false);
      } catch (e) {
        message.error("저장 실패: " + (e.response?.data?.message || "서버 오류"));
      } finally {
        setLoading(false);
      }
    };

  if (loading) return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}><Spin size="large" /></div>;

  return (
    <div style={{ width: '100%', marginTop: '20px', padding: '0 40px', boxSizing: 'border-box' }}>

      {/* 1. 상단바 섹션 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {['currentCounselor', 'nextCounselor', 'selectedCounselor'].map((key) => (
            <div key={key} style={{
              display: 'flex', alignItems: 'center', border: '1.5px solid #333', padding: '0 15px',
              minWidth: '320px', height: '54px',
              backgroundColor: status[key]?.isDirty ? '#fff3cd' : '#fff'
            }}>
              <span style={{ fontSize: '15px', fontWeight: 'bold', marginRight: '10px', color: '#555' }}>
                {getLabel(key)}
              </span>
              <div style={{ flexGrow: 1, fontWeight: '600', fontSize: '16px' }}>{status[key]?.name}</div>
              <Select size="small" style={{ width: '80px' }} placeholder="변경" onChange={(v) => handleStatusChange(key, v)}>
                {counselors.map(c => <Select.Option key={c.account_id} value={c.account_id}>{c.account_name}</Select.Option>)}
              </Select>
            </div>
          ))}
          <Button
            style={{
              height: '54px', padding: '0 25px', backgroundColor: '#ff4d4f', color: '#fff',
              fontSize: '20px', fontWeight: '800', borderRadius: '4px', border: 'none'
            }}
          >
            착신번호 변경
          </Button>
        </div>

        <div style={{ display: 'flex', gap: '15px' }}>
          {/* 변경 사항이 있을 때만 활성화되는 검증하기 버튼 */}
          <Button
            disabled={!isModified}
            onClick={validateSchedule}
            style={{
              width: '160px', height: '60px', fontSize: '22px', fontWeight: 'bold',
              backgroundColor: isModified ? '#4472C4' : '#ccc', color: '#fff'
            }}
          >
            검증하기
          </Button>

          {/* 검증이 완료되어야 활성화되는 적용하기 버튼 */}
          <Button
            disabled={!isValidated}
            onClick={applyChanges}
            style={{
              width: '160px', height: '60px', fontSize: '22px', fontWeight: 'bold',
              backgroundColor: isValidated ? '#28a745' : '#ccc', color: '#fff'
            }}
          >
            적용하기
          </Button>
        </div>
      </div>

      {/* 2. 시간표 섹션 */}
      <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {DAYS.map(day => <th key={day} style={{ padding: '10px', fontSize: '20px', borderBottom: '3px solid #ff4d4f', color: '#333' }}>{day}</th>)}
          </tr>
        </thead>
        <tbody>
          <tr>
            {DAYS.map(day => (
              <td key={day} style={{ verticalAlign: 'top', padding: '10px', borderRight: '1px solid #eee' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {orders.filter(o => o.day === day).map((item) => {
                    let bgColor = '#fff';
                    if (appliedIds.includes(item.uniqueKey)) bgColor = '#d4edda';
                    else if (touchedIds.includes(item.uniqueKey)) bgColor = '#fff3cd';

                    return (
                      <div key={item.uniqueKey} style={{ border: '1px solid #ddd', backgroundColor: bgColor, borderRadius: '6px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        <div style={{ padding: '15px 10px', textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.02)' }}>
                          <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#888', marginBottom: '4px' }}>
                            {item.time}
                          </div>
                          <div style={{ fontSize: '20px', fontWeight: '900', color: '#000' }}>
                            {item.account?.account_name || "미배정"}
                          </div>
                        </div>
                        <div style={{ padding: '5px', borderTop: '1px dashed #ccc' }}>
                          <Select
                            variant="borderless"
                            value={item.account_id}
                            style={{ width: '100%', fontSize: '13px' }}
                            placeholder="상담원 변경"
                            onChange={(v) => handleCellChange(item.uniqueKey, 'account_id', v)}
                          >
                            {counselors.map(c => <Select.Option key={c.account_id} value={c.account_id}>{c.account_name}</Select.Option>)}
                          </Select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default ScheduleManagement;