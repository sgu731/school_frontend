import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
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

  const getWeekDates = useCallback((date) => {
    const startOfWeek = new Date(date);
    const diff = startOfWeek.getDay(); // Sun = 0
    startOfWeek.setDate(date.getDate() - diff);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, []);
  const weekDates = useMemo(() => getWeekDates(selectedDate), [getWeekDates, selectedDate]);

  const handlePrevWeek = () => setSelectedDate(d => { const nd = new Date(d); nd.setDate(nd.getDate() - 7); return nd; });
  const handleNextWeek = () => setSelectedDate(d => { const nd = new Date(d); nd.setDate(nd.getDate() + 7); return nd; });

  const fetchPlans = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const startDate = new Date(weekDates[0]);
    startDate.setDate(startDate.getDate() - 7);
    const endDate = new Date(weekDates[6]);
    endDate.setDate(endDate.getDate() + 7);

    const startStr = startDate.toISOString().split('T')[0];
    const endStr   = endDate.toISOString().split('T')[0];

    try {
      const res = await fetch(
        `http://localhost:5000/api/schedule?start=${startStr}&end=${endStr}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setPlans(data.schedule || []);
    } catch (err) {
      console.error('讀取資料失敗：', err);
    }
  }, [weekDates]);

  const fetchSubjects = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const res = await fetch('http://localhost:5000/api/study/subjects', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setSubjects(data.subjects || []);
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

  const toMinutes = hhmm => hhmm.split(':').reduce((acc, x, i) => acc + (i===0?Number(x)*60:Number(x)), 0);
  const gridStartMin = useMemo(() => startHour * 60, [startHour]);

  const isOverlap = (newStart, newEnd) => plans.some(plan => {
    if (modalMode==='edit' && plan.id===modalData.id) return false;
    const ps = new Date(plan.start_time).getTime();
    const pe = new Date(plan.end_time).getTime();
    return newStart < pe && newEnd > ps;
  });

  const getPlansStartingInSlot = (day, timeStr) => {
    const slotStartMin = toMinutes(timeStr), slotEndMin = slotStartMin + 30;
    const dayStartMs   = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
    const slotAbsStart = dayStartMs + slotStartMin*60000;
    const slotAbsEnd   = dayStartMs + slotEndMin*60000;

    return plans.filter(plan => {
      const startMs = new Date(plan.start_time).getTime();
      const endMs   = new Date(plan.end_time).getTime();
      if (!(slotAbsStart < endMs && slotAbsEnd > startMs)) return false;
      const orig = startMs < dayStartMs
        ? 0
        : Math.floor(((startMs - dayStartMs)/60000)/30)*30;
      return slotStartMin === Math.max(orig, gridStartMin);
    });
  };

  const handleClickPlan   = p => { setModalMode('edit'); setModalData(p); setModalOpen(true); };
  const handleAddPlan     = () => { setModalMode('add');  setModalData(null); setModalOpen(true); };
  const handleDeletePlan  = async id => {
    const token = localStorage.getItem('token');
    await fetch(`http://localhost:5000/api/schedule/${id}`, { method:'DELETE', headers:{Authorization:`Bearer ${token}`} });
    await fetchPlans();
    setModalOpen(false);
  };
  const handleModalSubmit = async form => {
    if (!form.subjectId)      { alert('請選擇科目！'); return; }
    if (!form.startTime||!form.endTime) { alert('請選擇開始與結束時間！'); return; }

    const newStart = new Date(form.startTime).getTime();
    const newEnd   = new Date(form.endTime).getTime();
    if (newEnd <= newStart)   { alert('結束時間需晚於開始時間！'); return; }
    if (isOverlap(newStart,newEnd)) { alert('與現有計畫時間重疊！'); return; }

    const token = localStorage.getItem('token');
    const body  = { subjectId:form.subjectId, startTime:form.startTime, endTime:form.endTime, note:form.note };
    const url   = modalMode==='add'
                  ? 'http://localhost:5000/api/schedule'
                  : `http://localhost:5000/api/schedule/${modalData.id}`;
    const method= modalMode==='add' ? 'POST' : 'PUT';

    await fetch(url, {
      method,
      headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
      body:JSON.stringify(body)
    });
    await fetchPlans();
    setModalOpen(false);
  };

  return (
    <div style={{ padding:'2rem', maxWidth:'1200px', margin:'0 auto' }}>
      <div style={{ textAlign:'center', marginBottom:'1rem' }}>
        <button onClick={handlePrevWeek}>‹ 上週</button>
        <DatePicker selected={selectedDate} onChange={setSelectedDate} dateFormat="yyyy/MM/dd"/>
        <button onClick={handleNextWeek}>下週 ›</button>
        <button onClick={handleAddPlan} style={{ marginLeft:'1rem' }}>➕ 新增計畫</button>
        <div style={{ display:'flex', justifyContent:'center', gap:'1rem', marginTop:'1rem' }}>
          <div><label>開始時間：</label>
            <select value={startHour} onChange={e=>setStartHour(+e.target.value)}>
              {Array.from({length:24},(_,i)=><option key={i} value={i}>{String(i).padStart(2,'0')}:00</option>)}
            </select>
          </div>
          <div><label>結束時間：</label>
            <select value={endHour} onChange={e=>setEndHour(+e.target.value)}>
              {Array.from({length:24},(_,i)=><option key={i} value={i}>{String(i).padStart(2,'0')}:00</option>)}
            </select>
          </div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'80px repeat(7,150px)', border:'1px solid #ccc', overflowX:'auto', width:'fit-content', margin:'0 auto' }}>
        <div/>
        {weekDates.map((d,i)=>(
          <div key={i} style={{ textAlign:'center', padding:'0.5rem', background:'#f2f2f2', zIndex:10, position:'relative' }}>
            {d.toLocaleDateString('zh-TW',{month:'numeric',day:'numeric',weekday:'short'})}
          </div>
        ))}
        {timeSlots.map(time=>(
          <React.Fragment key={time}>
            <div style={{
              height:30, fontSize:'0.8rem', display:'flex', alignItems:'center', justifyContent:'center',
              borderRight:'1px solid #ccc', color:time.endsWith(':00')?'#000':'transparent'
            }}>{time}</div>
            {weekDates.map((day, idx)=>(
              <div key={idx} style={{
                borderTop:'1px solid #ccc',
                borderLeft: idx===0?'1px solid #ccc':'',
                height:30,
                position:'relative',
                overflow:'visible',
                background: idx%2===0?'#fff':'#f9f9f9'
              }}>
                {getPlansStartingInSlot(day, time).map(plan=>{
                  const s = new Date(plan.start_time).getTime();
                  const e = new Date(plan.end_time).getTime();
                  const ds= new Date(day.getFullYear(),day.getMonth(),day.getDate()).getTime();
                  const vs= Math.max(s, ds);
                  const ve= Math.min(e, ds+1440*60000);
                  const top = (vs-ds)/60000 - toMinutes(time);
                  const h   = (ve-vs)/60000;
                  return (
                    <div key={plan.id} onClick={()=>handleClickPlan(plan)} style={{
                      position:'absolute',
                      top:`${top}px`,
                      left:2, right:2,
                      height:`${h}px`,
                      background:'rgba(255,147,41,0.85)',
                      borderRadius:4,
                      fontSize:12,
                      display:'flex',
                      flexDirection:'column',
                      justifyContent:'center',
                      alignItems:'center',
                      cursor:'pointer',
                      zIndex:5
                    }}>
                      <strong>{plan.subject_name}</strong>
                      <span style={{ fontSize:11 }}>
                        {new Date(plan.start_time).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}
                        {' – '}
                        {new Date(plan.end_time).toLocaleTimeString([],   {hour:'2-digit',minute:'2-digit'})}
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
    </div>
  );
};

export default PlanPage;
