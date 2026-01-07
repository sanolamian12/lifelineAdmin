import React, { useState, useEffect } from 'react';
import { Button, Select, message, Spin, Popconfirm, Card } from 'antd';
import api from '../api/axios';

const { Option } = Select;

const DAYS_EN = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const HOUR_OPTIONS = [
  "01 AM", "02 AM", "03 AM", "04 AM", "05 AM", "06 AM", "07 AM", "08 AM", "09 AM", "10 AM", "11 AM", "12 PM",
  "01 PM", "02 PM", "03 PM", "04 PM", "05 PM", "06 PM", "07 PM", "08 PM", "09 PM", "10 PM", "11 PM", "12 AM"
];

const NewScheduleEditor = () => {
  const [loading, setLoading] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [counselors, setCounselors] = useState([]);
  const [mode, setMode] = useState('idle');

  // 전역 폰트 스타일 (20pt)
  const globalFontSize = { fontSize: '20pt' };

  useEffect(() => {
    const init = async () => {
      await fetchCounselors();
      await handleLoad(); // 1. 화면 진입 시 자동으로 불러오기 실행
    };
    init();
  }, []);

  const fetchCounselors = async () => {
    try {
      const res = await api.get('/current/counselors');
      setCounselors(res.data);
    } catch (e) { message.error("상담원 목록 로딩 실패"); }
  };

  const handleLoad = async () => {
    try {
      setLoading(true);
      const res = await api.get('/orders/all');
      const formatted = res.data.map((d) => {
        const timeStr = d.time || "09 AM - 06 PM";
        const parts = timeStr.split(" - ");
        return {
          id: d.id || d.order,
          order: d.order,
          day: d.day,
          startTime: parts[0] || "09 AM",
          endTime: parts[1] || "06 PM",
          account_id: d.account_id
        };
      });
      setSchedules(formatted);
      setMode('editing');
      message.success("현재 DB 시간표를 불러왔습니다.");
    } catch (e) {
      message.error("데이터 로드 실패");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setSchedules([]);
    setMode('editing');
    message.info("새로운 시간표 작성을 시작합니다.");
  };

  const addEntry = () => {
    const nextOrder = schedules.length > 0 ? Math.max(...schedules.map(s => s.order)) + 1 : 1;
    const newEntry = {
      tempId: Date.now(),
      order: nextOrder,
      day: null,
      startTime: null,
      endTime: null,
      account_id: null
    };
    setSchedules([...schedules, newEntry]);
  };

  const sortAndOrder = (list) => {
    const sorted = [...list].sort((a, b) => {
      const dayIdxA = DAYS_EN.indexOf(a.day);
      const dayIdxB = DAYS_EN.indexOf(b.day);
      if (dayIdxA !== dayIdxB) return dayIdxA - dayIdxB;
      const timeIdxA = HOUR_OPTIONS.indexOf(a.startTime);
      const timeIdxB = HOUR_OPTIONS.indexOf(b.startTime);
      return timeIdxA - timeIdxB;
    });
    return sorted.map((item, idx) => ({ ...item, order: idx + 1 }));
  };

  const handleChange = (id, field, value) => {
    let newList = schedules.map(s => (s.id === id || s.tempId === id) ? { ...s, [field]: value } : s);
    if (field === 'day' || field === 'startTime') {
      newList = sortAndOrder(newList);
    }
    setSchedules(newList);
    setMode('editing');
  };

  const validate = () => {
      if (schedules.length === 0) return message.error("입력된 내용이 없습니다.");

      // 1. 필수값 체크 (조건 3 포함)
      if (schedules.some(s => !s.day || !s.startTime || !s.endTime || !s.account_id)) {
        return message.error("Error: 모든 항목(요일, 시간, 담당자)을 선택해주세요.");
      }

      // 2. 동일 요일/시간 중복 체크 (조건 2)
      const timeSlotMap = {};
      for (const s of schedules) {
        const slotKey = `${s.day}-${s.startTime}-${s.endTime}`;
        if (timeSlotMap[slotKey]) {
          return message.error(`Error: 중복된 시간대 설정이 존재합니다. (${s.day} ${s.startTime})`);
        }
        timeSlotMap[slotKey] = true;
      }

      // 3. 상담원 다회 배정 체크 (조건 1)
      const counts = {};
      schedules.forEach(s => counts[s.account_id] = (counts[s.account_id] || 0) + 1);
      const duplicates = Object.keys(counts).filter(id => counts[id] > 1);

      if (duplicates.length > 0) {
        const names = duplicates.map(id => counselors.find(c => String(c.account_id) === String(id))?.account_name);
        message.warning(`알림: ${names.join(', ')} 상담원이 여러 시간대에 배정되었습니다.`);
        // 만약 한 사람이 여러 번 근무하는 것이 금지라면 여기서 return message.error 하세요.
      }

      message.success("검증 완료! 적용 버튼이 활성화되었습니다.");
      setMode('validated');
    };

  const handleApply = async () => {
    try {
      setLoading(true);
      const payload = schedules.map(s => ({
        account_id: s.account_id,
        day: s.day,
        time: `${s.startTime} - ${s.endTime}`,
      }));
      await api.post('/orders/bulk-update', payload);
      message.success("DB에 성공적으로 적용되었습니다.");
      setMode('applied');
    } catch (e) {
      message.error("적용 중 오류 발생");
    } finally { setLoading(false); }
  };

  const handleUndo = async () => {
    try {
      setLoading(true);
      await api.post('/orders/restore');
      message.success("이전 백업 데이터로 복구되었습니다.");
      handleLoad();
    } catch (e) {
      message.error("복구 실패");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ padding: '40px', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>

      {/* 3. 상단 버튼 바 - Horizontal 방향 한 줄 배치 */}
      <div style={{
        display: 'flex', gap: '15px', marginBottom: '30px', backgroundColor: '#fff',
        padding: '25px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        flexWrap: 'wrap', alignItems: 'center'
      }}>
        <Button size="large" type="primary" onClick={handleLoad} style={globalFontSize}>불러오기</Button>
        <Button size="large" type="primary" onClick={handleCreateNew} style={globalFontSize}>새 시간표 작성</Button>
        <div style={{ width: '2px', height: '40px', backgroundColor: '#ddd', margin: '0 10px' }} />
        <Button size="large" type="primary" onClick={addEntry} disabled={mode === 'idle'} style={globalFontSize}>새 일정 입력</Button>
        <Button size="large" type="primary" onClick={validate} disabled={mode === 'idle'} style={globalFontSize}>검증하기</Button>
        <Button
          size="large"
          type="primary"
          onClick={handleApply}
          disabled={mode !== 'validated'}
          style={{ ...globalFontSize, backgroundColor: mode === 'validated' ? '#28a745' : '', borderColor: mode === 'validated' ? '#28a745' : '' }}
        >
          적용하기
        </Button>
        <Popconfirm title="정말 복구하시겠습니까?" onConfirm={handleUndo}>
          <Button size="large" danger disabled={mode !== 'applied'} style={{ ...globalFontSize, fontWeight: 'bold' }}>되돌리기</Button>
        </Popconfirm>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', marginTop: '100px' }}><Spin size="large" tip="Processing..." /></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {schedules.map((s) => (
            /* 2. 카드 한 줄 구성 */
            <Card key={s.id || s.tempId} bodyStyle={{ padding: '20px 30px' }} style={{ borderRadius: '10px', border: 'none', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <span style={{ fontSize: '22pt', fontWeight: '900', color: '#1890ff', minWidth: '80px' }}>#{s.order}</span>

                <div style={{ flex: 1, display: 'flex', gap: '15px' }}>
                  <Select
                    size="large"
                    placeholder="요일"
                    value={s.day}
                    style={{ flex: 1, ...globalFontSize }}
                    dropdownStyle={globalFontSize}
                    onChange={v => handleChange(s.id || s.tempId, 'day', v)}
                  >
                    {DAYS_EN.map(d => <Option key={d} value={d} style={globalFontSize}>{d}</Option>)}
                  </Select>

                  <Select
                    size="large"
                    placeholder="시작"
                    value={s.startTime}
                    style={{ flex: 1, ...globalFontSize }}
                    onChange={v => handleChange(s.id || s.tempId, 'startTime', v)}
                  >
                    {HOUR_OPTIONS.map(h => <Option key={h} value={h} style={globalFontSize}>{h}</Option>)}
                  </Select>

                  <Select
                    size="large"
                    placeholder="종료"
                    value={s.endTime}
                    style={{ flex: 1, ...globalFontSize }}
                    onChange={v => handleChange(s.id || s.tempId, 'endTime', v)}
                  >
                    {HOUR_OPTIONS.map(h => {
                      const startIdx = HOUR_OPTIONS.indexOf(s.startTime);
                      const currentIdx = HOUR_OPTIONS.indexOf(h);
                      const isNextDay = s.startTime && currentIdx <= startIdx;
                      return <Option key={h} value={h} style={globalFontSize}>{h} {isNextDay ? '(익일)' : ''}</Option>
                    })}
                  </Select>

                  <Select
                    size="large"
                    placeholder="담당 상담원"
                    showSearch
                    optionFilterProp="children"
                    value={s.account_id}
                    style={{ flex: 1.5, ...globalFontSize }}
                    onChange={v => handleChange(s.id || s.tempId, 'account_id', v)}
                  >
                    {counselors.map(c => <Option key={c.account_id} value={c.account_id} style={globalFontSize}>{c.account_name}</Option>)}
                  </Select>
                </div>

                <Button
                  type="primary"
                  danger
                  size="large"
                  onClick={() => setSchedules(schedules.filter(item => (item.id || item.tempId) !== (s.id || s.tempId)))}
                  style={globalFontSize}
                >
                  삭제
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default NewScheduleEditor;