import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconUser, IconLock, IconMail, IconArrowLeft } from '@tabler/icons-react';
import './RegisterPage.css';
import { useTranslation } from 'react-i18next'; // 導入 useTranslation

function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { t } = useTranslation('register'); // 指定 register 命名空間

  const handleRegister = async () => {
    if (!username || !password || !name || !email) {
      alert(t('fillAllFields')); // 使用翻譯
      return;
    }

    const response = await fetch(`${process.env.REACT_APP_API_URL}/login/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, name, email }),
    });

    const data = await response.json();
    if (response.ok) {
      alert(t('registerSuccess')); // 使用翻譯
      navigate('/login');
    } else {
      setMessage(data.message || t('registerFailed')); // 使用翻譯
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="back-arrow-container">
          <button className="back-arrow" onClick={() => navigate('/login')}>
            <IconArrowLeft size={24} />
          </button>
        </div>        
        <h1>{t('registerTitle')}</h1>

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
            />
          </div>
        </div>

        <div className="form-group">
          <div className="input-wrapper">
            <IconUser className="input-icon" size={20} />
            <input
              type="text"
              placeholder={t('namePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>        

        <div className="form-group">
          <div className="input-wrapper">
            <IconMail className="input-icon" size={20} />
            <input
              type="email"
              placeholder={t('emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <button className="register-btn" onClick={handleRegister}>{t('register')}</button>

        {message && <p className="message">{message}</p>}
      </div>
    </div>
  );
}

export default RegisterPage;