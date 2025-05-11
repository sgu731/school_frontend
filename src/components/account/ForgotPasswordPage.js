import React, { useState } from 'react';
import './ResetPassword.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email) {
      setMessage('請輸入 Email');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      console.log('伺服器回傳：', data); // Debug 用
      setMessage(data.message || '請稍後再試一次');
    } catch (error) {
      console.error('發送失敗:', error);
      setMessage('發送失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', textAlign: 'center' }}>
      <h2>忘記密碼</h2>
      <input
        type="email"
        placeholder="請輸入註冊用的 Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{
          width: '100%',
          padding: '10px',
          marginBottom: '10px',
          borderRadius: '6px',
          border: '1px solid #ccc'
        }}
      />
      <br />
      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? '發送中...' : '送出重設連結'}
      </button>
      {message && (
        <p style={{ marginTop: '20px', color: '#333' }}>{message}</p>
      )}
    </div>
  );
}
