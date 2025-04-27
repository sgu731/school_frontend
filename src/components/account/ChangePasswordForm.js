import React, { useState } from 'react';

export default function ChangePasswordModal({ onClose }) {
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');

  const handleSubmit = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:5000/profile/password', {
      method: 'PATCH',
      headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
      body: JSON.stringify({ oldPassword: oldPw, newPassword: newPw })
    });
    if (res.ok) { alert('修改成功'); onClose(); }
    else alert('修改失敗');
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>修改密碼</h3>
        <input type="password" placeholder="舊密碼" value={oldPw} onChange={e=>setOldPw(e.target.value)} />
        <input type="password" placeholder="新密碼" value={newPw} onChange={e=>setNewPw(e.target.value)} />
        <button onClick={handleSubmit}>送出</button>
        <button onClick={onClose}>取消</button>
      </div>
    </div>
  );
}
