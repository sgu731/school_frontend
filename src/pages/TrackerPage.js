import React, { useEffect, useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#4472c4', '#ed7d31', '#70ad47', '#5b9bd5'];

const getWeekStart = (d = new Date()) => {
  const s = new Date(d);
  s.setHours(0, 0, 0, 0);
  s.setDate(s.getDate() - s.getDay());
  return s;
};

const TrackerPage = () => {
  const [barData, setBarData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [records, setRecords] = useState([]);
  const [weekStart, setWeekStart] = useState(getWeekStart());
  const [filterSubj, setFilterSubj] = useState('');
  const [startHour, setStartHour] = useState(8);
  const [endHour, setEndHour] = useState(23);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch('http://localhost:5000/api/study/study-records', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        const rec = data.studyRecords || [];
        setRecords(rec);

        const formatted = rec.map(r => ({
          ...r,
          date: new Date(r.created_at).toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit'
          })
        }));
        const barMap = {};
        const pieMap = {};
        formatted.forEach(r => {
          const hrs = r.duration / 3600;
          barMap[r.date] = barMap[r.date] || {};
          barMap[r.date][r.subject_name] = (barMap[r.date][r.subject_name] || 0) + hrs;
          pieMap[r.subject_name] = (pieMap[r.subject_name] || 0) + hrs;
        });
        setBarData(Object.entries(barMap).map(([date, obj]) => ({ date, ...obj })));
        setPieData(Object.entries(pieMap).map(([name, value]) => ({ name, value })));
      });
  }, []);

  useEffect(() => {
    if (startHour > endHour) {
      setEndHour(startHour);
    }
  }, [startHour]);  

  const weekSlots = useMemo(() => {
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 3600 * 1000);
    return records
      .filter(r => {
        const t = new Date(r.created_at);
        const inWeek = t >= weekStart && t < weekEnd;
        const inSubj = !filterSubj || r.subject_name === filterSubj;
        return inWeek && inSubj;
      })
      .map(r => {
        const start = new Date(r.created_at);
        return {
          subject: r.subject_name,
          col: start.getDay(),
          rowStart: start.getHours() * 2 + Math.floor(start.getMinutes() / 30),
          span: Math.ceil(r.duration / 1800),
          startTime: start,
          endTime: new Date(start.getTime() + r.duration * 1000),
          duration: r.duration
        };
      });
  }, [records, weekStart, filterSubj]);

  const subjectColorMap = useMemo(() => {
    const map = {};
    let idx = 0;
    records.forEach(r => {
      if (!map[r.subject_name]) {
        map[r.subject_name] = COLORS[idx % COLORS.length];
        idx += 1;
      }
    });
    return map;
  }, [records]);

  const weekTotalHours = useMemo(() => {
    return weekSlots.reduce((sum, s) => sum + s.duration / 3600, 0).toFixed(2);
  }, [weekSlots]);

  const days = ['日', '一', '二', '三', '四', '五', '六'];
  const headerDates = useMemo(() => Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return `${d.getMonth() + 1}/${('0' + d.getDate()).slice(-2)} (${days[i]})`;
  }), [weekStart]);

  const nowWeekStart = getWeekStart();
  const canNext = weekStart < nowWeekStart;
  const prevWeek = () => setWeekStart(new Date(weekStart.getTime() - 7 * 24 * 3600 * 1000));
  const nextWeek = () => canNext && setWeekStart(new Date(weekStart.getTime() + 7 * 24 * 3600 * 1000));

  const WeekTable = () => (
    <div style={{ marginTop: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>時刻表</h3>
        
        <div>
          <button onClick={prevWeek} style={{ marginRight: 8 }}>＜ 上週</button>
          <button onClick={nextWeek} disabled={!canNext}>下週 ＞</button>
        </div>
      </div>

      <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <label style={{ marginRight: '0.3rem' }}>開始時間：</label>
          <select value={startHour} onChange={(e) => setStartHour(parseInt(e.target.value))}>
            {Array.from({ length: 24 }, (_, i) => (
              <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ marginRight: '0.3rem' }}>結束時間：</label>
          <select value={endHour} onChange={(e) => setEndHour(parseInt(e.target.value))}>
            {Array.from({ length: 24 }, (_, i) => (
              <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
            ))}
          </select>
        </div>
      </div>

      {/* 篩選下拉 */}
      <div style={{ marginTop:'1rem', width:'100%', textAlign:'center' }}>
        <label htmlFor="filterSubj" style={{ marginRight:'0.5rem' }}>顯示科目：</label>
        <select id="filterSubj" value={filterSubj} onChange={e=>setFilterSubj(e.target.value)}>
          <option value=''>全部科目</option>
          {Object.keys(subjectColorMap).map(name=> <option key={name} value={name}>{name}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)', textAlign: 'center', fontWeight: 500, margin: '4px 0' }}>
        <div></div>
        {headerDates.map((t, i) => <div key={i}>{t}</div>)}
      </div>

      <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)', gridAutoRows: '20px', border: '1px solid #ddd' }}>
      
        {Array.from({ length: endHour - startHour + 1 }).map((_, i) => {
          const h = startHour + i;
          return (
            <div key={h} style={{ gridColumn: 1, gridRow: `${i * 2 + 1} / span 2`, borderBottom: '1px solid #f5f5f5', fontSize: 10, display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
              {`${('0' + h).slice(-2)}:00`}
            </div>
          );
        })}

        {Array.from({ length: (endHour - startHour + 1) * 2 * 7 }).map((_, i) => (
          <div key={`bg-${i}`} style={{ borderBottom: '1px solid #f5f5f5' }} />
        ))}

        {weekSlots
          .filter(s => {
            const row = s.rowStart;
            const minRow = startHour * 2;
            const maxRow = (endHour + 1) * 2;
            return row >= minRow && row < maxRow;
          })
          .map((s, i) => (
            <div
              key={i}
              style={{
                gridColumn: s.col + 2,
                gridRow: `${s.rowStart - startHour * 2 + 1} / span ${s.span}`,
                background: subjectColorMap[s.subject],
                color: '#fff',
                fontSize: 10,
                padding: 2,
                borderRadius: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <div>{s.subject}</div>
              <div>{s.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}–{s.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
        ))}

      </div>

      {/* Legend */}
      <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {Object.entries(subjectColorMap).map(([subj, col]) => (
          <div key={subj} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: 12, height: 12, background: col, marginRight: 6, borderRadius: 2 }} />
            <span style={{ fontSize: 12 }}>{subj}</span>
          </div>
        ))}
      </div>

      {/* 本週總時數統計 */}
      <div style={{ marginTop: '1rem', fontSize: '0.95rem', fontWeight: 500 }}>
        本週總學習時數：{weekTotalHours} hrs
      </div>
    </div>
  );

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ textAlign: 'left' }}>成效追蹤</h2>

      {/* 上方兩張圖表 */}
      <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: '2rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '400px' }}>
          <h3>綜合學習時間</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" interval={0} tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              {pieData.map((item, index) => (
                <Bar key={item.name} dataKey={item.name} stackId="a" fill={subjectColorMap[item.name] || COLORS[index % COLORS.length]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '1.5rem' }}>
            {pieData.map((item, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '12px', height: '12px', backgroundColor: subjectColorMap[item.name] || COLORS[index % COLORS.length], marginRight: '0.5rem', borderRadius: '2px' }}></div>
                <span style={{ fontSize: '0.9rem' }}>{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, minWidth: '400px' }}>
          <h3>學習時間比例</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={subjectColorMap[entry.name] || COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '1.5rem' }}>
            {pieData.map((item, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '12px', height: '12px', backgroundColor: subjectColorMap[item.name] || COLORS[index % COLORS.length], marginRight: '0.5rem', borderRadius: '2px' }}></div>
                <span style={{ fontSize: '0.9rem' }}>{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <WeekTable />
    </div>
  );
};

export default TrackerPage;
