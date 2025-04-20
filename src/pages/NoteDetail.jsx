import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

function NoteDetail() {
    const { id } = useParams();
    const navigate = useNavigate(); // 用來回上一頁或導回 /sharing
    const [note, setNote] = useState(null);

    useEffect(() => {
        let savedNotes = JSON.parse(localStorage.getItem("shared-notes"));

        if (!savedNotes || savedNotes.length === 0) {
            // 📌 若 localStorage 沒有資料，就寫入一份預設資料
            savedNotes = [
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
                    bookmarked: false,
                }
            ];
            localStorage.setItem("shared-notes", JSON.stringify(savedNotes));
        }

        const foundNote = savedNotes.find((n) => n.id === parseInt(id));
        setNote(foundNote);
    }, [id]);

    const handleBack = () => {
        navigate("/sharing"); // 返回到筆記列表頁
    };

    if (!note) {
        return (
            <div style={{ padding: "24px" }}>
                <button onClick={handleBack} style={backBtnStyle}>⬅ 返回筆記清單</button>
                <p style={{ marginTop: "20px" }}>❗找不到這篇筆記</p>
            </div>
        );
    }

    return (
        <div style={{ padding: "24px" }}>
            <button onClick={handleBack} style={backBtnStyle}>⬅ 返回筆記清單</button>

            <h2 style={{ fontSize: "24px", fontWeight: "bold", marginTop: "20px" }}>{note.title}</h2>
            <p style={{ color: "#666", margin: "12px 0" }}>作者：{note.author}</p>
            <p>👁️ {note.views} 次瀏覽</p>
            <p>💬 {note.comments} 則留言</p>
            <p>📌 收藏狀態：{note.bookmarked ? "已收藏" : "未收藏"}</p>
        </div>
    );
}

const backBtnStyle = {
    backgroundColor: "#f0f0f0",
    padding: "8px 16px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px"
};

export default NoteDetail;
