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
    const subjectList = ["C", "Python", "JAVA"];

    useEffect(() => {
        setRoomInfo({
            id: 1,
            name: "Room A",
            creator_name: "Tina",
            tagline: "愛讀書的一群傢伙 💪",
        });

        setMembers([
            { id: 1, name: "最愛數學的Tina", online: true, studyTime: "3 小時 15 分" },
            { id: 2, name: "Jessica", online: true, studyTime: "2 小時 5 分" },
            { id: 3, name: "Robert", online: true, studyTime: "20 分鐘" },
            { id: 4, name: "Toby", online: false, studyTime: "0 分鐘" },
        ]);
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

    const toggleStudy = () => {
        if (!isStudying && !selectedSubject) {
            alert("請先選擇科目！");
            return;
        }
        if (!isStudying) setStartTime(Date.now());
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
                <p>
                    目前狀態：{isStudying ? "🟢 學習中" : "🟡 未開始"}　目前科目：{selectedSubject || "（尚未選擇）"}
                </p>

                {!isStudying && (
                    <select
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        style={{ marginRight: "1rem", padding: "6px" }}
                    >
                        <option value="">選擇科目</option>
                        {subjectList.map((subj, i) => (
                            <option key={i} value={subj}>{subj}</option>
                        ))}
                    </select>
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
