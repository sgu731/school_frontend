import React, { useState } from "react";
import NoteCard from "./NoteCard";
import "./NoteListtwo.css";

const initialNotes = [
    {
        id: 1,
        title: "JAVA Chapter 1",
        author: "人外人",
        views: 114,
        comments: 25,
        bookmarked: false,
    },
    {
        id: 2,
        title: "C++ Chapter11",
        author: "人上人",
        views: 25,
        comments: 116,
        bookmarked: false,
    },
    {
        id: 3,
        title: "經濟學原理 第三章",
        author: "人中人",
        views: 86,
        comments: 20,
        bookmarked: true,
    },
];

function NoteListtwo() {
    const [notes, setNotes] = useState(initialNotes);
    const [search, setSearch] = useState("");

    const toggleBookmark = (id) => {
        setNotes((prev) =>
            prev.map((note) =>
                note.id === id ? { ...note, bookmarked: !note.bookmarked } : note
            )
        );
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
                {filteredNotes.map((note) => {
                    // 🔥 新增：從 localStorage 讀取真實留言數
                    const savedComments = JSON.parse(localStorage.getItem(`comments-${note.id}`)) || [];
                    const realCommentCount = savedComments.length;

                    return (
                        <NoteCard
                            key={note.id}
                            note={{ ...note, comments: realCommentCount }} // 用真實留言數覆蓋
                            toggleBookmark={toggleBookmark}
                        />
                    );
                })}
            </div>
        </div>
    );
}

export default NoteListtwo;
