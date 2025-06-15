import React from "react";
import { useNavigate } from "react-router-dom";
import "./NoteListtwo.css";
import { useTranslation } from 'react-i18next'; // 導入 useTranslation

function NoteCard({ note, toggleBookmark }) {
    const navigate = useNavigate();
    const { t } = useTranslation('noteCard'); // 指定 noteCard 命名空間

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
                    title={note.bookmarked ? t('removeBookmark') : t('addBookmark')}
                >
                    {note.bookmarked ? "⭐" : "☆"}
                </button>
            </div>

            {/* 作者 */}
            <p className="note-author">👤 {t('author')}: {note.author}</p>

            {/* 建立時間（若後端有提供 created_at 欄位） */}
            {note.created_at && (
                <p className="note-date">🕒 {t('publishTime')}: {note.created_at.slice(0, 10)}</p>
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