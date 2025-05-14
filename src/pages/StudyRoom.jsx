import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./RoomsPage.css";

export default function StudyRoom() {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");
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

    // 獲取房間資訊、成員和科目
    useEffect(() => {
        const fetchData = async () => {
            if (!token) {
                setError("請先登入");
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
                        creator_name: roomResponse.data.room.creator_name,
                        desc: roomResponse.data.room.desc || "一起努力學習吧！",
                    });
                } else {
                    setError("未加入任何房間");
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
                    setError("無法載入成員列表：" + (membersResponse.data.error || "未知錯誤"));
                }
                console.log(membersResponse.data.members);

                // 獲取科目列表
                const subjectsResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/study/subjects`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (subjectsResponse.data.success) {
                    setSubjects(subjectsResponse.data.subjects || []);
                } else {
                    setError("無法載入科目列表：" + (subjectsResponse.data.error || "未知錯誤"));
                }
            } catch (err) {
                console.error("Fetch data error:", err);
                setError("載入資料失敗：" + (err.response?.data?.error || err.message));
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
    }, [token, navigate]);

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
            setError("請先選擇科目！");
            return;
        }

        let currentSubject = selectedSubject;

        if (!isStudying) {
            setStartTime(Date.now());
            setIsStudying(true);
            // 更新狀態為學習中 (status: 1)
            try {
                await axios.post(
                    `${process.env.REACT_APP_API_URL}/api/rooms/current/status`,
                    { status: 1 },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            } catch (err) {
                console.error("Update status error:", err);
                setError("更新學習狀態失敗：" + (err.response?.data?.error || err.message));
            }
        } else {
            const endTime = Date.now();
            const durationInSeconds = Math.floor((endTime - startTime) / 1000);

            try {
                const subjectId = findSubjectId(currentSubject);
                if (!subjectId) {
                    setError("無效的科目，請重新選擇");
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
                    console.log("✅ 學習紀錄已成功上傳到後端");
                    setStudyTime(0);
                    setIsStudying(false);
                    // 更新狀態為休息中 (status: 0)
                    await axios.post(
                        `${process.env.REACT_APP_API_URL}/api/rooms/current/status`,
                        { status: 0 },
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                } else {
                    setError("上傳學習紀錄失敗：" + response.data.error);
                }
            } catch (error) {
                setError("上傳學習紀錄失敗：" + (error.response?.data?.error || error.message));
            }
        }
    };

    const handleAddSubject = async () => {
        if (!newSubject.trim()) {
            setError("請輸入科目名稱");
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
                setError("新增科目失敗：" + response.data.error);
            }
        } catch (err) {
            setError("新增科目失敗：" + (err.response?.data?.error || err.message));
        }
    };

    const handleBackToRooms = async () => {
        if (isStudying) {
            const confirmLeave = window.confirm("你正在學習中，離開將停止計時並記錄學習時間，是否繼續？");
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
            case 1: return "學習中";
            case 0: default: return "休息中";
        }
    };

    return (
        <div style={{ padding: "2rem" }}>
            {error && <p className="message" style={{ color: "#dc3545" }}>{error}</p>}

            <button className="back-btn" onClick={handleBackToRooms}>
                ← 回到自習室列表
            </button>

            {roomInfo && (
                <div className="studyroom-banner">
                    <h2>{roomInfo.name}</h2>
                    <p className="tagline">{roomInfo.desc}</p>
                    <p className="date">{today}</p>
                </div>
            )}

            <div style={{ borderTop: "1px solid #ccc", paddingTop: "1rem", marginBottom: "2rem" }}>
                <p>
                    目前狀態：{isStudying ? "🟢 學習中" : "🟡 未開始"}　目前科目：{selectedSubject || "（尚未選擇）"}
                </p>

                {!isStudying && (
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <select
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                            style={{ padding: "6px" }}
                        >
                            <option value="">選擇科目</option>
                            {subjects.map((subj) => (
                                <option key={subj.id} value={subj.name}>
                                    {subj.name}
                                </option>
                            ))}
                        </select>
                        <input
                            type="text"
                            placeholder="新增科目"
                            value={newSubject}
                            onChange={(e) => setNewSubject(e.target.value)}
                            style={{ padding: "6px", width: "150px" }}
                        />
                        <button
                            className="enter-btn"
                            onClick={handleAddSubject}
                            style={{ padding: "6px 12px" }}
                        >
                            新增
                        </button>
                    </div>
                )}

                <button className="enter-btn" onClick={toggleStudy} style={{ marginTop: "1rem" }}>
                    {isStudying ? "停止學習" : "開始學習"}
                </button>

                <p style={{ marginTop: "0.5rem" }}>已累積學習時間：{formatTime(studyTime)}</p>
            </div>

            <h3>正在學習中的成員 {activeCount} 名</h3>
            <div style={{ display: "grid", gap: "1rem" }}>
                {members.map((member) => (
                    <div
                        key={member.id}
                        className="room-card"
                        onClick={() => setSelectedMember(member)}
                        style={{ cursor: "pointer" }}
                    >
                        <div className="room-info">
                            <div className={`status-dot ${member.status === 1 ? "status-online" : "status-offline"}`} />
                            <strong>{member.name}</strong>
                        </div>
                        <span style={{ fontSize: "0.9rem", color: "#666" }}>{member.studyTime}</span>
                    </div>
                ))}
            </div>

            {selectedMember && (
                <div className="member-modal">
                    <div className="member-card">
                        <button className="close-btn" onClick={() => setSelectedMember(null)}>
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
                        <h3>{selectedMember.name}</h3>
                        <p>開始：{selectedMember.startTime || "未知"}</p>
                        <p>狀態：{getStatusText(selectedMember.status)}</p>
                        {/*
                        <textarea
                            placeholder="傳送訊息給他..."
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                        />
                        <button
                            className="send-btn"
                            onClick={() => {
                                alert(`你留言給 ${selectedMember.name}：${messageText}`);
                                setMessageText("");
                            }}
                        >
                            傳送
                        </button>
                        */}
                    </div>
                </div>
            )}
        </div>
    );
}