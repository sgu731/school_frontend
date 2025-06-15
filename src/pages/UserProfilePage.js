import React, { useState } from 'react';
import './UserProfilePage.css';
import { useNavigate } from 'react-router-dom';
import ChangePasswordModal from '../components/account/ChangePasswordForm';
import UploadAvatar from '../components/account/UploadAvatar';
import { useTranslation } from 'react-i18next'; // 導入 useTranslation
import i18n from '../i18n'; // 假設你創建了 i18n.js 配置文件

export default function UserProfile({ user, setUser, setIsLoggedIn }) {
  const [newName, setNewName] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation('userProfile'); // 指定 userProfile 命名空間

  // 語言切換函數
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const handleUpdateName = async () => {
    if (!newName.trim()) {
      alert(t('enterNewName'));
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert(t('notLoggedIn'));
      return;
    }

    const res = await fetch(`${process.env.REACT_APP_API_URL}/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: newName })
    });

    if (res.ok) {
      setUser(prev => ({ ...prev, name: newName }));
      alert(t('nameUpdateSuccess'));
      setNewName('');
    } else {
      alert(t('nameUpdateFailed'));
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="user-profile-container">
      <h2 className="user-title">{t('accountManagement')}</h2>

      {/* 大頭貼與上傳區域 */}
      <div className="avatar-section">
        <div className="user-avatar-container">
          <img
            src={user?.avatar ? `${process.env.REACT_APP_API_URL}${user.avatar}` : `${process.env.REACT_APP_API_URL}/uploads/default-avatar.jpg`}
            alt={t('userAvatarAlt')}
            className="user-avatar"
            onError={(e) => {
              e.target.onerror = null; // 防止循環錯誤
              e.target.src = `${process.env.REACT_APP_API_URL}/uploads/default-avatar.jpg`; // 預設圖片
            }}
          />
        </div>
        <UploadAvatar user={user} setUser={setUser} />
      </div>

      {/* 使用者資訊 */}
      <div className="user-info-card">
        <p className="user-name">{t('currentUser', { name: user?.name || t('unnamed') })}</p>
        <div className="input-group">
          <input
            type="text"
            placeholder={t('enterNewNamePlaceholder')}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="name-input"
          />
          <button onClick={handleUpdateName} className="primary-btn">
            {t('updateName')}
          </button>
        </div>
      </div>

      {/* 其他操作 */}
      <div className="action-card">
        <button onClick={() => setShowChangePassword(true)} className="primary-btn">
          {t('changePassword')}
        </button>
        {showChangePassword && <ChangePasswordModal onClose={() => setShowChangePassword(false)} />}

        {/* 語言選擇下拉選單 */}
        <div className="language-switcher" style={{ marginTop: '1rem' }}>
          <label htmlFor="language-select" style={{ marginRight: '0.5rem' }}>{t('languageLabel')}</label>
          <select
            id="language-select"
            value={i18n.language}
            onChange={(e) => changeLanguage(e.target.value)}
            className="language-select"
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="en">{t('languageEN')}</option>
            <option value="zh">{t('languageZH')}</option>
          </select>
        </div>

        {/* 登出 */}
        <button onClick={handleLogout} className="logout-btn">
          {t('logout')}
        </button>

        {/* 刪除帳號（待做，暫時隱藏） */}
        {/* <button className="secondary-btn" disabled>
          刪除帳號（待做）
        </button> */}
      </div>
    </div>
  );
}