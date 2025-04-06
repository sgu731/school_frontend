import React from 'react';

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
  const days = ['6', '7', '8', '9', '10', '11', '12'];

  // 產生半小時的時間區段：12:00 ~ 23:30，共 24 格
  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = 12 + Math.floor(i / 2);
    const minute = i % 2 === 0 ? '00' : '30';
    return `${hour}:${minute}`;
  });

  const toMinutes = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>

      {/* 日期 */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '1rem' }}>
        <button>{'<'}</button>
        <h3 style={{ margin: '0 1rem' }}>10 月 6 日 - 10 月 12 日</h3>
        <button>{'>'}</button>
      </div>

      {/* 表格 */}
      <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(7, 150px)', border: '1px solid #ccc' }}>
        {/* 星期 */}
        <div></div>
        {days.map((day, idx) => (
          <div key={idx} style={{ textAlign: 'center', padding: '0.5rem', backgroundColor: '#f2f2f2' }}>
            {day}
          </div>
        ))}

        {/* 時間與內容 */}
        {timeSlots.map((time, slotIdx) => (
          <React.Fragment key={time}>
            {/* 左側時間欄 */}
            <div
              style={{
                padding: '0.25rem',
                fontSize: '0.8rem',
                backgroundColor: '#fff',
                color: time.endsWith(':00') ? '#000' : 'transparent',
              }}
            >
              {time}
            </div>

            {/* 各日時間格 */}
            {days.map((_, idx) => {
              const slotStart = toMinutes(time);
              const slotEnd = slotStart + 30;

              const planInThisCell = plans.find((plan) => {
                const planStart = toMinutes(plan.start);
                const planEnd = toMinutes(plan.end);
                return plan.day === idx && planEnd > slotStart && planStart < slotEnd;
              });

              return (
                <div
                  key={`${time}-${idx}`}
                  style={{
                    borderTop: '1px solid #ccc',
                    borderLeft: idx === 0 ? '1px solid #ccc' : '',
                    height: '30px',
                    backgroundColor: idx % 2 === 0 ? '#fff' : '#f9f9f9',
                    position: 'relative',
                  }}
                >
                  {planInThisCell && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '100%',
                        backgroundColor: 'rgba(255, 147, 41, 0.7)',
                        color: '#000',
                        fontSize: '10px',
                        padding: '1px',
                        borderRadius: '4px',
                      }}
                    >
                      <strong>{planInThisCell.subject}</strong>
                      <div style={{ fontSize: '9px' }}>
                        {planInThisCell.start} - {planInThisCell.end}
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
