import React, { useState } from 'react';

export default function ChangePasswordModal({ onClose }) {
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');

  const handleSubmit = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${process.env.REACT_APP_API_URL}/profile/password`, {
      method: 'PATCH',
      headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
      body: JSON.stringify({ oldPassword: oldPw, newPassword: newPw })
    });
    if (res.ok) { 
      alert('修改成功'); 
      onClose(); 
    } else {
      alert('修改失敗');
    }
  };

  return (
    <div className="member-modal">
      <div className="member-card">
        <h3>修改密碼</h3>
        <input
          type="password"
          placeholder="舊密碼"
          value={oldPw}
          onChange={e => setOldPw(e.target.value)}
          style={{ width: '100%', padding: '8px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
        />
        <input
          type="password"
          placeholder="新密碼"
          value={newPw}
          onChange={e => setNewPw(e.target.value)}
          style={{ width: '100%', padding: '8px', marginBottom: '20px', borderRadius: '8px', border: '1px solid #ccc' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button onClick={handleSubmit} className="primary-btn" style={{ flex: 1, marginRight: '10px' }}>送出</button>
          <button onClick={onClose} className="secondary-btn" style={{ flex: 1 }}>取消</button>
        </div>
      </div>
    </div>
  );
}
