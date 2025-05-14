import React, { useEffect, useState } from "react";
import NoteCard from "./NoteCard";
import "./NoteListtwo.css";

function NoteListtwo() {
    const [notes, setNotes] = useState([]);
    const [search, setSearch] = useState("");
    const token = localStorage.getItem("token");

    //抓
    useEffect(() => {
        fetch(`${process.env.REACT_APP_API_URL}/api/notes`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then((res) => res.json())
            .then((data) => setNotes(data))
            .catch((err) => console.error("載入筆記失敗：", err));
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
            .catch((err) => console.error("切換收藏失敗：", err));
    };

    const filteredNotes = notes.filter((note) =>
        note.title.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="note-list-container">
            <input
                type="text"
                className="search-input"
                placeholder="搜尋筆記"
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
