import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import './RoomsPage.css';

function RoomsPage() {
    const [roomName, setRoomName] = useState('');
    const [allRooms, setAllRooms] = useState([]);
    const [currentRoom, setCurrentRoom] = useState(null);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        setAllRooms([
            { id: 1, name: "Room A", creator_name: "Tina", online: true },
            { id: 2, name: "Room B", creator_name: "Toby", online: false },
            { id: 3, name: "Room C", creator_name: "Teresa", online: false },
        ]);
        setCurrentRoom({ id: 1, name: "Room A", creator_name: "Tina" });
    }, []);

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
                <button onClick={() => alert("此功能尚未實作")}>創建自習室</button>
            </div>

            <div>
                <h3>自習室列表</h3>
                <div style={{ display: "grid", gap: "1rem" }}>
                    {allRooms.map((room) => (
                        <div key={room.id} className="room-card">
                            <div className="room-info">
                                <div className={`status-dot ${room.online ? "status-online" : "status-offline"}`}></div>
                                <span>{room.name}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                <span style={{ fontSize: "0.9rem", color: "#555" }}>房主: {room.creator_name}</span>
                                <button className="enter-btn" onClick={() => navigate("/studyroom")}>
                                    進入房間
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {currentRoom && (
                <div style={{ marginTop: "2rem" }}>
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
