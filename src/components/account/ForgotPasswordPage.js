import React, { useState } from 'react';
import { IconMail, IconArrowLeft } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import './ResetPassword.css';
import { useTranslation } from 'react-i18next'; // 導入 useTranslation

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation('forgotPassword'); // 指定 forgotPassword 命名空間

  const handleSubmit = async () => {
    if (!email) {
      setMessage(t('enterEmail')); // 使用翻譯
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      console.log('伺服器回傳：', data); // Debug 用
      setMessage(data.message || t('tryAgainLater')); // 使用翻譯
    } catch (error) {
      console.error('發送失敗:', error);
      setMessage(t('sendFailed')); // 使用翻譯
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-container">
        <div className="back-arrow-container">
          <button className="back-arrow" onClick={() => navigate('/login')}>
            <IconArrowLeft size={24} />
          </button>
        </div>        
        <h1>{t('forgotPasswordTitle')}</h1>
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
        <button
          className="reset-btn"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? t('sending') : t('sendResetLink')}
        </button>
        {message && <p className="message">{message}</p>}
      </div>
    </div>
  );
}