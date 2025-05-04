import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import PlanModal from '../components/PlanModal';

const PlanPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [plans, setPlans] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [modalData, setModalData] = useState(null);
  const [startHour, setStartHour] = useState(8);
  const [endHour, setEndHour] = useState(23);

  const getWeekDates = useCallback((date) => {
    const startOfWeek = new Date(date);
    const diff = startOfWeek.getDay();
    startOfWeek.setDate(date.getDate() - diff);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, []);

  const weekDates = useMemo(() => getWeekDates(selectedDate), [getWeekDates, selectedDate]);

  const fetchPlans = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const startOfWeek = weekDates[0].toISOString().split('T')[0];
    const endOfWeek = weekDates[6].toISOString().split('T')[0];
    try {
      const res = await fetch(`http://localhost:5000/api/schedule?start=${startOfWeek}&end=${endOfWeek}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setPlans(data.schedule || []);
      console.log('重新取得計畫資料：', data.schedule);
    } catch (err) {
      console.error('讀取資料失敗：', err);
    }
  }, [weekDates]);

  const fetchSubjects = useCallback(async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:5000/api/study/subjects', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setSubjects(data.subjects);
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (startHour > endHour) {
      setEndHour(startHour);
    }
  }, [startHour]);
  
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let h = startHour; h <= endHour; h++) {
      slots.push(`${h.toString().padStart(2, '0')}:00`);
      slots.push(`${h.toString().padStart(2, '0')}:30`);
    }
    return slots;
  }, [startHour, endHour]);
  
  const toMinutes = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const isSameDate = (date1, date2) => (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );

  const getPlansStartingInSlot = (day, timeStr) => {
    const slotStart = toMinutes(timeStr);      
    const slotEnd   = slotStart + 30;          
    return plans.filter(plan => {
      const start = new Date(plan.start_time);
      if (!isSameDate(start, day)) return false;
      const startMin = start.getHours() * 60 + start.getMinutes();
      return startMin >= slotStart && startMin < slotEnd; 
    });
  };
  

  const handleClickPlan = (plan) => {
    setModalMode('edit');
    setModalData(plan);
    setModalOpen(true);
  };

  const handleAddPlan = () => {
    setModalMode('add');
    setModalData(null);
    setModalOpen(true);
  };

  const handleDeletePlan = async (id) => {
    const token = localStorage.getItem('token');
    try {
      await fetch(`http://localhost:5000/api/schedule/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchPlans();
      setModalOpen(false);
    } catch (err) {
      console.error('刪除失敗', err);
    }
  };

  const handleModalSubmit = async (form) => {
    const token = localStorage.getItem('token');
    const body = {
      subjectId: form.subjectId,
      startTime: form.startTime,
      endTime: form.endTime,
      note: form.note,
    };

    try {
      if (modalMode === 'add') {
        const res = await fetch('http://localhost:5000/api/schedule', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });
        await res.json();
      } else {
        const res = await fetch(`http://localhost:5000/api/schedule/${modalData.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error('更新失敗');
      }
      await fetchPlans();
      setModalOpen(false);
    } catch (err) {
      console.error('送出失敗', err);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <DatePicker
          selected={selectedDate}
          onChange={(date) => setSelectedDate(date)}
          dateFormat="yyyy/MM/dd"
        />
        <button onClick={handleAddPlan} style={{ marginLeft: '1rem' }}>➕ 新增計畫</button>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label>開始時間：</label>
            <select value={startHour} onChange={(e) => setStartHour(parseInt(e.target.value))}>
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
              ))}
            </select>
          </div>

          <div>
            <label>結束時間：</label>
            <select value={endHour} onChange={(e) => setEndHour(parseInt(e.target.value))}>
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
              ))}
            </select>
          </div>
        </div>
              </div>

      <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(7, 150px)', border: '1px solid #ccc', boxSizing: 'border-box', overflowX: 'auto', width: 'fit-content', margin: '0 auto' }}>
        <div></div>
        {weekDates.map((day, idx) => (
          <div key={idx} style={{ textAlign: 'center', padding: '0.5rem', backgroundColor: '#f2f2f2', fontSize: '14px' }}>
            {day.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric', weekday: 'short' })}
          </div>
        ))}

        {timeSlots.map((time) => (
          <React.Fragment key={time}>
            <div style={{ height: '30px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid #ccc',color: time.endsWith(':00') ? '#000' : 'transparent' }}>
              {time}
            </div>

            {weekDates.map((day, idx) => {
              const matchingPlans = getPlansStartingInSlot(day, time);
              const slotStyle = {
                borderTop: '1px solid #ccc',
                borderLeft: idx === 0 ? '1px solid #ccc' : '',
                height: '30px',
                position: 'relative',
                backgroundColor: idx % 2 === 0 ? '#fff' : '#f9f9f9',
                overflow: 'visible',
              };
              return (
                <div key={`${time}-${idx}`} style={slotStyle}>
                  {matchingPlans.map((plan) => {
                    const start = new Date(plan.start_time);
                    const end = new Date(plan.end_time);
                    const slotStartMin = toMinutes(time);
                    const startMin = start.getHours() * 60 + start.getMinutes();
                    const offsetTop = Math.max(0, startMin - slotStartMin);
                    const height = (end - start) / 60000; 

                    return (
                      <div
                        key={plan.id}
                        onClick={() => handleClickPlan(plan)}
                        style={{
                          position: 'absolute',
                          top: `${offsetTop}px`,
                          left: 2,
                          right: 2,
                          height: `${height}px`,
                          backgroundColor: 'rgba(255, 147, 41, 0.85)',
                          color: '#000',
                          fontSize: '12px',
                          padding: '2px',
                          borderRadius: '4px',
                          boxSizing: 'border-box',
                          zIndex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center',
                          textAlign: 'center',
                          cursor: 'pointer',
                          pointerEvents: 'auto',
                          overflow: 'hidden',
                        }}
                      >
                        <strong>{plan.subject_name}</strong>
                        <div style={{ fontSize: '11px' }}>
                          {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                          {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      <PlanModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleModalSubmit}
        onDelete={handleDeletePlan}
        mode={modalMode}
        planData={modalData}
        subjects={subjects}
        fetchPlans={fetchPlans}
      />
    </div>
  );
};

export default PlanPage;
