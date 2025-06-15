import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next'; // 導入 useTranslation

const PlanModal = ({ isOpen, onClose, onSubmit, onDelete, mode, planData, subjects, fetchPlans }) => {
  const [form, setForm] = useState({
    subjectId: '',
    startTime: '',
    endTime: '',
    note: '',
  });
  const { t } = useTranslation('plan_modal'); // 指定 plan_modal 命名空間

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
        <h3>{mode === 'add' ? t('addPlan') : t('editPlan')}</h3>

        <div style={{ marginBottom: '1rem' }}>
          <label>{t('subjectLabel')}：</label>
          <select name="subjectId" value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}>
            <option value="">{t('selectSubject')}</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>{t('startTimeLabel')}：</label>
          <input type="datetime-local" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>{t('endTimeLabel')}：</label>
          <input type="datetime-local" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>{t('noteLabel')}：</label>
          <input type="text" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
          <button onClick={onClose}>{t('cancel')}</button>
          {mode === 'edit' && <button onClick={handleDelete} style={{ color: 'red' }}>{t('delete')}</button>}
          <button onClick={handleSubmit}>{mode === 'add' ? t('add') : t('save')}</button>
        </div>
      </div>
    </div>
  );
};

export default PlanModal;