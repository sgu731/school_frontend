import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

function LoginPage({ setIsLoggedIn, setUser }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();
    const [rememberMe, setRememberMe] = useState(false);

    const handleLogin = async () => {
        const response = await fetch('http://localhost:5000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
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
            setMessage('登入成功！');
            navigate('/notebook');
        } else {
            setMessage(data.message || '登入失敗');
        }
    };    

    return (
        <div className="login-page">
            <h1>登入</h1>
            <div className="form-group">
                <input
                    type="text"
                    placeholder="帳號"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                </div>     
            <div className="from-group">
                <input
                    type="password"
                    placeholder="密碼"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(); }}
                />
                </div>
                <div className="form-group">
                    <label>
                        <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                        />
                        Remember Me
                    </label>
                </div>
            <button onClick={handleLogin}>登入</button>
            {message && <p>{message}</p>}
            <div style={{ marginTop: '1rem' }}>
                <p>
                還沒有帳號？{' '}
                <Link to="/register" style={{ color: '#007bff', textDecoration: 'none' }}>
                    註冊
                </Link>
                </p>
            </div>
        </div>
    );
}

export default LoginPage;
