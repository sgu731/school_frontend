import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './PlanPage.css';
import PlanModal from '../components/PlanModal';

const PlanPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [plans, setPlans]               = useState([]);
  const [subjects, setSubjects]         = useState([]);
  const [modalOpen, setModalOpen]       = useState(false);
  const [modalMode, setModalMode]       = useState('add');
  const [modalData, setModalData]       = useState(null);
  const [startHour, setStartHour]       = useState(0);
  const [endHour,   setEndHour]         = useState(23);

  const generateColor = idx => `hsl(${(idx * 47) % 360},50%,65%)`;
  const subjectColorMap = useMemo(() => {
    const map = {};
    subjects.forEach((s, i) => { map[s.name] = generateColor(i); });
    return map;
  }, [subjects]);

  const getWeekDates = useCallback(date => {
    const d = new Date(date);
    d.setDate(d.getDate() - d.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const dd = new Date(d);
      dd.setDate(d.getDate() + i);
      return dd;
    });
  }, []);
  const weekDates = useMemo(() => getWeekDates(selectedDate), [getWeekDates, selectedDate]);

  const handlePrevWeek = () =>
    setSelectedDate(d => { const nd = new Date(d); nd.setDate(nd.getDate() - 7); return nd; });
  const handleNextWeek = () =>
    setSelectedDate(d => { const nd = new Date(d); nd.setDate(nd.getDate() + 7); return nd; });

  const fetchPlans = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const start = new Date(weekDates[0]); start.setDate(start.getDate() - 7);
    const end   = new Date(weekDates[6]); end.setDate(end.getDate() + 7);
    const qs = `start=${start.toISOString().slice(0,10)}&end=${end.toISOString().slice(0,10)}`;
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/schedule?${qs}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setPlans(data.schedule || []);
    } catch (err) {
      console.error('讀取排程失敗', err);
    }
  }, [weekDates]);

  const fetchSubjects = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res  = await fetch(`${process.env.REACT_APP_API_URL}/api/study/subjects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setSubjects(data.subjects || []);
    } catch (err) {
      console.error('讀取科目失敗', err);
    }
  }, []);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);
  useEffect(() => { fetchSubjects(); }, [fetchSubjects]);
  useEffect(() => { if (startHour > endHour) setEndHour(startHour); }, [startHour, endHour]);

  const timeSlots = useMemo(() => {
    const slots = [];
    for (let h = startHour; h <= endHour; h++) {
      slots.push(`${String(h).padStart(2,'0')}:00`);
      slots.push(`${String(h).padStart(2,'0')}:30`);
    }
    return slots;
  }, [startHour, endHour]);

  const toMinutes = hhmm =>
    hhmm.split(':').reduce((sum, x, i) => sum + (i===0 ? Number(x)*60 : Number(x)), 0);
  const gridStartMin = useMemo(() => startHour * 60, [startHour]);

  const isOverlap = (ns, ne) =>
    plans.some(p => {
      if (modalMode==='edit' && p.id===modalData.id) return false;
      const ps = new Date(p.start_time).getTime();
      const pe = new Date(p.end_time).getTime();
      return ns < pe && ne > ps;
    });

  const getPlansStartingInSlot = (day, timeStr) => {
    const slotStart = toMinutes(timeStr);
    const slotEnd   = slotStart + 30;
    const dayMs     = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
    return plans.filter(p => {
      const ps = new Date(p.start_time).getTime();
      const pe = new Date(p.end_time).getTime();
      if (!(dayMs+slotStart*60000 < pe && dayMs+slotEnd*60000 > ps)) return false;
      const orig = ps < dayMs
        ? 0
        : Math.floor(((ps - dayMs)/60000)/30)*30;
      return slotStart === Math.max(orig, gridStartMin);
    });
  };

  const handleClickPlan   = p => { setModalMode('edit'); setModalData(p); setModalOpen(true); };
  const handleAddPlan     = () => { setModalMode('add'); setModalData(null); setModalOpen(true); };
  const handleDeletePlan  = async id => {
    const token = localStorage.getItem('token');
    await fetch(`${process.env.REACT_APP_API_URL}/api/schedule/${id}`, {
      method:'DELETE', headers:{ Authorization:`Bearer ${token}` }
    });
    await fetchPlans();
    setModalOpen(false);
  };
  const handleModalSubmit = async form => {
    if (!form.subjectId)                  return alert('請選擇科目！');
    if (!form.startTime || !form.endTime) return alert('請選擇開始與結束時間！');

    const ns = new Date(form.startTime).getTime();
    const ne = new Date(form.endTime).getTime();
    if (ne <= ns)                         return alert('結束時間需晚於開始時間！');
    if (isOverlap(ns, ne))               return alert('與現有計畫時間重疊！');

    const token = localStorage.getItem('token');
    const url   = modalMode==='add'
      ? `${process.env.REACT_APP_API_URL}/api/schedule`
      : `${process.env.REACT_APP_API_URL}/api/schedule/${modalData.id}`;
    const method = modalMode==='add' ? 'POST' : 'PUT';
    await fetch(url, {
      method,
      headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
      body: JSON.stringify({
        subjectId: form.subjectId,
        startTime: form.startTime,
        endTime:   form.endTime,
        note:      form.note
      })
    });
    await fetchPlans();
    setModalOpen(false);
  };

  return (
    <div style={{ padding:'2rem', maxWidth:'1200px', margin:'0 auto' }}>

      <div className="week-nav-container">
        <button className="week-nav-btn" onClick={handlePrevWeek}>‹ 上週</button>
        <DatePicker
          className="week-nav-date-picker"
          selected={selectedDate}
          onChange={setSelectedDate}
          dateFormat="yyyy/MM/dd"
        />
        <button className="week-nav-btn" onClick={handleNextWeek}>下週 ›</button>
        <button className="week-nav-btn primary" onClick={handleAddPlan}>新增計畫</button>
      </div>

      <div className="week-nav-time-row">
        <label className="week-nav-label">開始時間：</label>
        <select
          className="week-nav-select"
          value={startHour}
          onChange={e => setStartHour(+e.target.value)}
        >
          {Array.from({ length: 24 }, (_, i) => (
            <option key={i} value={i}>
              {String(i).padStart(2, '0')}:00
            </option>
          ))}
        </select>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '80px repeat(7,150px)',
        border: '1px solid #ccc',
        overflowX: 'auto',
        width: 'fit-content',
        margin: '0 auto'
      }}>
        <div />
        {weekDates.map((d, i) => (
          <div key={i} style={{
            textAlign: 'center',
            padding: '0.5rem',
            background: '#f2f2f2',
            position: 'relative',
            zIndex: 10
          }}>
            {d.toLocaleDateString('zh-TW', { month:'numeric', day:'numeric', weekday:'short' })}
          </div>
        ))}
        {timeSlots.map(time => (
          <React.Fragment key={time}>
            <div style={{
              height: 30,
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRight: '1px solid #ccc',
              color: time.endsWith(':00') ? '#000' : 'transparent'
            }}>
              {time}
            </div>
            {weekDates.map((day, idx) => (
              <div key={idx} style={{
                borderTop: '1px solid #ccc',
                borderLeft: idx===0 ? '1px solid #ccc' : '',
                height: 30,
                position: 'relative',
                overflow: 'visible',
                background: idx%2===0 ? '#fff' : '#f9f9f9'
              }}>
                {getPlansStartingInSlot(day, time).map(plan => {
                  const ps = new Date(plan.start_time).getTime();
                  const pe = new Date(plan.end_time).getTime();
                  const ds = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
                  const vs = Math.max(ps, ds);
                  const ve = Math.min(pe, ds + 1440*60000);
                  const top = (vs - ds)/60000 - toMinutes(time);
                  const h   = (ve - vs)/60000;
                  return (
                    <div key={plan.id}
                         onClick={()=>handleClickPlan(plan)}
                         style={{
                           position: 'absolute',
                           top: `${top}px`,
                           left: 2, right: 2,
                           height: `${h}px`,
                           background: subjectColorMap[plan.subject_name] || 'rgba(255,147,41,0.85)',
                           borderRadius: 4,
                           fontSize: 12,
                           display: 'flex',
                           flexDirection: 'column',
                           justifyContent: 'center',
                           alignItems: 'center',
                           cursor: 'pointer',
                           zIndex: 5
                         }}>
                      <strong>{plan.subject_name}</strong>
                      <span style={{ fontSize: 11 }}>
                        {new Date(plan.start_time).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
                        {' – '}
                        {new Date(plan.end_time).toLocaleTimeString([],   { hour:'2-digit', minute:'2-digit' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>

      <PlanModal
        isOpen={modalOpen}
        onClose={()=>setModalOpen(false)}
        onSubmit={handleModalSubmit}
        onDelete={handleDeletePlan}
        mode={modalMode}
        planData={modalData}
        subjects={subjects}
      />

      {/* legend */}
      <div style={{ marginTop:'2rem', display:'flex', flexWrap:'wrap', gap:'1rem', justifyContent:'center' }}>
        {Object.entries(subjectColorMap).map(([name,color])=>(
          <div key={name} style={{ display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:12, height:12, backgroundColor:color, borderRadius:2 }} />
            <span>{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlanPage;