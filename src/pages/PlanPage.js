import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const plans = [
  {
    id: 1,
    subject: '複習微積分',
    day: 0,
    start: '13:30',
    end: '15:30',
  },
  {
    id: 2,
    subject: '複習初會',
    day: 3,
    start: '13:00',
    end: '17:00',
  },
];

const PlanPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  // 計算當週的 7 天日期
  const getWeekDates = (date) => {
    const startOfWeek = new Date(date);
    const diff = startOfWeek.getDay(); // 星期幾（0～6）
    startOfWeek.setDate(date.getDate() - diff);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      return d;
    });
  };

  const weekDates = getWeekDates(selectedDate);

  // 時間格：00:00 ~ 23:30
  const timeSlots = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = i % 2 === 0 ? '00' : '30';
    return `${hour.toString().padStart(2, '0')}:${minute}`;
  });

  const toMinutes = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* 日曆 */}
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <DatePicker
          selected={selectedDate}
          onChange={(date) => setSelectedDate(date)}
          dateFormat="yyyy/MM/dd"
        />
      </div>

      {/* 表格 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '80px repeat(7, 150px)',
          border: '1px solid #ccc',
          boxSizing: 'border-box',
          overflowX: 'auto',
          width: 'fit-content',
          margin: '0 auto',
        }}
      >
        {/* 星期標題列 */}
        <div></div>
        {weekDates.map((day, idx) => (
          <div
            key={idx}
            style={{
              textAlign: 'center',
              padding: '0.5rem',
              backgroundColor: '#f2f2f2',
              fontSize: '14px',
            }}
          >
            {day.toLocaleDateString('zh-TW', {
              month: 'numeric',
              day: 'numeric',
              weekday: 'short',
            })}
          </div>
        ))}

        {/* 每半小時一列 */}
        {timeSlots.map((time) => (
          <React.Fragment key={time}>
            {/* 左側時間欄 */}
            <div
              style={{
                height: '30px',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRight: '1px solid #ccc',
                color: time.endsWith(':00') ? '#000' : 'transparent',
              }}
            >
              {time}
            </div>

            {/* 各日格子 */}
            {weekDates.map((_, idx) => {
              const slotStart = toMinutes(time);
              const planToRender = plans.find(
                (plan) => plan.day === idx && toMinutes(plan.start) === slotStart
              );

              let planHeight = 30;
              if (planToRender) {
                const duration = toMinutes(planToRender.end) - toMinutes(planToRender.start);
                planHeight = (duration / 30) * 30;
              }

              return (
                <div
                  key={`${time}-${idx}`}
                  style={{
                    borderTop: '1px solid #ccc',
                    borderLeft: idx === 0 ? '1px solid #ccc' : '',
                    height: '30px',
                    position: 'relative',
                    backgroundColor: idx % 2 === 0 ? '#fff' : '#f9f9f9',
                  }}
                >
                  {planToRender && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 2,
                        right: 2,
                        height: `${planHeight}px`,
                        backgroundColor: 'rgba(255, 147, 41, 0.85)',
                        color: '#000',
                        fontSize: '12px',
                        padding: '4px',
                        borderRadius: '4px',
                        boxSizing: 'border-box',
                        zIndex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        textAlign: 'center',
                      }}
                    >
                      <strong>{planToRender.subject}</strong>
                      <div style={{ fontSize: '11px' }}>
                        {planToRender.start} - {planToRender.end}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default PlanPage;
