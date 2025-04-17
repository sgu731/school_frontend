import React, { useEffect, useState } from 'react';

const PlanModal = ({ isOpen, onClose, onSubmit, onDelete, mode, planData, subjects, fetchPlans }) => {
  const [form, setForm] = useState({
    subjectId: '',
    startTime: '',
    endTime: '',
    note: '',
  });

  useEffect(() => {
    if (mode === 'edit' && planData) {
      setForm({
        subjectId: planData.subject_id,
        startTime: planData.start_time?.slice(0, 16),
        endTime: planData.end_time?.slice(0, 16),
        note: planData.note || '',
      });
    } else {
      setForm({ subjectId: '', startTime: '', endTime: '', note: '' });
    }
  }, [planData, mode]);

  const handleSubmit = async () => {
    await onSubmit(form);
    if (fetchPlans) await fetchPlans();
  };

  const handleDelete = async () => {
    await onDelete(planData.id);
    if (fetchPlans) await fetchPlans();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999
    }}>
      <div style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '8px', minWidth: '300px' }}>
        <h3>{mode === 'add' ? '新增計畫' : '編輯計畫'}</h3>

        <div style={{ marginBottom: '1rem' }}>
          <label>科目：</label>
          <select name="subjectId" value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}>
            <option value="">請選擇</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>開始時間：</label>
          <input type="datetime-local" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>結束時間：</label>
          <input type="datetime-local" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>備註：</label>
          <input type="text" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
          <button onClick={onClose}>取消</button>
          {mode === 'edit' && <button onClick={handleDelete} style={{ color: 'red' }}>刪除</button>}
          <button onClick={handleSubmit}>{mode === 'add' ? '新增' : '儲存'}</button>
        </div>
      </div>
    </div>
  );
};

export default PlanModal;
