import React, { useState } from 'react';

export default function UpdateName({ setUser }) {
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdateName = async () => {
    if (!newName.trim()) {
      alert('名字不能是空的！');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('請先登入');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newName }),
      });

      if (response.ok) {
        setUser(prev => ({ ...prev, name: newName }));
        alert('名字修改成功！');
        setNewName('');
      } else {
        const errorData = await response.json();
        alert('修改失敗：' + (errorData.message || '未知錯誤'));
      }
    } catch (error) {
      console.error('更新名字錯誤:', error);
      alert('系統錯誤，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      <h3>修改名字</h3>
      <div className="input-group">
        <input
          type="text"
          placeholder="輸入新名字"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button onClick={handleUpdateName} disabled={loading} className="primary-btn">
          {loading ? '修改中...' : '送出'}
        </button>
      </div>
    </div>
  );
}
