import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import './RoomsPage.css';

function RoomsPage() {
    // 重要
    const token = localStorage.getItem('token');

    const [roomName, setRoomName] = useState('');
    const [allRooms, setAllRooms] = useState([]);
    const [currentRoom, setCurrentRoom] = useState(null);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchRooms = async () => {
            try {
                console.log('Fetching rooms with token:', token);
                
                // 獲取所有房間
                const allResponse = await axios.get('http://localhost:5000/api/rooms/all', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                // 獲取當前房間
                const currentResponse = await axios.get('http://localhost:5000/api/rooms/current', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                console.log('All rooms response:', allResponse.data);
                console.log('Current room response:', currentResponse.data);

                if (allResponse.data.success) {
                    setAllRooms(allResponse.data.rooms || []);
                } else {
                    setMessage('無法載入房間列表：' + (allResponse.data.error || '未知錯誤'));
                }

                if (currentResponse.data.success) {
                    setCurrentRoom(currentResponse.data.room || null);
                } else {
                    setMessage('無法載入當前房間：' + (currentResponse.data.error || '未知錯誤'));
                }
            } catch (err) {
                console.error('Fetch rooms error:', err);
                setMessage('無法載入房間：' + (err.response?.data?.error || err.message));
            }
        };
        if (token) {
            fetchRooms();
        }
    }, [token]);

    const handleCreateRoom = async () => {
        if (!roomName) {
            setMessage('請輸入房間名稱');
            return;
        }

        // 檢查是否已在房間或已創建其他房間
        try {
            // 獲取使用者創建的房間
            const createdResponse = await axios.get('http://localhost:3000/api/rooms/created', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!createdResponse.data.success) {
                setMessage('無法檢查創建的房間：' + (createdResponse.data.error || '未知錯誤'));
                return;
            }

            const createdRooms = createdResponse.data.rooms || [];
            let confirmMessage = '';

            if (currentRoom || createdRooms.length > 0) {
                if (currentRoom && createdRooms.length > 0) {
                    confirmMessage = `你目前在房間 "${currentRoom.name}" 且已創建房間 "${createdRooms[0].name}"。創建新房間將退出當前房間並覆蓋舊房間，是否繼續？`;
                } else if (currentRoom) {
                    confirmMessage = `你目前在房間 "${currentRoom.name}"。創建新房間將退出當前房間，是否繼續？`;
                } else {
                    confirmMessage = `你已創建房間 "${createdRooms[0].name}"。創建新房間將退出舊房間，是否繼續？`;
                }

                if (!window.confirm(confirmMessage)) {
                    setMessage('已取消創建房間');
                    return;
                }
            }
        } catch (err) {
            setMessage('檢查房間狀態失敗：' + (err.response?.data?.error || err.message));
            return;
        }

        try {
            const response = await axios.post(
                'http://localhost:5000/api/rooms',
                { name: roomName },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            if (response.data.success) {
                setAllRooms([...allRooms, response.data.room]);
                setCurrentRoom(response.data.room);
                setRoomName('');
                setMessage('房間創建成功');
            } else {
                setMessage('創建房間失敗：' + (response.data.error || '未知錯誤'));
            }
        } catch (err) {
            setMessage('創建房間失敗：' + (err.response?.data?.error || err.message));
        }
    };

    const handleJoinRoom = async (roomId) => {
        // 檢查 roomId 是否有效
        if (!roomId || isNaN(roomId) || roomId <= 0) {
            setMessage('請選擇有效的房間');
            return;
        }

        // 檢查是否已在當前房間
        if (currentRoom && currentRoom.id === roomId) {
            setMessage('你已在這個房間');
            return;
        }

        // 如果已在其他房間，顯示確認對話框
        if (currentRoom) {
            const confirmMessage = `你目前在房間 "${currentRoom.name}"。加入新房間將退出當前房間，是否繼續？`;
            if (!window.confirm(confirmMessage)) {
                setMessage('已取消加入新房間');
                return;
            }
        }

        try {
            const response = await axios.post(
                `http://localhost:5000/api/rooms/${roomId}/join`,
                {},
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            if (response.data.success) {
                // 獲取最新當前房間
                const currentResponse = await axios.get('http://localhost:5000/api/rooms/current', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (currentResponse.data.success) {
                    setCurrentRoom(currentResponse.data.room || null);
                } else {
                    setMessage('無法更新當前房間：' + (currentResponse.data.error || '未知錯誤'));
                    return;
                }
                setMessage('成功進入房間');
                navigate('/studyroom');
            } else {
                setMessage('進入房間失敗：' + (response.data.error || '未知錯誤'));
            }
        } catch (err) {
            setMessage('進入房間失敗：' + (err.response?.data?.error || err.message));
        }
    };

    const handleLeaveRoom = async () => {
        if (!currentRoom) {
            setMessage('你不在任何房間');
            return;
        }

        try {
            const response = await axios.delete(
                'http://localhost:5000/api/rooms/leave',
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            if (response.data.success) {
                setCurrentRoom(null);
                setMessage('成功退出房間');
            } else {
                setMessage('退出房間失敗：' + (response.data.error || '未知錯誤'));
            }
        } catch (err) {
            setMessage('退出房間失敗：' + (err.response?.data?.error || err.message));
        }
    };

    // 根據 status 值顯示狀態名稱
    const getStatusName = (status) => {
        switch (status) {
            case 0: return '離線';
            case 1: return '線上';
            case 2: return '私密';
            default: return '未知';
        }
    };

    const handleDeleteRoom = async (roomId, roomName) => {
        const confirmMessage = `確定要刪除房間 "${roomName}"？這將清空房內所有成員。`;
        if (!window.confirm(confirmMessage)) {
            setMessage('已取消刪除房間');
            return;
        }

        try {
            const response = await axios.delete(
                'http://localhost:5000/api/rooms/${roomId}',
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            if (response.data.success) {
                // 更新房間列表
                setAllRooms(allRooms.filter(room => room.id !== roomId));
                // 如果刪除的是當前房間，清空 currentRoom
                if (currentRoom && currentRoom.id === roomId) {
                    setCurrentRoom(null);
                }
                setMessage('房間刪除成功');
            } else {
                setMessage('刪除房間失敗：' + (response.data.error || '未知錯誤'));
            }
        } catch (err) {
            setMessage('刪除房間失敗：' + (err.response?.data?.error || err.message));
        }
    };    

    // 假設 token 已解碼且包含 userId（需後端支援）
    const userId = token ? JSON.parse(atob(token.split('.')[1])).userId : null;

    return (
        <div style={{ padding: "2rem" }}>
            <h2>自習室</h2>

            <div>
                <h3>創建自習室</h3>
                <input
                    type="text"
                    placeholder="輸入名稱"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                />
                <button onClick={handleCreateRoom}>創建自習室</button>
            </div>

            <div>
                <h3>自習室列表</h3>
                <div style={{ display: "grid", gap: "1rem" }}>
                    {allRooms.length > 0 ? (
                        allRooms.map((room) => (
                            <div
                                key={room.id}
                                className={`room-card ${currentRoom && currentRoom.id === room.id ? 'current-room' : ''}`}
                            >
                                <div className="room-info">
                                    <div className={`status-dot status-${room.status}`}></div>
                                    <span>{room.name} ({getStatusName(room.status)})</span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                    <span style={{ fontSize: "0.9rem", color: "#555" }}>房主: {room.creator_name}</span>
                                    <button
                                        className="enter-btn"
                                        onClick={() => handleJoinRoom(room.id)}
                                        disabled={currentRoom && currentRoom.id === room.id}
                                    >
                                        {currentRoom && currentRoom.id === room.id ? '已在房間' : '進入房間'}
                                    </button>
                                    {userId && room.creator_id === userId && (
                                        <button
                                            className="delete-btn"
                                            onClick={() => handleDeleteRoom(room.id, room.name)}
                                        >
                                            刪除房間
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>尚無自習室</p>
                    )}
                </div>
            </div>

            {currentRoom && (
                <div style={{ marginTop: "2rem" }}>
                    <h3>你目前的房間</h3>
                    <p>
                        你目前在: <strong>{currentRoom.name}</strong> (房主: {currentRoom.creator_name}, 狀態: {getStatusName(currentRoom.status)})
                    </p>
                    <button
                        className="leave-btn"
                        onClick={handleLeaveRoom}
                    >
                        退出房間
                    </button>
                </div>
            )}

            {message && <p style={{ color: message.includes('成功') || message.includes('取消') ? 'green' : 'red' }}>{message}</p>}
        </div>
    );
}

export default RoomsPage;