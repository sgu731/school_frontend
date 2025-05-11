import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./RoomsPage.css";

export default function StudyRoom() {
    const navigate = useNavigate();
    const [roomInfo, setRoomInfo] = useState({});
    const [members, setMembers] = useState([]);
    const [isStudying, setIsStudying] = useState(false);
    const [studyTime, setStudyTime] = useState(0);
    const [selectedSubject, setSelectedSubject] = useState("");
    const [startTime, setStartTime] = useState(null);
    const [selectedMember, setSelectedMember] = useState(null);
    const [messageText, setMessageText] = useState("");
    const [subjectList, setSubjectList] = useState([]);
    const [newSubject, setNewSubject] = useState("");

    useEffect(() => {
        const fetchRoomInfo = async () => {
            const token = localStorage.getItem("token");
            try {
                const res = await fetch("http://localhost:5000/api/rooms/current", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success && data.room) {
                    setRoomInfo(data.room);
                }
            } catch (err) {
                console.error("取得房間資訊失敗", err);
            }
        };

        fetchRoomInfo();
    }, []);


    useEffect(() => {
        const fetchSubjects = async () => {
            const token = localStorage.getItem("token");
            try {
                const res = await fetch("http://localhost:5000/api/study/courses", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                const data = await res.json();
                if (data.success) {
                    setSubjectList(data.courses);
                }
            } catch (err) {
                console.error("取得科目失敗", err);
            }
        };
        fetchSubjects();
    }, []);

    useEffect(() => {
        let timer;
        if (isStudying) {
            timer = setInterval(() => {
                setStudyTime((prev) => prev + 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [isStudying]);

    const handleAddSubject = async () => {
        if (!newSubject.trim()) return;
        const token = localStorage.getItem("token");
        try {
            const res = await fetch("http://localhost:5000/api/study/courses", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ courseName: newSubject }),
            });
            const data = await res.json();
            if (data.success) {
                setSubjectList([...subjectList, data.course]);
                setNewSubject("");
            }
        } catch (err) {
            console.error("新增科目失敗", err);
        }
    };

    const toggleStudy = async () => {
        if (!isStudying && !selectedSubject) {
            alert("請先選擇科目！");
            return;
        }

        if (!isStudying) {
            setStartTime(Date.now());
        } else {
            const endTime = Date.now();
            const durationInSeconds = Math.floor((endTime - startTime) / 1000);

            try {
                const token = localStorage.getItem("token");
                const response = await fetch('http://localhost:5000/api/study/study-records', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        subjectName: selectedSubject,
                        duration: durationInSeconds,
                    }),
                });
                if (response.ok) {
                    console.log('✅ 學習紀錄已成功上傳到後端');
                } else {
                    console.error('❌ 上傳失敗');
                }
            } catch (error) {
                console.error('❌ 上傳時發生錯誤:', error);
            }
        }

        setStudyTime(0);
        setSelectedSubject("");
        setIsStudying(!isStudying);
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

    const activeCount = members.filter((m) => m.online).length;

    return (
        <div style={{ padding: "2rem" }}>
            <button className="back-btn" onClick={() => navigate("/rooms")}>← 回到自習室列表</button>

            <div className="studyroom-banner">
                <h2>{roomInfo.name}</h2>
                <p className="tagline">{roomInfo.tagline || "一起努力學習吧！"}</p>
                <p className="date">{today}</p>
            </div>

            <div style={{ borderTop: "1px solid #ccc", paddingTop: "1rem", marginBottom: "2rem" }}>
                <p>目前狀態：{isStudying ? "🟢 學習中" : "🟡 未開始"}　目前科目：{selectedSubject || "（尚未選擇）"}</p>

                {!isStudying && (
                    <>
                        <select
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                            style={{ marginRight: "1rem", padding: "6px" }}
                        >
                            <option value="">選擇科目</option>
                            {subjectList.map((subj) => (
                                <option key={subj.id} value={subj.courseName}>{subj.courseName}</option>
                            ))}
                        </select>
                        <input
                            type="text"
                            value={newSubject}
                            onChange={(e) => setNewSubject(e.target.value)}
                            placeholder="新增自訂科目"
                            style={{ marginRight: "0.5rem", padding: "6px" }}
                        />
                        <button onClick={handleAddSubject}>新增</button>
                    </>
                )}

                <button className="enter-btn" onClick={toggleStudy}>
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
                            <div className={`status-dot ${member.online ? "status-online" : "status-offline"}`} />
                            <strong>{member.name}</strong>
                        </div>
                        <span style={{ fontSize: "0.9rem", color: "#666" }}>{member.studyTime}</span>
                    </div>
                ))}
            </div>

            {selectedMember && (
                <div className="member-modal">
                    <div className="member-card">
                        <button className="close-btn" onClick={() => setSelectedMember(null)}>×</button>
                        <img
                            src={`https://api.dicebear.com/7.x/thumbs/svg?seed=${selectedMember.name}`}
                            alt="avatar"
                            className="member-avatar"
                        />
                        <h3>{selectedMember.name}</h3>
                        <p>開始：10點08分</p>
                        <p>狀態：{selectedMember.online ? "學習中" : "休息中"}</p>
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
                    </div>
                </div>
            )}
        </div>
    );
}
