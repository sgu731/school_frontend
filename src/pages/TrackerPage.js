import React, { useEffect, useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import './PlanPage.css';  // 確保引入樣式檔

const getWeekStart = (d = new Date()) => {
  const s = new Date(d);
  s.setHours(0, 0, 0, 0);
  s.setDate(s.getDate() - s.getDay());
  return s;
};

const SubjectLegend = ({ colorMap, shownSubjects }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem' }}>
    {shownSubjects.map(subj => (
      <div key={subj} style={{ display: 'flex', alignItems: 'center' }}>
        <div
          style={{
            width: 12,
            height: 12,
            background: colorMap[subj],
            marginRight: 6,
            borderRadius: 2
          }}
        />
        <span style={{ fontSize: 12 }}>{subj}</span>
      </div>
    ))}
  </div>
);

const TrackerPage = () => {
  const [barData, setBarData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [records, setRecords] = useState([]);
  const [weekStart, setWeekStart] = useState(getWeekStart());
  const [filterSubj, setFilterSubj] = useState('');
  const [startHour, setStartHour] = useState(8);
  const [endHour, setEndHour] = useState(23);

  const fetchStudyRecords = () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch('http://localhost:5000/api/study/study-records', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        const rec = data.studyRecords || [];
        setRecords(rec);

        // 準備圖表資料
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
          barMap[r.date][r.subject_name] =
            (barMap[r.date][r.subject_name] || 0) + hrs;
          pieMap[r.subject_name] = (pieMap[r.subject_name] || 0) + hrs;
        });

        setBarData(
          Object.entries(barMap).map(([date, obj]) => ({ date, ...obj }))
        );
        setPieData(
          Object.entries(pieMap).map(([name, value]) => ({ name, value }))
        );
      })
      .catch(err => console.error('讀取學習紀錄失敗', err));
  };

  useEffect(() => {
    fetchStudyRecords();
  }, []);

  useEffect(() => {
    if (startHour > endHour) setEndHour(startHour);
  }, [startHour, endHour]);

  const generateColor = index => `hsl(${(index * 47) % 360}, 50%, 65%)`;

  const subjectColorMap = useMemo(() => {
    const seen = new Map();
    let colorIndex = 0;
    records.forEach(r => {
      const subj = r.subject_name;
      if (!seen.has(subj)) {
        seen.set(subj, generateColor(colorIndex++));
      }
    });
    return Object.fromEntries(seen);
  }, [records]);

  const weekEnd = useMemo(
    () => new Date(weekStart.getTime() + 7 * 86400000),
    [weekStart]
  );

  const weekBarData = useMemo(
    () =>
      barData.filter(d => {
        const date = new Date(`${new Date().getFullYear()}/${d.date}`);
        return date >= weekStart && date < weekEnd;
      }),
    [barData, weekStart, weekEnd]
  );

  const weekSubjects = useMemo(() => {
    const set = new Set();
    weekBarData.forEach(day => {
      Object.keys(day).forEach(k => {
        if (k !== 'date') set.add(k);
      });
    });
    return Array.from(set);
  }, [weekBarData]);

  const weekPieData = useMemo(() => {
    const map = {};
    weekBarData.forEach(day => {
      Object.keys(day).forEach(k => {
        if (k !== 'date') map[k] = (map[k] || 0) + day[k];
      });
    });
    return Object.entries(map).map(([name, value]) => ({
      name,
      value
    }));
  }, [weekBarData]);

  const now = getWeekStart();
  const canNext = weekStart < now;
  const prevWeek = () =>
    setWeekStart(new Date(weekStart.getTime() - 7 * 86400000));
  const nextWeek = () =>
    canNext && setWeekStart(new Date(weekStart.getTime() + 7 * 86400000));

  const weekSlots = useMemo(() => {
    return records
      .filter(r => {
        const t = new Date(r.created_at);
        return (
          t >= weekStart &&
          t < weekEnd &&
          (!filterSubj || r.subject_name === filterSubj) &&
          t.getHours() >= startHour &&
          t.getHours() <= endHour
        );
      })
      .map(r => {
        const s = new Date(r.created_at);
        return {
          subject: r.subject_name,
          col: s.getDay(),
          rowStart: s.getHours() * 2 + Math.floor(s.getMinutes() / 30),
          span: Math.ceil(r.duration / 1800),
          startTime: s,
          endTime: new Date(s.getTime() + r.duration * 1000)
        };
      });
  }, [records, weekStart, weekEnd, filterSubj, startHour, endHour]);

  const groupedSlots = useMemo(
    () =>
      weekSlots.reduce((m, s) => {
        const k = `${s.col}_${s.rowStart}`;
        return { ...m, [k]: [...(m[k] || []), s] };
      }, {}),
    [weekSlots]
  );

  const days = ['日', '一', '二', '三', '四', '五', '六'];
  const headerDates = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        return `${d.getMonth() + 1}/${('0' + d.getDate()).slice(-2)} (${
          days[i]
        })`;
      }),
    [weekStart]
  );

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* 上方週切換按鈕 */}
      <div className="week-nav-container">
        <button className="week-nav-btn" onClick={prevWeek}>
          ＜ 上週
        </button>
        <button
          className="week-nav-btn"
          onClick={nextWeek}
          disabled={!canNext}
        >
          下週 ＞
        </button>
      </div>

      {/* 圖表區 */}
      <div
        style={{
          marginTop: '2rem',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          gap: '2rem',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ flex: 1, minWidth: '400px' }}>
          <h3>綜合學習時間</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weekBarData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" interval={0} tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip
                formatter={(v, name) => [
                  `${Math.floor(v * 60)}分${Math.floor((v * 3600) % 60)}秒`,
                  name
                ]}
              />
              {weekSubjects.map(name => (
                <Bar
                  key={name}
                  dataKey={name}
                  stackId="a"
                  fill={subjectColorMap[name]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
          <SubjectLegend
            colorMap={subjectColorMap}
            shownSubjects={weekSubjects}
          />
        </div>

        <div style={{ flex: 1, minWidth: '400px' }}>
          <h3>學習時間比例</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Tooltip
                formatter={(value, name) => [`${(value * 60).toFixed(0)} 分鐘`, name]}
              />
              <Pie
                data={weekPieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
              >
                {weekPieData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={subjectColorMap[entry.name]}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <SubjectLegend
            colorMap={subjectColorMap}
            shownSubjects={weekSubjects}
          />
        </div>
      </div>

      {/* 篩選列 */}
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

        <label className="week-nav-label">結束時間：</label>
        <select
          className="week-nav-select"
          value={endHour}
          onChange={e => setEndHour(+e.target.value)}
        >
          {Array.from({ length: 24 }, (_, i) => (
            <option key={i} value={i}>
              {String(i).padStart(2, '0')}:00
            </option>
          ))}
        </select>

        <label className="week-nav-label">顯示科目：</label>
        <select
          className="week-nav-select"
          value={filterSubj}
          onChange={e => setFilterSubj(e.target.value)}
        >
          <option value="">全部科目</option>
          {Object.keys(subjectColorMap)
            .sort()
            .map(subj => (
              <option key={subj} value={subj}>
                {subj}
              </option>
            ))}
        </select>
      </div>

      {/* 時刻表區 */}
      <div style={{ marginTop: '2rem' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '60px repeat(7, 1fr)',
            textAlign: 'center',
            fontWeight: 500
          }}
        >
          <div></div>
          {headerDates.map((t, i) => (
            <div key={i}>{t}</div>
          ))}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '60px repeat(7, 1fr)',
            gridTemplateRows: `repeat(${(endHour -
              startHour +
              1) *
              2}, 20px)`,
            border: '1px solid #ddd'
          }}
        >
          {/* 左側時間軸 */}
          {Array.from({ length: (endHour - startHour + 1) * 2 }).map(
            (_, i) => {
              const hour = startHour + Math.floor(i / 2);
              return i % 2 === 0 ? (
                <div
                  key={`time-${i}`}
                  style={{
                    gridColumn: 1,
                    gridRow: `${i + 1}`,
                    fontSize: 10,
                    borderRight: '1px solid #ddd',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {`${hour.toString().padStart(2, '0')}:00`}
                </div>
              ) : (
                <div
                  key={`half-${i}`}
                  style={{
                    gridColumn: 1,
                    gridRow: `${i + 1}`,
                    borderRight: '1px solid #ddd'
                  }}
                />
              );
            }
          )}

          {/* 背景格線 */}
          {Array.from({
            length: (endHour - startHour + 1) * 2 * 7
          }).map((_, i) => (
            <div
              key={`bg-${i}`}
              style={{ borderBottom: '1px solid #f5f5f5' }}
            />
          ))}

          {/* 實際計畫顯示 */}
          {Object.entries(groupedSlots).map(([key, group]) => {
            const [col, rowStart] = key.split('_').map(Number);
            const span = Math.max(...group.map(s => s.span));
            return (
              <div
                key={key}
                style={{
                  gridColumn: col + 2,
                  gridRow: `${rowStart - startHour * 2 +
                    1} / span ${span}`,
                  display: 'flex'
                }}
              >
                {group.map((s, i) => (
                  <div
                    key={i}
                    title={`${s.subject} ${s.startTime.toLocaleTimeString(
                      [],
                      {
                        hour: '2-digit',
                        minute: '2-digit'
                      }
                    )} – ${s.endTime.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}`}
                    style={{
                      flex: 1,
                      background: subjectColorMap[s.subject],
                      color: '#fff',
                      fontSize: 10,
                      padding: 2,
                      borderRadius: 4,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {s.subject}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TrackerPage;
