import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { IconEdit } from '@tabler/icons-react';
import "./StudyRoom.css";
import { useTranslation } from 'react-i18next'; // 導入 useTranslation

export default function StudyRoom() {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    const userId = token ? JSON.parse(atob(token.split('.')[1])).userId : null;
    const { t } = useTranslation('studyRoom'); // 指定 studyRoom 命名空間

    const [roomInfo, setRoomInfo] = useState(null);
    const [members, setMembers] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [isStudying, setIsStudying] = useState(false);
    const [studyTime, setStudyTime] = useState(0);
    const [selectedSubject, setSelectedSubject] = useState("");
    const [startTime, setStartTime] = useState(null);
    const [selectedMember, setSelectedMember] = useState(null);
    const [messageText, setMessageText] = useState("");
    const [error, setError] = useState("");
    const [newSubject, setNewSubject] = useState(""); // 新增科目輸入
    // 房主
    const [editRoom, setEditRoom] = useState(false); // 控制編輯模式
    const [newName, setNewName] = useState(""); // 新房間名稱
    const [newDesc, setNewDesc] = useState(""); // 新描述
    const [newPassword, setNewPassword] = useState(""); // 新密碼
    const [newIsPublic, setNewIsPublic] = useState(true); // 新房間狀態（公開/私有）

    // 關閉 member-card 的處理函數
    const handleCloseMemberCard = useCallback(() => {
        setSelectedMember(null);
        setMessageText("");
    }, []);

    // 點擊空白處關閉
    const handleModalClick = useCallback((e) => {
        if (e.target.classList.contains("member-modal")) {
            handleCloseMemberCard();
        }
    }, [handleCloseMemberCard]);

    // 獲取房間資訊、成員和科目
    useEffect(() => {
        const fetchData = async () => {
            if (!token) {
                setError(t('pleaseLogin'));
                navigate("/login");
                return;
            }

            try {
                // 獲取當前房間
                const roomResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/rooms/current`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (roomResponse.data.success && roomResponse.data.room) {
                    setRoomInfo({
                        id: roomResponse.data.room.id,
                        name: roomResponse.data.room.name,
                        creator_id: roomResponse.data.room.creator_id,
                        creator_name: roomResponse.data.room.creator_name,
                        desc: roomResponse.data.room.desc || t('defaultDesc'),
                        status: roomResponse.data.room.status || 1,
                    });
                    if (!editRoom) {
                        setNewName(roomResponse.data.room.name || ""); // 預設顯示原始名稱
                        setNewDesc(roomResponse.data.room.desc || t('defaultDesc')); // 預設顯示原始描述
                        setNewPassword(roomResponse.data.room.password || ""); // 初始化新密碼
                        setNewIsPublic(roomResponse.data.room.status === 1); // 將 status 轉為 isPublic
                    }                    
                } else {
                    setError(t('noRoomJoined'));
                    navigate("/rooms");
                    return;
                }

                // 獲取房間成員
                const membersResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/rooms/current/members`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (membersResponse.data.success) {
                    setMembers(membersResponse.data.members || []);
                } else {
                    setError(t('loadMembersFailed', { error: membersResponse.data.error || t('unknownError') }));
                }
                console.log(membersResponse.data.members);

                // 獲取科目列表
                const subjectsResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/study/subjects`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (subjectsResponse.data.success) {
                    setSubjects(subjectsResponse.data.subjects || []);
                } else {
                    setError(t('loadSubjectsFailed', { error: subjectsResponse.data.error || t('unknownError') }));
                }
            } catch (err) {
                console.error("Fetch data error:", err);
                setError(t('loadDataFailed', { error: err.response?.data?.error || err.message }));
                navigate("/rooms");
            }
        };
        if (token) {
            (async () => {
                await fetchData();
            })();
            const intervalId = setInterval(fetchData, 1000);
            return () => clearInterval(intervalId); // 清理間隔計時器
        }
    }, [token, navigate, editRoom]);

    // 學習計時器
    useEffect(() => {
        let timer;
        if (isStudying) {
            timer = setInterval(() => {
                setStudyTime((prev) => prev + 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [isStudying]);

    const toggleStudy = async () => {
        if (!isStudying && !selectedSubject) {
            setError(t('selectSubjectFirst'));
            return;
        }

        let currentSubject = selectedSubject;

        if (!isStudying) {
            setStartTime(Date.now());
            setIsStudying(true);
            // 更新狀態為學習中 (status: 1)，並傳遞 subjectId
            try {
                const subjectId = findSubjectId(currentSubject);
                if (!subjectId) {
                    setError(t('invalidSubject'));
                    return;
                }
                await axios.post(
                    `${process.env.REACT_APP_API_URL}/api/rooms/current/status`,
                    { status: 1, subjectId }, // 傳遞 subjectId
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            } catch (err) {
                console.error("Update status error:", err);
                setError(t('updateStatusFailed', { error: err.response?.data?.error || err.message }));
            }
        } else {
            const endTime = Date.now();
            const durationInSeconds = Math.floor((endTime - startTime) / 1000);

            try {
                const subjectId = findSubjectId(currentSubject);
                if (!subjectId) {
                    setError(t('invalidSubject'));
                    setIsStudying(false);
                    return;
                }

                const response = await axios.post(
                    `${process.env.REACT_APP_API_URL}/api/study/study-records`,
                    {
                        subjectId,
                        duration: durationInSeconds,
                    },
                    {
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (response.data.success) {
                    console.log(t('studyRecordUploaded'));
                    setStudyTime(0);
                    setIsStudying(false);
                    // 更新狀態為休息中 (status: 0)
                    await axios.post(
                        `${process.env.REACT_APP_API_URL}/api/rooms/current/status`,
                        { status: 0 },
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                } else {
                    setError(t('uploadRecordFailed', { error: response.data.error }));
                }
            } catch (error) {
                setError(t('uploadRecordFailed', { error: error.response?.data?.error || error.message }));
            }
        }
    };

    const handleAddSubject = async () => {
        if (!newSubject.trim()) {
            setError(t('enterSubjectName'));
            return;
        }

        try {
            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/api/study/subjects`,
                { name: newSubject.trim() },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.data.success) {
                const subjectsResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/study/subjects`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (subjectsResponse.data.success) {
                    setSubjects(subjectsResponse.data.subjects || []);
                    setNewSubject("");
                    setError("");
                }
            } else {
                setError(t('addSubjectFailed', { error: response.data.error }));
            }
        } catch (err) {
            setError(t('addSubjectFailed', { error: err.response?.data?.error || err.message }));
        }
    };

    const handleBackToRooms = async () => {
        if (isStudying) {
            const confirmLeave = window.confirm(t('confirmLeaveStudying'));
            if (!confirmLeave) {
                return;
            }

            // 停止學習並記錄
            await toggleStudy();
        }
        navigate("/rooms");
    };

    const formatTime = (seconds) => {
        const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
        const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
        const s = String(seconds % 60).padStart(2, "0");
        return `${h}:${m}:${s}`;
    };

    const today = new Date().toLocaleDateString("zh-TW", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const activeCount = members.filter((m) => m.status === 1).length;

    const findSubjectId = (subjectName) => {
        const subject = subjects.find((s) => s.name === subjectName);
        return subject ? subject.id : null;
    };

    const getStatusText = (status) => {
        switch (status) {
            case 1: return t('studying');
            case 0: default: return t('resting');
        }
    };

    // 處理房間資訊更新
    const handleUpdateRoom = async () => {
        if (!roomInfo || roomInfo.creator_id !== userId) {
            setError(t('onlyCreatorCanEdit'));
            return;
        }

        try {
            const response = await axios.put(
                `${process.env.REACT_APP_API_URL}/api/rooms/${roomInfo.id}`,
                {
                    name: newName,
                    desc: newDesc,
                    password: newPassword || undefined, // 僅傳送非空密碼
                    status: newIsPublic ? 1 : 0, // 轉換為 status
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data.success) {
                setRoomInfo({ ...roomInfo, name: newName, desc: newDesc, password: newPassword || roomInfo.password, status: newIsPublic ? 1 : 0 });
                setEditRoom(false);
                setError("");
            } else {
                setError(t('updateRoomFailed', { error: response.data.error }));
            }
        } catch (err) {
            setError(t('updateRoomFailed', { error: err.response?.data?.error || err.message }));
        }
    };

    // 踢出用戶
    const handleKickMember = async (memberId) => {
        if (!roomInfo || roomInfo.creator_id !== userId) {
            setError(t('onlyCreatorCanKick'));
            return;
        }

        if (window.confirm(t('confirmKick', { name: members.find(m => m.id === memberId)?.name }))) {
            try {
                const response = await axios.delete(
                    `${process.env.REACT_APP_API_URL}/api/rooms/${roomInfo.id}/members/${memberId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (response.data.success) {
                    setMembers(members.filter(m => m.id !== memberId));
                    setError("");
                } else {
                    setError(t('kickMemberFailed', { error: response.data.error }));
                }
            } catch (err) {
                setError(t('kickMemberFailed', { error: err.response?.data?.error || err.message }));
            }
        }
    };

    return (
        <div className="study-room">
            {error && <p className="error-message">{error}</p>}

            <button className="back-btn" onClick={handleBackToRooms}>
                ← {t('backToRooms')}
            </button>

            {roomInfo && (
                <div className="studyroom-banner">
                    <h2 className="banner-title">{roomInfo.name}</h2>
                    <p className="banner-desc">{roomInfo.desc}</p>
                    <p className="banner-date">{today}</p>
                    {roomInfo.creator_id === userId && (
                        <button className="edit-btn" onClick={() => setEditRoom(true)}>
                            <IconEdit size={20} style={{ marginRight: '0.5rem' }} />
                            {t('editRoomInfo')}
                        </button>
                    )}         
                </div>
            )}

            {editRoom && roomInfo && roomInfo.creator_id === userId && (
                <div className="edit-room-form">
                    <div className="form-group">
                        <label>{t('roomNameLabel')}：</label>
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('roomDescLabel')}：</label>
                        <input
                            type="text"
                            value={newDesc}
                            onChange={(e) => setNewDesc(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('passwordLabel')}：</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('roomStatusLabel')}：</label>
                        <select
                            value={newIsPublic}
                            onChange={(e) => setNewIsPublic(e.target.value === "true")}
                        >
                            <option value={true}>{t('public')}</option>
                            <option value={false}>{t('private')}</option>
                        </select>
                    </div>
                    <button className="save-btn" onClick={handleUpdateRoom}>{t('save')}</button>
                    <button className="cancel-btn" onClick={() => setEditRoom(false)}>{t('cancel')}</button>
                </div>
            )}

            <div className="study-section">
                <p className="study-status">
                    {t('currentStatus')}：
                    <span className={isStudying ? "status-studying" : "status-idle"}>
                        {isStudying ? t('studyingStatus') : t('notStartedStatus')}
                    </span>
                    {t('currentSubject')}: {selectedSubject || t('notSelected')}
                </p>

                {!isStudying && (
                    <div className="subject-controls">
                        <select
                            className="subject-select"
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                        >
                            <option value="">{t('selectSubject')}</option>
                            {subjects.map((subj) => (
                                <option key={subj.id} value={subj.name}>
                                    {subj.name}
                                </option>
                            ))}
                        </select>
                        <input
                            className="subject-input"
                            type="text"
                            placeholder={t('addSubjectPlaceholder')}
                            value={newSubject}
                            onChange={(e) => setNewSubject(e.target.value)}
                        />
                        <button className="enter-btn" onClick={handleAddSubject}>
                            {t('add')}
                        </button>
                    </div>
                )}

                <button className="study-btn" onClick={toggleStudy}>
                    {isStudying ? t('stopStudying') : t('startStudying')}
                </button>

                <p className="study-time">
                    {t('accumulatedStudyTime')}: <span className="time-highlight">{formatTime(studyTime)}</span>
                </p>
            </div>

            <h3 className="members-title">{t('studyingMembers', { count: activeCount })}</h3>
            <div className="members-grid">
                {members.map((member) => (
                    <div
                        key={member.id}
                        className="room-card"
                        onClick={() => setSelectedMember(member)}
                    >
                        <div className="room-info">
                            <div className={`status-dot ${member.status === 1 ? "status-online" : "status-offline"}`} />
                            <strong className="member-name">{member.name}</strong>
                        </div>
                        <span className="study-time">{member.studyTime}</span>
                        {roomInfo && roomInfo.creator_id === userId && member.id !== userId && (
                            <button className="kick-btn" onClick={(e) => { e.stopPropagation(); handleKickMember(member.id); }}>
                                ×
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {selectedMember && (
                <div className="member-modal" onClick={handleModalClick}>
                    <div className="member-card">
                        <button className="close-btn" onClick={handleCloseMemberCard}>
                            ×
                        </button>
                        <img
                            src={
                                selectedMember.avatar
                                    ? `${process.env.REACT_APP_API_URL}${selectedMember.avatar}`
                                    : `https://api.dicebear.com/7.x/thumbs/svg?seed=${selectedMember.name}`
                            }
                            alt="avatar"
                            className="member-avatar"
                        />
                        <h3 className="member-name">{selectedMember.name}</h3>
                        {/*<p className="member-info">{t('startTime')}: {selectedMember.startTime || t('unknown')}</p>*/}
                        <p className="member-info">{t('status')}: {getStatusText(selectedMember.status)}</p>
                    </div>
                </div>
            )}
        </div>
    );
}