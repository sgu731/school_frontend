import React, { useState, useEffect } from 'react';

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

export default RoomsPage;