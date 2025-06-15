import React, { useEffect, useState } from "react";
import NoteCard from "./NoteCard";
import "./NoteListtwo.css";
import { useTranslation } from 'react-i18next'; // 導入 useTranslation

function NoteListtwo() {
    const [notes, setNotes] = useState([]);
    const [search, setSearch] = useState("");
    const token = localStorage.getItem("token");
    const { t } = useTranslation('noteList'); // 指定 noteList 命名空間

    //抓
    useEffect(() => {
        fetch(`${process.env.REACT_APP_API_URL}/api/notes`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then((res) => res.json())
            .then((data) => setNotes(data))
            .catch((err) => console.error(t('loadNotesFailed') + ":", err));
    }, [token]);

    // 切換收藏狀態
    const toggleBookmark = (id) => {
        fetch(`${process.env.REACT_APP_API_URL}/api/notes/${id}/bookmark`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    setNotes((prev) =>
                        prev.map((note) =>
                            note.id === id ? { ...note, bookmarked: data.bookmarked === 1 } : note
                        )
                    );
                }
            })
            .catch((err) => console.error(t('toggleBookmarkFailed') + ":", err));
    };

    const filteredNotes = notes.filter((note) =>
        note.title.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="note-list-container">
            <input
                type="text"
                className="search-input"
                placeholder={t('searchNotes')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />

            <div className="note-grid">
                {filteredNotes.map((note) => (
                    <NoteCard key={note.id} note={note} toggleBookmark={toggleBookmark} />
                ))}
            </div>
        </div>
    );
}

export default NoteListtwo;