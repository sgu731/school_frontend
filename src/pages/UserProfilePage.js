import React, { useState } from 'react';
import './UserProfilePage.css';
import { useNavigate } from 'react-router-dom';
import ChangePasswordModal from '../components/account/ChangePasswordForm';
import UploadAvatar from '../components/account/UploadAvatar';

export default function UserProfile({ user, setUser, setIsLoggedIn }) {
  const [newName, setNewName] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const navigate = useNavigate();

  const handleUpdateName = async () => {
    if (!newName.trim()) {
      alert('請輸入新名字');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('未登入');
      return;
    }

    const res = await fetch('http://localhost:5000/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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
    <div className="worker-profile-container">
      <h2 className="worker-title">帳號管理</h2>

      {/* 大頭貼 */}
      <div>
        {user?.avatar ? (
          <img
            src={`http://localhost:5000${user.avatar}`}
            alt="Avatar"
            className="worker-avatar"
          />
        ) : (
          <div className="worker-avatar-placeholder">👤</div>
        )}
      </div>

      {/* 上傳新頭像 */}
      <UploadAvatar user={user} setUser={setUser} />

      {/* 顯示名字 */}
      <p className="worker-name">目前使用者：{user?.name}</p>

      {/* 修改名字 */}
      <div className="input-group">
        <input
          type="text"
          placeholder="輸入新名字"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button onClick={handleUpdateName} className="primary-btn">
          修改名字
        </button>
      </div>

      {/* 修改密碼 */}
      <div className="section">
        <button onClick={() => setShowChangePassword(true)} className="primary-btn">
          修改密碼
        </button>
      </div>
      {showChangePassword && <ChangePasswordModal onClose={() => setShowChangePassword(false)} />}

      {/* 刪除帳號（待做） */}
      <div className="section">
        <button onClick={() => alert('刪除帳號（待做）')} className="secondary-btn">
          刪除帳號
        </button>
      </div>

      {/* 登出 */}
      <div className="section">
        <button onClick={handleLogout} className="logout-btn">
          登出
        </button>
      </div>
    </div>
  );
}
