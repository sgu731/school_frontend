import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer
} from 'recharts';
import {
  PieChart,
  Pie,
  Cell
} from 'recharts';

const barData = [
  { date: '12/1', Java: 4, Python: 2, C: 1, Calculus: 3 },
  { date: '12/2', Java: 3, Python: 2, C: 0, Calculus: 0 },
  { date: '12/3', Java: 0, Python: 0, C: 0, Calculus: 0 }, 
  { date: '12/4', Java: 2, Python: 1, C: 0, Calculus: 0 },
  { date: '12/5', Java: 3, Python: 2, C: 2, Calculus: 4 },
  { date: '12/6', Java: 4, Python: 2, C: 3, Calculus: 4 },
  { date: '12/7', Java: 0, Python: 0, C: 0, Calculus: 0 },
  { date: '12/8', Java: 5, Python: 2, C: 2, Calculus: 5 },
  { date: '12/9', Java: 0, Python: 0, C: 0, Calculus: 0 },
  { date: '12/10', Java: 3, Python: 3, C: 0, Calculus: 2 },
];

const pieData = [
  { name: 'Java', value: 10 },
  { name: 'Python', value: 7 },
  { name: 'C', value: 4 },
  { name: 'Calculus', value: 8 },
];

const COLORS = ['#4472c4', '#ed7d31', '#70ad47', '#5b9bd5'];

const TrackerPage = () => {
  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ textAlign: 'left' }}>成效追蹤</h2>

      <div style={{
        marginTop: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: '2rem', flexWrap: 'wrap'
      }}>
        {/* 長條圖 */}
        <div style={{ flex: 1, minWidth: '400px' }}>
          <h3>綜合學習時間</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" interval={0} tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="Java" stackId="a" fill={COLORS[0]} />
              <Bar dataKey="Python" stackId="a" fill={COLORS[1]} />
              <Bar dataKey="C" stackId="a" fill={COLORS[2]} />
              <Bar dataKey="Calculus" stackId="a" fill={COLORS[3]} />
            </BarChart>
          </ResponsiveContainer>

          {/* 長條圖圖例 */}
          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '1.5rem' }}>
            {pieData.map((item, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  width: '12px', height: '12px', backgroundColor: COLORS[index % COLORS.length], marginRight: '0.5rem', borderRadius: '2px'
                }}></div>
                <span style={{ fontSize: '0.9rem' }}>{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 圓餅圖 */}
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

          {/* 圓餅圖圖例 */}
          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '1.5rem' }}>
            {pieData.map((item, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  width: '12px', height: '12px', backgroundColor: COLORS[index % COLORS.length], marginRight: '0.5rem', borderRadius: '2px'
                }}></div>
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
