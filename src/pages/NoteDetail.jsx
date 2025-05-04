import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

function NoteDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [note, setNote] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");

    useEffect(() => {
        let savedNotes = JSON.parse(localStorage.getItem("shared-notes"));
        if (!savedNotes || savedNotes.length === 0) {
            savedNotes = [
                { id: 1, title: "JAVA Chapter 1", author: "人外人", views: 114, comments: 25, bookmarked: false, content: "這是 JAVA 第一章的詳細筆記內容..." },
                { id: 2, title: "C++ Chapter11", author: "人上人", views: 25, comments: 116, bookmarked: false, content: "這是 C++ 第十一章的深入探討..." },
                { id: 3, title: "經濟學原理 第三章", author: "人中人", views: 86, comments: 20, bookmarked: false, content: "經濟學第三章：需求與供給法則說明..." }
            ];
            localStorage.setItem("shared-notes", JSON.stringify(savedNotes));
        }
        const foundNote = savedNotes.find((n) => n.id === parseInt(id));
        setNote(foundNote);

        // 讀取留言（以每篇筆記 id 為 key）
        const savedComments = JSON.parse(localStorage.getItem(`comments-${id}`)) || [];
        setComments(savedComments);
    }, [id]);

    const handleBack = () => {
        navigate("/sharing");
    };

    const handleAddComment = () => {
        if (newComment.trim() === "") return;

        const now = new Date();
        const timestamp = now.toLocaleString(); // ex: 2025/4/30 上午11:30

        const newCommentObj = { text: newComment, timestamp };
        const updatedComments = [...comments, newCommentObj];
        setComments(updatedComments);
        setNewComment("");

        // 儲存新的留言列表
        localStorage.setItem(`comments-${id}`, JSON.stringify(updatedComments));

        // 更新筆記的留言數
        let savedNotes = JSON.parse(localStorage.getItem("shared-notes")) || [];
        const updatedNotes = savedNotes.map((n) => {
            if (n.id === parseInt(id)) {
                return { ...n, comments: n.comments + 1 };
            }
            return n;
        });
        localStorage.setItem("shared-notes", JSON.stringify(updatedNotes));

        // 同步更新目前頁面的 note (讓留言數即時變動)
        const updatedNote = updatedNotes.find((n) => n.id === parseInt(id));
        setNote(updatedNote);
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

            {/* 筆記內容 */}
            <h2 style={{ fontSize: "24px", fontWeight: "bold", marginTop: "20px" }}>{note.title}</h2>
            <p style={{ color: "#666", margin: "12px 0" }}>作者：{note.author}</p>
            <p style={{ margin: "12px 0" }}>{note.content}</p>

            {/* 討論區 */}
            <div style={{ marginTop: "40px" }}>
                <h3>💬 討論區</h3>

                {/* 新增留言輸入框 */}
                <div style={{ marginTop: "20px" }}>
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="輸入你的留言..."
                        style={textareaStyle}
                    />
                    <button onClick={handleAddComment} style={submitBtnStyle}>送出留言</button>
                </div>

                <div style={{ marginTop: "16px" }}>
                    {comments.length === 0 ? (
                        <p style={{ color: "#999" }}>目前還沒有留言，快來發表第一則吧！</p>
                    ) : (
                        comments.map((cmt, idx) => (
                            <div key={idx} style={commentStyle}>
                                <div>{cmt.text}</div>
                                <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>{cmt.timestamp}</div>
                            </div>
                        ))
                    )}
                </div>

            </div>
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

const commentStyle = {
    backgroundColor: "#f9f9f9",
    padding: "8px",
    borderRadius: "6px",
    marginBottom: "8px"
};

const textareaStyle = {
    width: "100%",
    minHeight: "80px",
    marginTop: "10px",
    padding: "8px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    resize: "vertical"
};

const submitBtnStyle = {
    marginTop: "8px",
    padding: "8px 16px",
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer"
};

export default NoteDetail;
