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
            <div className="note-header">
                <h2 className="note-title">{note.title}</h2>
                <button
                    className="bookmark-btn"
                    onClick={(e) => {
                        e.stopPropagation(); // 防止點到按鈕時觸發跳轉
                        toggleBookmark(note.id);
                    }}
                >
                    {note.bookmarked ? "🔖" : "📑"}
                </button>
            </div>
            <p className="note-author">作者：{note.author}</p>
            <div className="note-footer">
                <span>👁️ {note.views}</span>
                <span>💬 {note.comments}</span>
            </div>
        </div>
    );
}

export default NoteCard;
