import React from "react";
import { useNavigate } from "react-router-dom";
import "./NoteListtwo.css";

function NoteCard({ note, toggleBookmark }) {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(`/sharing/${note.id}`);
    };

    return (
        <div className="note-card" onClick={handleClick} style={{ cursor: "pointer" }}>
            {/* 標題與收藏按鈕 */}
            <div className="note-header">
                <h2 className="note-title">{note.title}</h2>
                <button
                    className="bookmark-btn"
                    onClick={(e) => {
                        e.stopPropagation(); // 防止點到跳轉
                        toggleBookmark(note.id);
                    }}
                    title={note.bookmarked ? "取消收藏" : "加入收藏"}
                >
                    {note.bookmarked ? "⭐" : "☆"}
                </button>
            </div>

            {/* 作者 */}
            <p className="note-author">👤 作者：{note.author}</p>

            {/* 建立時間（若後端有提供 created_at 欄位） */}
            {note.created_at && (
                <p className="note-date">🕒 發佈時間：{note.created_at.slice(0, 10)}</p>
            )}

            {/* 計數資訊 */}
            <div className="note-footer">
                <span>👁️ {note.views}</span>
                <span>💬 {note.total_comments ?? 0}</span>
            </div>
        </div>
    );
}

export default NoteCard;
