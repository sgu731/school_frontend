import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './PlanPage.css';
import PlanModal from '../components/PlanModal';
import { useTranslation } from 'react-i18next'; // 導入 useTranslation

const PlanPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [plans, setPlans]               = useState([]);
  const [subjects, setSubjects]         = useState([]);
  const [modalOpen, setModalOpen]       = useState(false);
  const [modalMode, setModalMode]       = useState('add');
  const [modalData, setModalData]       = useState(null);
  const [startHour, setStartHour]       = useState(0);
  const [endHour,   setEndHour]         = useState(23);
  const { i18n } = useTranslation(); // 獲取 i18n 實例以取得當前語言
  const locale = i18n.language === 'en' ? 'en-US' : 'zh-TW';
  const { t } = useTranslation('plan'); // 指定 plan 命名空間

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
    if (!token) {
      console.error('無效的 token');
      return;
    }
    const start = new Date(weekDates[0]); start.setDate(start.getDate() - 7);
    const end   = new Date(weekDates[6]); end.setDate(end.getDate() + 7);
    const qs = `start=${start.toISOString().slice(0,10)}&end=${end.toISOString().slice(0,10)}`;
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/schedule?${qs}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(`HTTP 錯誤: ${res.status}`);
      const data = await res.json();
      setPlans(data.schedule || []);
    } catch (err) {
      console.error('讀取排程失敗', err);
    }
  }, [weekDates]);

  const fetchSubjects = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('無效的 token');
      return;
    }
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/study/subjects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(`HTTP 錯誤: ${res.status}`);
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
      if (modalMode==='edit' && p.id===modalData?.id) return false;
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
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/schedule/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(`HTTP 錯誤: ${res.status}`);
      await fetchPlans();
      setModalOpen(false);
    } catch (err) {
      console.error('刪除計畫失敗', err);
      alert(t('deletePlanFailed')); // 使用翻譯
    }
  };

  const handleModalSubmit = async form => {
    if (!form.subjectId) return alert(t('selectSubject')); // 使用翻譯
    if (!form.startTime || !form.endTime) return alert(t('selectTime')); // 使用翻譯

    const ns = new Date(form.startTime).getTime();
    const ne = new Date(form.endTime).getTime();
    if (ne <= ns) return alert(t('endTimeAfterStart')); // 使用翻譯
    if (isOverlap(ns, ne)) return alert(t('timeOverlap')); // 使用翻譯

    const token = localStorage.getItem('token');
    if (!token) {
      console.error('無效的 token');
      return alert(t('relogin')); // 使用翻譯
    }

    const url = modalMode === 'add'
      ? `${process.env.REACT_APP_API_URL}/api/schedule`
      : `${process.env.REACT_APP_API_URL}/api/schedule/${modalData?.id}`;
    const method = modalMode === 'add' ? 'POST' : 'PUT';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          subjectId: form.subjectId,
          startTime: form.startTime,
          endTime: form.endTime,
          note: form.note || ''
        })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(`HTTP 錯誤: ${res.status}, 訊息: ${errorData.message || '未知錯誤'}`);
      }
      await fetchPlans();
      setModalOpen(false);
    } catch (err) {
      console.error(`${modalMode === 'add' ? '新增' : '編輯'}計畫失敗`, err);
      alert(t(modalMode === 'add' ? 'addPlanFailed' : 'editPlanFailed', { message: err.message })); // 使用翻譯
    }
  };

  return (
    <div className="plan-page">
      <div className="week-nav-container">
        <button className="week-nav-btn" onClick={handlePrevWeek}>{t('prevWeek')}</button>
        <DatePicker
          className="week-nav-date-picker"
          selected={selectedDate}
          onChange={setSelectedDate}
          dateFormat="yyyy/MM/dd"
        />
        <button className="week-nav-btn" onClick={handleNextWeek}>{t('nextWeek')}</button>
        <button className="week-nav-btn primary" onClick={handleAddPlan}>{t('addPlan')}</button>
      </div>

      <div className="week-nav-time-row">
        <label className="week-nav-label">{t('startTimeLabel')}</label>
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

      <div className="schedule-grid">
        <div className="grid-header empty-cell"></div>
        {weekDates.map((d, i) => (
          <div key={i} className="grid-header">
            {d.toLocaleDateString(locale, { month:'numeric', day:'numeric', weekday:'short' })}
          </div>
        ))}
        {timeSlots.map(time => (
          <React.Fragment key={time}>
            <div className="time-slot" data-half-hour={time.endsWith(':30') ? 'true' : undefined}>
              {time}
            </div>
            {weekDates.map((day, idx) => (
              <div key={idx} className="grid-cell">
                {getPlansStartingInSlot(day, time).map(plan => {
                  const ps = new Date(plan.start_time).getTime();
                  const pe = new Date(plan.end_time).getTime();
                  const ds = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
                  const vs = Math.max(ps, ds);
                  const ve = Math.min(pe, ds + 1440*60000);
                  const top = (vs - ds)/60000 - toMinutes(time);
                  const h   = (ve - vs)/60000;
                  return (
                    <div
                      key={plan.id}
                      className="plan-block"
                      onClick={() => handleClickPlan(plan)}
                      style={{
                        '--plan-bg': subjectColorMap[plan.subject_name] || 'rgba(255,147,41,0.85)',
                        '--plan-top': `${top}px`,
                        '--plan-height': `${h}px`
                      }}
                    >
                      <strong className="plan-subject">{plan.subject_name}</strong>
                      <span className="plan-time">
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

      <div className="subject-legend">
        {Object.entries(subjectColorMap).map(([name, color]) => (
          <div key={name} className="legend-item">
            <div
              className="legend-color"
              style={{ '--legend-bg': color }}
            />
            <span>{name}</span>
          </div>
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
      />
    </div>
  );
};

export default PlanPage;