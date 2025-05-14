import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleRegister = async () => {
    if (!username || !password || !name || !email) {
      alert('請填寫所有欄位');
      return;
    }

    const response = await fetch(`${process.env.REACT_APP_API_URL}/login/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, name, email }),
    });

    const data = await response.json();
    if (response.ok) {
      alert('註冊成功！請登入');
      navigate('/login');
    } else {
      setMessage(data.message || '註冊失敗');
    }
  };

  return (
    <form
      style={{ padding: '2rem', maxWidth: '400px', margin: '0 auto' }}
      onSubmit={(e) => {
        e.preventDefault();
        handleRegister();
      }}
    >
      <h2>註冊新帳號</h2>

      <div className="form-group">
        <input
          type="text"
          placeholder="名字"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="form-group">
        <input
          type="text"
          placeholder="帳號"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>

      <div className="form-group">
        <input
          type="password"
          placeholder="密碼"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <div className="form-group">
        <input
          type="email"
          placeholder="Email（用來重設密碼）"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <button className="enter-btn" type="submit">註冊</button>

      {message && <p style={{ color: 'red' }}>{message}</p>}
    </form>
  );
}

export default RegisterPage;