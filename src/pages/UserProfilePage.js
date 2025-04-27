import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ChangePasswordModal from '../components/account/ChangePasswordForm';
import UploadAvatar from '../components/account/UploadAvatar'; 

export default function UserProfile({ user, setUser, setIsLoggedIn }) {
  const [newName, setNewName] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const navigate = useNavigate(); 

  const handleUpdateName = async () => {
    if (!newName.trim()) {
      alert('輸入新名字');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('未登入');
      return;
    }

    const res = await fetch('http://localhost:5000/profile', {
      method: 'PATCH',
      headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
      body: JSON.stringify({ name: newName })
    });

    if (res.ok) {
      setUser(prev => ({ ...prev, name: newName }));
      alert('名字修改成功！');
      setNewName('');
    } else {
      alert('名字修改失敗');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div style={{ padding: '32px', maxWidth: '600px' }}>
      <h2>帳號管理</h2>
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        {user?.avatar ? (
          <img
            src={`http://localhost:5000${user.avatar}`}
            alt=""
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid #ccc'
            }}
          />
        ) : (
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            backgroundColor: '#eee',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '40px',
            color: '#aaa',
            margin: '0 auto'
          }}>
            👤
          </div>
        )}
      </div>

      <UploadAvatar user={user} setUser={setUser} />

      <p>目前使用者：{user?.name}</p>

      {/* 修改名字 */}
      <div style={{ margin: '20px 0', display: 'flex', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="輸入新名字"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          style={{ padding: '5px', marginRight: '10px', flex: '1' }}
        />
        <button onClick={handleUpdateName} style={{ padding: '6px 12px' }}>
          修改名字
        </button>
      </div>

      {/* 修改密碼 */}
      <div style={{ margin: '20px 0' }}>
        <button
            onClick={() => setShowChangePassword(true)} style={{ padding: '8px 16px' }}>
        修改密碼
        </button>
      </div>
      {showChangePassword && (<ChangePasswordModal onClose={() => setShowChangePassword(false)} />)}

      {/* 刪除帳號 */}
      <div style={{ margin: '20px 0' }}>
        <button
          onClick={() => alert('刪除帳號（待做）')} style={{ padding: '8px 16px' }}>
          刪除帳號
        </button>
      </div>

      {/* 登出 */}
      <div style={{ marginTop: '40px' }}>
        <button
          onClick={handleLogout}
          style={{
            padding: '8px 16px',
            cursor: 'pointer',
          }}
        >
          登出
        </button>
      </div>
    </div>
  );
}
