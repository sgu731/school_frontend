import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { IconUser, IconLock } from '@tabler/icons-react';
import './LoginPage.css';
import { useTranslation } from 'react-i18next'; // 導入 useTranslation

function LoginPage({ setIsLoggedIn, setUser }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation('login'); // 指定 login 命名空間

  const handleLogin = async () => {
    const response = await fetch(`${process.env.REACT_APP_API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem('token', data.token);

      if (rememberMe) {
        localStorage.setItem('rememberUsername', username);
        localStorage.setItem('rememberPassword', password);
      } else {
        localStorage.removeItem('rememberUsername');
        localStorage.removeItem('rememberPassword');
      }

      setIsLoggedIn(true);
      setUser({ username: username, name: data.name, avatar: data.avatar });
      setMessage(t('loginSuccess')); // 使用翻譯
      navigate('/notebook');
    } else {
      setMessage(t('loginFailed') || data.message); // 使用翻譯
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="logo-login">
          {/* 這裡可以放置 logo 圖片或文字，例如 */}
          <img src="/logo.png" alt="Logo" className="logo-img" />
          {/* 或純文字 */}
          {<h3 style={{ color: '#1a202c', textAlign: 'center', marginBottom: -30 }}>{t('logoTitle')}</h3>}
          {<h4 style={{ color: '#1a202c', textAlign: 'center'}}>{t('logoSubtitle')}</h4>}
        </div>
        <h1></h1>

        <div className="form-group">
          <div className="input-wrapper">
            <IconUser className="input-icon" size={20} />
            <input
              type="text"
              placeholder={t('usernamePlaceholder')}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <div className="input-wrapper">
            <IconLock className="input-icon" size={20} />
            <input
              type="password"
              placeholder={t('passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(); }}
            />
          </div>
        </div>

        <div className="login-label">
          <label>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            {t('rememberMe')}
          </label>
        </div>

        <button className="login-btn" onClick={handleLogin}>{t('login')}</button>
        {message && <p className="message">{message}</p>}

        <div className="link-group">
          <p>
            {t('noAccount')}{' '}
            <Link to="/register" className="link">
              {t('register')}
            </Link>
          </p>
          <p>
            {t('forgotPassword')}{' '}
            <Link to="/forgot-password" className="link">
              {t('resetPassword')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;