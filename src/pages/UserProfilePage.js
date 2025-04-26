import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function UserProfilePage({ user, setUser, setIsLoggedIn }) {
    const [newName, setNewName] = useState('');
    const navigate = useNavigate();

    const handleUpdateName = async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch('http://localhost:5000/profile', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ name: newName }),
            });

            if (response.ok) {
                setUser(prev => ({ ...prev, name: newName }));
                alert('名字修改成功！');
            } else {
                alert('修改失敗');
            }
        } catch (error) {
            console.error('Error updating name:', error);
            alert('修改失敗');
        }
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('rememberUsername');
        localStorage.removeItem('rememberPassword');
        navigate('/login');
    };

    return (
        <div style={{ padding: '30px' }}>
            <h2>帳號管理</h2>
            <p>目前使用者：{user?.name}</p>

            <div style={{ margin: '20px 0' }}>
                <input
                    type="text"
                    placeholder="輸入新名字"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                />
                <button onClick={handleUpdateName}>修改名字</button>
            </div>

            <div style={{ margin: '20px 0' }}>
                <button onClick={() => alert('修改密碼（之後做）')}>修改密碼</button>
            </div>

            <div style={{ margin: '20px 0' }}>
                <button onClick={() => alert('刪除帳號（之後做）')}>刪除帳號</button>
            </div>

            <div style={{ margin: '20px 0' }}>
                <button onClick={handleLogout}>登出</button>
            </div>
        </div>
    );
}

export default UserProfilePage;
