import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <nav>
            <Link to="/">主頁</Link> | <Link to="/rooms">自習室</Link>
          </nav>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/rooms" element={<RoomsPage />} />
          </Routes>
        </header>
      </div>
    </Router>
  );  

  function HomePage() {
      const [username, setUsername] = useState('');
      const [password, setPassword] = useState('');
      const [rememberMe, setRememberMe] = useState(false);
      const [message, setMessage] = useState('');
      const [isLoggedIn, setIsLoggedIn] = useState(false);
      const [user, setUser] = useState(null);
    
      // 科目相關狀態
      const [subjectName, setSubjectName] = useState('');
      const [subjects, setSubjects] = useState([]);
      const [selectedSubjectId, setSelectedSubjectId] = useState('');
    
      // 讀書紀錄相關狀態
      const [isStudying, setIsStudying] = useState(false);
      const [startTime, setStartTime] = useState(null);
      const [duration, setDuration] = useState(0);
      const [studyRecords, setStudyRecords] = useState([]);
    
      // 計時器狀態
      const [currentTime, setCurrentTime] = useState(0);
    
      // 檢查 Local Storage 中的 JWT
      useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
          validateToken(token);
        }
      }, []);
    
      // 驗證 JWT
      const validateToken = async (token) => {
        try {
          const response = await fetch('http://localhost:5000/profile', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
    
          if (response.ok) {
            const data = await response.json();
            setIsLoggedIn(true);
            setUser(data.user);
            //setUser({ username, name: data.name });
            fetchSubjects(token); // 獲取科目列表
            fetchStudyRecords(token); // 獲取讀書紀錄        
          } else {
            localStorage.removeItem('token'); // 清除無效的 Token
          }
        } catch (error) {
          console.error('Error validating token:', error);
        }
      };
    
      // 處理登入
      const handleLogin = async () => {
        const response = await fetch('http://localhost:5000/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password, rememberMe }),
        });
    
        const data = await response.json();
        if (response.ok) {
          setMessage(data.message);
          setIsLoggedIn(true);
          setUser({ username, name: data.name });
    
          // 保存 JWT 到 Local Storage
          if (rememberMe) {
            localStorage.setItem('token', data.token);
          }
          fetchSubjects(data.token); // 獲取科目列表
          fetchStudyRecords(data.token); // 獲取讀書紀錄
        } else {
          setMessage(data.message);
        }
      };
    
      // 處理登出
      const handleLogout = () => {
        setIsLoggedIn(false);
        setUser(null);
        setMessage('登出成功');
    
        // 清除 Local Storage 中的 JWT
        localStorage.removeItem('token');
      };
    
      // 新增科目
      const addSubject = async () => {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/study/subjects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: subjectName }),
        });
        const data = await response.json();
        if (response.ok) {
          setSubjects([...subjects, { id: data.subjectId, name: subjectName }]);
          setSubjectName('');
          setMessage('Subject added successfully');
        } else {
          setMessage('Failed to add subject');
        }
      };
    
    const fetchSubjects = async (token) => {
      const response = await fetch('http://localhost:5000/api/study/subjects', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    
      if (response.ok) {
        const data = await response.json();
        setSubjects(data.subjects);
      }
    };
    
    // 獲取使用者的讀書紀錄
    const fetchStudyRecords = async (token) => {
      const response = await fetch('http://localhost:5000/api/study/study-records', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    
      if (response.ok) {
        const data = await response.json();
        setStudyRecords(data.studyRecords); // 直接使用從後端返回的紀錄
      }
    };
    
      // 開始讀書計時
      const startStudy = () => {
        if (!selectedSubjectId) {
          setMessage('Please select a subject');
          return;
        }
        setIsStudying(true);
        setStartTime(Date.now());
        setCurrentTime(0); // 重置計時器
      };
    
      // 停止讀書計時並保存紀錄
      const stopStudy = async () => {
        const endTime = Date.now();
        const durationInSeconds = Math.floor((endTime - startTime) / 1000); // 計算讀書時間（秒）
        setDuration(durationInSeconds);
        setIsStudying(false);
    
        // 保存紀錄到後端
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/study/study-records', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ subjectId: selectedSubjectId, duration: durationInSeconds }),
        });
    
        const data = await response.json();
        if (response.ok) {
          setStudyRecords([...studyRecords, { subjectId: selectedSubjectId, duration: durationInSeconds }]);
          setMessage('Study record saved successfully');
        } else {
          setMessage('Failed to save study record');
        }
      };
    
      // 計時器邏輯
      useEffect(() => {
        let interval;
        if (isStudying) {
          interval = setInterval(() => {
            setCurrentTime(Math.floor((Date.now() - startTime) / 1000));
          }, 1000);
        }
        return () => clearInterval(interval);
      }, [isStudying, startTime]);
    
      return (
        <div className="App">
          <header className="App-header">
            {!isLoggedIn ? (
              <>
                <h1>登入</h1>
                <div>
                  <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div>
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div>
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
                <p>{message}</p>
              </>
            ) : (
              <>
                <h1>Welcome, {user.name}!</h1>
                <div className="user-panel">
                  <h2>讀書紀錄器</h2>
                  <div>
                    <input
                      type="text"
                      placeholder="輸入課程名稱"
                      value={subjectName}
                      onChange={(e) => setSubjectName(e.target.value)}
                    />
                    <button onClick={addSubject}>新增科目</button>
                  </div>
                  <div>
                    <select
                      value={selectedSubjectId}
                      onChange={(e) => setSelectedSubjectId(e.target.value)}
                      disabled={isStudying}
                    >
                      <option value="">選科目</option>
                      {subjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    {!isStudying ? (
                      <button onClick={startStudy} disabled={!selectedSubjectId}>
                        開始讀書
                      </button>
                    ) : (
                      <button onClick={stopStudy}>Stop Studying</button>
                    )}
                  </div>
                  <div>
                    <h3>計時器</h3>
                    <p>{currentTime} 秒</p>
                  </div>
                  <div>
                    <h3>讀書紀錄</h3>
                    <ul>
                      {studyRecords.map((record, index) => (
                        <li key={index}>
                          {record.subject_name}: {record.duration} 秒
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button onClick={handleLogout}>登出</button>
                </div>
                <p>{message}</p>
              </>
            )}
          </header>
        </div>
      ); 
  }  
}

function RoomsPage() {
  const [roomName, setRoomName] = useState(''); // 用於創建房間的名稱
  const [allRooms, setAllRooms] = useState([]); // 全部的房間列表
  const [currentRoom, setCurrentRoom] = useState(null); // 使用者當前加入的房間
  const [message, setMessage] = useState(''); // 用於顯示消息

  // 獲取全部的房間列表
  const fetchAllRooms = async () => {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:5000/api/study/rooms/all', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      setAllRooms(data.rooms);
    }
  };

  // 獲取使用者當前加入的房間
  const fetchCurrentRoom = async () => {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:5000/api/study/rooms/current', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      setCurrentRoom(data.room);
    }
  };

  // 創建房間
  const createRoom = async () => {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:5000/api/study/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: roomName }),
    });

    const data = await response.json();
    if (response.ok) {
      setMessage('Room created successfully');
      setRoomName(''); // 清空輸入框
      fetchAllRooms(); // 刷新全部的房間列表
    } else {
      setMessage('Failed to create room');
    }
  };

  // 加入房間
  const joinRoom = async (roomId) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:5000/api/study/rooms/${roomId}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (response.ok) {
      setMessage('Joined room successfully');
      fetchCurrentRoom(); // 刷新使用者當前加入的房間
      fetchAllRooms(); // 刷新全部的房間列表
    } else {
      setMessage(data.message || 'Failed to join room');
    }
  };

  // 在組件加載時獲取全部的房間列表和使用者當前加入的房間
  useEffect(() => {
    fetchAllRooms();
    fetchCurrentRoom();
  }, []);

  return (
    <div>
      <h2>自習室</h2>
      <div>
        <h3>創建自習室</h3>
        <input
          type="text"
          placeholder="輸入名稱"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
        />
        <button onClick={createRoom}>創建自習室</button>
      </div>
      <div>
        <h3>自習室列表</h3>
        <ul>
          {allRooms.map((room) => (
            <li key={room.id}>
              {room.name} (房主: {room.creator_name})
              {!currentRoom && ( // 如果使用者沒有加入任何房間，顯示加入按鈕
                <button onClick={() => joinRoom(room.id)}>加入</button>
              )}
            </li>
          ))}
        </ul>
      </div>
      {currentRoom && (
        <div>
          <h3>你目前的房間</h3>
          <p>
            你目前在: <strong>{currentRoom.name}</strong> (房主: {currentRoom.creator_name})
          </p>
        </div>
      )}
      {message && <p>{message}</p>}
    </div>
  );
}

export default App;