import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#4472c4', '#ed7d31', '#70ad47', '#5b9bd5'];

const TrackerPage = () => {
  const [barData, setBarData] = useState([]);
  const [pieData, setPieData] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch('http://localhost:5000/api/study/study-records', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const records = data.studyRecords;
        const formatted = records.map(r => ({
          ...r,
          date: new Date(r.created_at).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' })
        }));

        const barMap = {};
        const pieMap = {};

        for (const r of formatted) {
          const subj = r.subject_name;
          const hrs = r.duration / 3600;
          barMap[r.date] = barMap[r.date] || {};
          barMap[r.date][subj] = (barMap[r.date][subj] || 0) + hrs;
          pieMap[subj] = (pieMap[subj] || 0) + hrs;
        }

        const barList = Object.entries(barMap).map(([date, subjects]) => ({
          date,
          ...subjects
        }));

        const pieList = Object.entries(pieMap).map(([name, value]) => ({ name, value }));

        setBarData(barList);
        setPieData(pieList);
      });
  }, []);

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ textAlign: 'left' }}>成效追蹤</h2>

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
                <Bar key={item.name} dataKey={item.name} stackId="a" fill={COLORS[index % COLORS.length]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '1.5rem' }}>
            {pieData.map((item, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '12px', height: '12px', backgroundColor: COLORS[index % COLORS.length], marginRight: '0.5rem', borderRadius: '2px' }}></div>
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
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '1.5rem' }}>
            {pieData.map((item, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '12px', height: '12px', backgroundColor: COLORS[index % COLORS.length], marginRight: '0.5rem', borderRadius: '2px' }}></div>
                <span style={{ fontSize: '0.9rem' }}>{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <h3 style={{ textAlign: 'left' }}>相關資源</h3>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <div style={{ width: '100px', height: '100px', backgroundColor: '#eee', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>▶</div>
        <div style={{ width: '100px', height: '100px', backgroundColor: '#eee', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>▶</div>
        <div style={{ width: '100px', height: '100px', backgroundColor: '#eee', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>▶</div>
      </div>
    </div>
  );
};

export default TrackerPage;
