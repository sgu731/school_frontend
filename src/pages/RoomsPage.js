import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import './RoomsPage.css';
import { useTranslation } from 'react-i18next'; // 導入 useTranslation

function RoomsPage() {
    const token = localStorage.getItem('token');
    const navigate = useNavigate();
    const { t } = useTranslation('rooms'); // 指定 rooms 命名空間

    const [roomName, setRoomName] = useState('');
    const [maxMembers, setMaxMembers] = useState(1);
    const [password, setPassword] = useState('');
    const [desc, setDesc] = useState(''); // 新增房間描述
    const [joinRoomId, setJoinRoomId] = useState('');
    //const [joinPassword, setJoinPassword] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [allRooms, setAllRooms] = useState([]);
    const [currentRoom, setCurrentRoom] = useState(null);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false); // 新增：控制 modal 顯示

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
                setMessage(t('loadRoomListFailed', { error: allResponse.data.error || t('unknownError') }));
            }

            if (currentResponse.data.success) {
                setCurrentRoom(currentResponse.data.room || null);
            } else {
                setMessage(t('loadCurrentRoomFailed', { error: currentResponse.data.error || t('unknownError') }));
            }
            console.log("頁面刷新");
            return allResponse.data.rooms || [];
        } catch (err) {
            console.error('Fetch rooms error:', err);
            setMessage(t('loadRoomsFailed', { error: err.response?.data?.error || err.message }));
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
            setMessage(t('enterRoomName'));
            return;
        }

        if (maxMembers < 1 || maxMembers > 50) {
            setMessage(t('memberLimitInvalid'));
            return;
        }

        setLoading(true);

        try {
            const createdResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/rooms/created`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!createdResponse.data.success) {
                setMessage(t('checkCreatedRoomFailed', { error: createdResponse.data.error || t('unknownError') }));
                return;
            }

            const createdRooms = createdResponse.data.rooms || [];
            let confirmMessage = '';

            if (currentRoom || createdRooms.length > 0) {
                if (currentRoom && createdRooms.length > 0) {
                    confirmMessage = t('confirmCreateWithCurrentAndCreated', { current: currentRoom.name, created: createdRooms[0].name });
                } else if (currentRoom) {
                    confirmMessage = t('confirmCreateWithCurrent', { current: currentRoom.name });
                } else {
                    confirmMessage = t('confirmCreateWithCreated', { created: createdRooms[0].name });
                }

                if (!window.confirm(confirmMessage)) {
                    setMessage(t('createCanceled'));
                    return;
                }

                // 退出當前房間
                if (currentRoom) {
                    await handleLeaveRoom();
                }                
            }

            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/api/rooms`,
                { name: roomName, max_members: parseInt(maxMembers), password: password || undefined, desc: desc || undefined },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            if (response.data.success) {
                setAllRooms([response.data.room, ...allRooms]);
                setCurrentRoom(response.data.room);
                setRoomName('');
                setMaxMembers(10);
                setPassword('');
                setDesc(''); // 清空描述
                setMessage(t('roomCreated'));
                // 創建後導航到 /studyroom
                navigate('/studyroom');                
            } else {
                setMessage(t('createRoomFailed', { error: response.data.error || t('unknownError') }));
            }
        } catch (err) {
            setMessage(t('createRoomFailed', { error: err.response?.data?.error || err.message }));
        } finally {
            setLoading(false);
        }
    };

    const handleJoinRoom = async (roomId, providedPassword = null) => {
        if (!roomId || isNaN(roomId) || roomId <= 0) {
            //console.log(joinRoomId);
            setMessage(t('selectValidRoom'));
            return;
        }

        if (currentRoom && currentRoom.id === roomId) {
            //setMessage('你已在這個房間');
            navigate('/studyroom');
            return;
        }

        if (currentRoom) {
            const confirmMessage = t('confirmJoinWithCurrent', { current: currentRoom.name });
            if (!window.confirm(confirmMessage)) {
                setMessage(t('joinCanceled'));
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
                    setMessage(t('joinSuccess'));
                    navigate('/studyroom');
                } else {
                    setMessage(t('updateCurrentRoomFailed', { error: currentResponse.data.error || t('unknownError') }));
                }
            } else {
                setMessage(t('joinFailed', { error: response.data.error || t('unknownError') }));
            }
        } catch (err) {
            setMessage(t('joinFailed', { error: err.response?.data?.error || err.message }));
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
                password = window.prompt(t('enterPasswordPrompt'));
                if (password === null) {
                    setMessage(t('joinCanceled'));
                    window.history.replaceState({}, document.title, '/rooms');
                    return;
                }
            }

            if (currentRoom && room && currentRoom.id === room.id) {
                setMessage(t('rejoinRoom'));
                navigate('/studyroom');
                window.history.replaceState({}, document.title, '/rooms');
                return;
            }

            if (currentRoom) {
                const confirmMessage = t('confirmJoinWithCurrent', { current: currentRoom.name });
                if (!window.confirm(confirmMessage)) {
                    setMessage(t('joinCanceled'));
                    return;
                }
                // 退出當前房間
                const leaveResult = await handleLeaveRoom();
                if (!leaveResult) {
                    setMessage(t('leaveFailed'));
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
                    setMessage(t('joinByInviteSuccess'));
                    navigate('/studyroom');
                } else {
                    setMessage(t('updateCurrentRoomFailed', { error: currentResponse.data.error || t('unknownError') }));
                }
            } else {
                setMessage(t('joinByInviteFailed', { error: response.data.error || t('unknownError') }));
            }
        } catch (err) {
            setMessage(t('joinByInviteFailed', { error: err.response?.data?.error || err.message }));
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async (roomId = null, hasPassword = false) => {
        if (!roomId && !joinRoomId && !inviteCode) {
            setMessage(t('enterRoomIdOrCode'));
            return;
        }
    
        if (roomId && currentRoom && currentRoom.id === roomId) {
            setMessage(t('rejoinRoom'));
            navigate('/studyroom');
            return;
        }
    
        if (currentRoom) {
            const confirmMessage = t('confirmJoinWithCurrent', { current: currentRoom.name });
            if (!window.confirm(confirmMessage)) {
                setMessage(t('joinCanceled'));
                return;
            }
            const leaveResult = await handleLeaveRoom();
            if (!leaveResult) {
                setMessage(t('leaveFailed'));
                return;
            }
        }
    
        setLoading(true);
    
        try {
            if (roomId) {
                let password = undefined;
                if (hasPassword) {
                    password = window.prompt(t('enterPasswordPrompt'));
                    if (password === null) {
                        setMessage(t('joinCanceled'));
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
            setMessage(t('joinFailed', { error: err.response?.data?.error || err.message }));
        } finally {
            setLoading(false);
        }
    };

    const handleLeaveRoom = async () => {
        if (!currentRoom) {
            setMessage(t('notInRoom'));
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
                setMessage(t('leaveSuccess'));
                await fetchRooms();
                return true;
            } else {
                setMessage(t('leaveFailed', { error: response.data.error || t('unknownError') }));
                return false;
            }
        } catch (err) {
            console.error('Leave room error:', err);
            setMessage(t('leaveFailed', { error: err.response?.data?.error || err.message }));
            return false;
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteRoom = async (roomId, roomName) => {
        const confirmMessage = t('confirmDelete', { name: roomName });
        if (!window.confirm(confirmMessage)) {
            setMessage(t('deleteCanceled'));
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
                setMessage(t('deleteSuccess'));
                // 重新獲取房間列表
                await fetchRooms();                
            } else {
                setMessage(t('deleteFailed', { error: response.data.error || t('unknownError') }));
            }
        } catch (err) {
            setMessage(t('deleteFailed', { error: err.response?.data?.error || err.message }));
        } finally {
            setLoading(false);
        }
    };

    const copyInviteLink = (inviteCode) => {
        const inviteLink = `${window.location.origin}/rooms?code=${inviteCode}`;
        navigator.clipboard.writeText(inviteLink)
            .then(() => {
                setMessage(t('copySuccess'));
            })
            .catch(err => {
                console.error('Copy invite link error:', err);
                setMessage(t('copyFailed', { error: err.message }));
            });
    };

    const getStatusName = (status) => {
        switch (status) {
            case 0: return t('statusOffline');
            case 1: return t('statusOnline');
            case 2: return t('statusPrivate');
            default: return t('statusUnknown');
        }
    };

    const userId = token ? JSON.parse(atob(token.split('.')[1])).userId : null;

    const openModal = () => {
        setIsModalOpen(true);
        // 重置輸入欄位
        setRoomName('');
        setMaxMembers(1);
        setPassword('');
        setDesc('');
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    return (
        <div className="rooms-page">
            <div style={{ padding: "2rem" }}>
                <h2>{t('studyRooms')}</h2>

                <div>
                    <h3>{t('createRoom')}</h3>
                    <button className="create-room-btn" onClick={openModal} disabled={loading}>
                        {loading ? t('creating') : t('createStudyRoom')}
                    </button>

                    {isModalOpen && (
                        <div className="modal-overlay">
                            <div className="modal-content">
                                <h3>{t('createNewRoom')}</h3>
                                <div className="modal-input">
                                    <label>{t('roomNameLabel')}</label>
                                    <input
                                        type="text"
                                        placeholder={t('enterNamePlaceholder')}
                                        value={roomName}
                                        onChange={(e) => setRoomName(e.target.value)}
                                    />
                                </div>
                                <div className="modal-input">
                                    <label>{t('memberLimitLabel')}</label>
                                    <input
                                        type="number"
                                        placeholder={t('memberLimitPlaceholder')}
                                        value={maxMembers}
                                        onChange={(e) => setMaxMembers(e.target.value)}
                                        min="1"
                                        max="50"
                                    />
                                </div>
                                <div className="modal-input">
                                    <label>{t('passwordLabel')}</label>
                                    <input
                                        type="password"
                                        placeholder={t('enterPasswordPlaceholder')}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                                <div className="modal-input">
                                    <label>{t('descriptionLabel')}</label>
                                    <input
                                        type="text"
                                        placeholder={t('enterDescriptionPlaceholder')}
                                        value={desc}
                                        onChange={(e) => setDesc(e.target.value)}
                                    />
                                </div>
                                <div className="modal-buttons">
                                    <button onClick={handleCreateRoom} disabled={loading}>
                                        {loading ? t('creating') : t('confirm')}
                                    </button>
                                    <button onClick={closeModal} disabled={loading}>
                                        {t('cancel')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div>
                    <h3>{t('joinRoom')}</h3>
                    <input
                        type="text"
                        placeholder={t('enterRoomIdPlaceholder')}
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
                        placeholder={t('enterInviteCodePlaceholder')}
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
                                setMessage(t('enterRoomIdOrCode'));
                            }
                        }}
                        disabled={loading}
                    >
                        {loading ? t('joining') : t('joinRoomButton')}
                    </button>
                </div>

                <div>
                    <h3>{t('roomList')}</h3>
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
                                            {t('roomId')}: {room.id} - {room.name} ({getStatusName(room.status)}, {t('members')}: {room.current_members}/{room.max_members}
                                            {room.has_password ? ` ${t('hasPassword')}` : ''})
                                        </span>
                                        {room.desc && (
                                            <p className="room-desc" style={{ fontSize: '0.9rem', color: '#555', marginTop: '0.5rem' }}>
                                                {room.desc}
                                            </p>
                                        )}
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                        <span style={{ fontSize: "0.9rem", color: "#555" }}>
                                            {t('creator')}: {room.creator_name}
                                        </span>
                                        <button
                                            className="copy-btn"
                                            onClick={() => copyInviteLink(room.invite_code)}
                                        >
                                            {t('copyInviteLink')}
                                        </button>
                                        <button
                                            className="enter-btn"
                                            onClick={() => handleJoin(room.id, room.has_password)}
                                            disabled={loading}
                                        >
                                            {currentRoom && currentRoom.id === room.id ? t('rejoin') : t('joinRoomButton')}
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
                            <p>{t('noRooms')}</p>
                        )}
                    </div>
                </div>

                {currentRoom && (
                    <div style={{ marginTop: "2rem" }}>
                        <h3>{t('currentRoom')}</h3>
                        <p>
                            {t('youAreIn')}: <strong>{currentRoom.name}</strong> 
                            ({t('creator')}: {currentRoom.creator_name}, {t('status')}: {getStatusName(currentRoom.status)}, 
                            {t('members')}: {currentRoom.current_members}/{currentRoom.max_members}, {currentRoom.has_password ? t('hasPassword') : t('noPassword')})
                            <button
                                className="copy-btn"
                                onClick={() => copyInviteLink(currentRoom.invite_code)}
                                style={{ marginLeft: "1rem" }}
                            >
                                {t('copyInviteLink')}
                            </button>
                        </p>
                        <button
                            className="leave-btn"
                            onClick={handleLeaveRoom}
                            disabled={loading}
                        >
                            {loading ? t('leaving') : t('leaveRoom')}
                        </button>
                    </div>
                )}

                {message && (
                    <p className="message" style={{ color: message.includes(t('roomCreated')) || message.includes(t('createCanceled')) || message.includes(t('copySuccess')) || message.includes(t('joinSuccess')) || message.includes(t('leaveSuccess')) || message.includes(t('deleteSuccess')) || message.includes(t('joinByInviteSuccess')) ? 'green' : 'red' }}>
                        {message}
                    </p>
                )}
            </div>
        </div>
    );
}

export default RoomsPage;