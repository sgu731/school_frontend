import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import './ResetPassword.css';

export default function ResetPasswordPage() {
  const { token } = useParams(); // 從網址取得 token
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    
    if (!password) {
      setMessage('請輸入新密碼');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('http://localhost:5000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message || '密碼重設成功，將導回登入頁');
        setTimeout(() => {
          navigate('/login');
        }, 2000); 
      } else {
        setMessage(data.message || '密碼重設失敗');
      }
    } catch (err) {
      console.error('送出錯誤：', err);
      setMessage('連線錯誤，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto' }}>
      <h2>重設密碼</h2>
      <input
        type="password"
        placeholder="請輸入新密碼"
        value={password}
        onChange={e => setPassword(e.target.value)}
        style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
      />
      <button className="primary-btn"　onClick={handleSubmit} disabled={loading}>
        {loading ? '處理中...' : '送出'}
      </button>
      {message && <p style={{ marginTop: '10px' }}>{message}</p>}
    </div>
  );
}
