import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import './RoomsPage.css';

function RoomsPage() {
    const token = localStorage.getItem('token');
    const navigate = useNavigate();

    const [roomName, setRoomName] = useState('');
    const [maxMembers, setMaxMembers] = useState(1);
    const [password, setPassword] = useState('');
    const [joinRoomId, setJoinRoomId] = useState('');
    //const [joinPassword, setJoinPassword] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [allRooms, setAllRooms] = useState([]);
    const [currentRoom, setCurrentRoom] = useState(null);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    // 移到外面隨時更新
    const fetchRooms = async () => {
        try {
            //console.log('Fetching rooms with token:', token);
            
            const allResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/rooms/all`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const currentResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/rooms/current`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            //console.log('All rooms response:', allResponse.data);
            //console.log('Current room response:', currentResponse.data);

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
            console.log("頁面刷新");
            return allResponse.data.rooms || [];
        } catch (err) {
            console.error('Fetch rooms error:', err);
            setMessage('無法載入房間：' + (err.response?.data?.error || err.message));
            return [];
        }
    };

    useEffect(() => {
        const handleInviteCode = async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            if (code && token) {
                setInviteCode(code);
                // 立即清除 URL 的 code 參數
                window.history.replaceState({}, document.title, '/rooms');
                await handleJoinByInvite(code);
            }
        };

        if (token) {
            (async () => {
                await fetchRooms();
                handleInviteCode();
            })();
            const intervalId = setInterval(fetchRooms, 3000);
            return () => clearInterval(intervalId); // 清理間隔計時器
        }
    }, [token]); 

    const handleCreateRoom = async () => {
        if (!roomName) {
            setMessage('請輸入房間名稱');
            return;
        }

        if (maxMembers < 1 || maxMembers > 50) {
            setMessage('人數限制必須在 1 到 50 之間');
            return;
        }

        setLoading(true);

        try {
            const createdResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/rooms/created`, {
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

                // 退出當前房間
                if (currentRoom) {
                    await handleLeaveRoom();
                }                
            }

            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/api/rooms`,
                { name: roomName, max_members: parseInt(maxMembers), password: password || undefined },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            if (response.data.success) {
                setAllRooms([response.data.room, ...allRooms]);
                setCurrentRoom(response.data.room);
                setRoomName('');
                setMaxMembers(10);
                setPassword('');
                setMessage('房間創建成功');
                // 創建後導航到 /studyroom
                navigate('/studyroom');                
            } else {
                setMessage('創建房間失敗：' + (response.data.error || '未知錯誤'));
            }
        } catch (err) {
            setMessage('創建房間失敗：' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleJoinRoom = async (roomId, providedPassword = null) => {
        if (!roomId || isNaN(roomId) || roomId <= 0) {
            //console.log(joinRoomId);
            setMessage('請選擇有效的房間');
            return;
        }

        if (currentRoom && currentRoom.id === roomId) {
            //setMessage('你已在這個房間');
            navigate('/studyroom');
            return;
        }

        if (currentRoom) {
            const confirmMessage = `你目前在房間 "${currentRoom.name}"。加入新房間將退出當前房間，是否繼續？`;
            if (!window.confirm(confirmMessage)) {
                setMessage('已取消加入新房間');
                return;
            }
            // 退出當前房間
            // const leaveResult = await handleLeaveRoom();
            // if (!leaveResult) {
            //     setMessage('退出當前房間失敗，請重試');
            //     return;
            // }
        }

        setLoading(true);

        try {
            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/api/rooms/${roomId}/join`,
                { password: providedPassword || undefined, invite_code: inviteCode || undefined },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            if (response.data.success) {
                const currentResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/rooms/current`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (currentResponse.data.success) {
                    setCurrentRoom(currentResponse.data.room || null);
                    setJoinRoomId('');
                    //setJoinPassword('');
                    setInviteCode('');
                    setMessage('成功進入房間');
                    navigate('/studyroom');
                } else {
                    setMessage('無法更新當前房間：' + (currentResponse.data.error || '未知錯誤'));
                }
            } else {
                setMessage('進入房間失敗：' + (response.data.error || '未知錯誤'));
            }
        } catch (err) {
            setMessage('進入房間失敗：' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleJoinByInvite = async (code) => {
        setLoading(true);

        try {
            // 獲取房間列表，若 allRooms 為空則調用 fetchRooms
            let rooms = allRooms;
            if (!rooms || rooms.length === 0) {
                rooms = await fetchRooms();
            }
      
            let password = undefined;
            const room = rooms.find(r => r.invite_code === code);
            
            if (room && room.has_password) {
                password = window.prompt('請輸入房間密碼');
                if (password === null) {
                    setMessage('已取消加入房間');
                    window.history.replaceState({}, document.title, '/rooms');
                    return;
                }
            }

            if (currentRoom && room && currentRoom.id === room.id) {
                setMessage('重新進入房間');
                navigate('/studyroom');
                window.history.replaceState({}, document.title, '/rooms');
                return;
            }

            if (currentRoom) {
                const confirmMessage = `你目前在房間 "${currentRoom.name}"。加入新房間將退出當前房間，是否繼續？`;
                if (!window.confirm(confirmMessage)) {
                    setMessage('已取消加入新房間');
                    return;
                }
                // 退出當前房間
                const leaveResult = await handleLeaveRoom();
                if (!leaveResult) {
                    setMessage('退出當前房間失敗，請重試');
                    return;
                }                
            }

            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/api/rooms/join/invite`,
                { invite_code: code, password: password },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            if (response.data.success) {
                const currentResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/rooms/current`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (currentResponse.data.success) {
                    setCurrentRoom(currentResponse.data.room || null);
                    //setJoinPassword('');
                    setInviteCode('');
                    setMessage('成功透過邀請連結進入房間');
                    navigate('/studyroom');
                } else {
                    setMessage('無法更新當前房間：' + (currentResponse.data.error || '未知錯誤'));
                }
            } else {
                setMessage('透過邀請連結加入失敗：' + (response.data.error || '未知錯誤'));
            }
        } catch (err) {
            setMessage('透過邀請連結加入失敗：' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async (roomId = null, hasPassword = false) => {
        if (!roomId && !joinRoomId && !inviteCode) {
            setMessage('請輸入房間 ID 或邀請代碼');
            return;
        }
    
        if (roomId && currentRoom && currentRoom.id === roomId) {
            setMessage('重新進入房間');
            navigate('/studyroom');
            return;
        }
    
        if (currentRoom) {
            const confirmMessage = `你目前在房間 "${currentRoom.name}"。加入新房間將退出當前房間，是否繼續？`;
            if (!window.confirm(confirmMessage)) {
                setMessage('已取消加入新房間');
                return;
            }
            const leaveResult = await handleLeaveRoom();
            if (!leaveResult) {
                setMessage('退出當前房間失敗，請重試');
                return;
            }
        }
    
        setLoading(true);
    
        try {
            if (roomId) {
                let password = undefined;
                if (hasPassword) {
                    password = window.prompt('請輸入房間密碼');
                    if (password === null) {
                        setMessage('已取消加入房間');
                        return;
                    }
                }
                await handleJoinRoom(roomId, password);
            } else if (inviteCode) {
                await handleJoinByInvite(inviteCode);
            } else {
                await handleJoinRoom(joinRoomId);
            }
        } catch (err) {
            setMessage('加入房間失敗：' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleLeaveRoom = async () => {
        if (!currentRoom) {
            setMessage('你不在任何房間');
            return false;
        }

        setLoading(true);

        try {
            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/api/rooms/leave`,
                {},
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            if (response.data.success) {
                setCurrentRoom(null);
                setMessage('成功退出房間');
                await fetchRooms();
                return true;
            } else {
                setMessage('退出房間失敗：' + (response.data.error || '未知錯誤'));
                return false;
            }
        } catch (err) {
            console.error('Leave room error:', err);
            setMessage('退出房間失敗：' + (err.response?.data?.error || err.message));
            return false;
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteRoom = async (roomId, roomName) => {
        const confirmMessage = `確定要刪除房間 "${roomName}"？這將清空房內所有成員。`;
        if (!window.confirm(confirmMessage)) {
            setMessage('已取消刪除房間');
            return;
        }

        setLoading(true);

        try {
            const response = await axios.delete(
                `${process.env.REACT_APP_API_URL}/api/rooms/${roomId}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            if (response.data.success) {
                setAllRooms(allRooms.filter(room => room.id !== roomId));
                if (currentRoom && currentRoom.id === roomId) {
                    setCurrentRoom(null);
                }
                setMessage('房間刪除成功');
                // 重新獲取房間列表
                await fetchRooms();                
            } else {
                setMessage('刪除房間失敗：' + (response.data.error || '未知錯誤'));
            }
        } catch (err) {
            setMessage('刪除房間失敗：' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    const copyInviteLink = (inviteCode) => {
        const inviteLink = `${window.location.origin}/rooms?code=${inviteCode}`;
        navigator.clipboard.writeText(inviteLink)
            .then(() => {
                setMessage('邀請連結已複製到剪貼簿！');
            })
            .catch(err => {
                console.error('Copy invite link error:', err);
                setMessage('複製邀請連結失敗：' + err.message);
            });
    };

    const getStatusName = (status) => {
        switch (status) {
            case 0: return '離線';
            case 1: return '線上';
            case 2: return '私密';
            default: return '未知';
        }
    };

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
                <input
                    type="number"
                    placeholder="人數限制 (1-50)"
                    value={maxMembers}
                    onChange={(e) => setMaxMembers(e.target.value)}
                    min="1"
                    max="50"
                />
                <input
                    type="password"
                    placeholder="輸入密碼（可選）"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button onClick={handleCreateRoom} disabled={loading}>
                    {loading ? '創建中...' : '創建自習室'}
                </button>
            </div>

            <div>
                <h3>加入自習室</h3>
                <input
                    type="text"
                    placeholder="輸入房間 ID"
                    value={joinRoomId}
                    onChange={(e) => setJoinRoomId(e.target.value)}
                />
                {/*<input
                    type="password"
                    placeholder="輸入密碼（若需要）"
                    value={joinPassword}
                    onChange={(e) => setJoinPassword(e.target.value)}
                />*/}
                <input
                    type="text"
                    placeholder="輸入邀請代碼（若有）"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                />
                <button
                    className="enter-btn"
                    onClick={() => {
                        if (inviteCode) {
                            handleJoin(null, false); // 使用 inviteCode
                        } else if (joinRoomId) {
                            const room = allRooms.find(r => r.id === parseInt(joinRoomId));
                            handleJoin(parseInt(joinRoomId), room ? room.has_password : false);
                        } else {
                            setMessage('請輸入房間 ID 或邀請代碼');
                        }
                    }}
                    disabled={loading}
                >
                    {loading ? '加入中...' : '加入房間'}
                </button>
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
                                    <span>
                                        ID: {room.id} - {room.name} ({getStatusName(room.status)}, 人數: {room.current_members}/{room.max_members}
                                        {room.has_password ? ' 有密碼' : ''})
                                    </span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                    <span style={{ fontSize: "0.9rem", color: "#555" }}>
                                        房主: {room.creator_name}
                                    </span>
                                    <button
                                        className="copy-btn"
                                        onClick={() => copyInviteLink(room.invite_code)}
                                    >
                                        複製邀請連結
                                    </button>
                                    <button
                                        className="enter-btn"
                                        onClick={() => handleJoin(room.id, room.has_password)}
                                        disabled={loading}
                                    >
                                        {currentRoom && currentRoom.id === room.id ? '重新進入' : '進入房間'}
                                    </button>
                                    {/* 暫時隱藏刪除房間按鈕
                                    {userId && room.creator_id === userId && (
                                        <button
                                            className="delete-btn"
                                            onClick={() => handleDeleteRoom(room.id, room.name)}
                                            disabled={loading}
                                        >
                                            刪除房間
                                        </button>
                                    )}
                                    */}
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
                        你目前在: <strong>{currentRoom.name}</strong> 
                        (房主: {currentRoom.creator_name}, 狀態: {getStatusName(currentRoom.status)}, 
                        人數: {currentRoom.current_members}/{currentRoom.max_members}, {currentRoom.has_password ? '有密碼' : '無密碼'})
                        <button
                            className="copy-btn"
                            onClick={() => copyInviteLink(currentRoom.invite_code)}
                            style={{ marginLeft: "1rem" }}
                        >
                            複製邀請連結
                        </button>
                    </p>
                    <button
                        className="leave-btn"
                        onClick={handleLeaveRoom}
                        disabled={loading}
                    >
                        {loading ? '退出中...' : '退出房間'}
                    </button>
                </div>
            )}

            {message && (
                <p className="message" style={{ color: message.includes('成功') || message.includes('取消') || message.includes('複製') ? 'green' : 'red' }}>
                    {message}
                </p>
            )}
        </div>
    );
}

export default RoomsPage;