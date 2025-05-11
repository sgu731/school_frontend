import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

function NoteDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [note, setNote] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const token = localStorage.getItem("token");

    useEffect(() => {
        // 抓單篇筆記內容
        fetch(`http://localhost:5000/api/notes/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then((res) => res.json())
            .then((data) => setNote(data))
            .catch((err) => {
                console.error("載入筆記失敗：", err);
                setNote(null);
            });

        // 抓留言串
        fetch(`http://localhost:5000/api/notes/${id}/replies`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then((res) => res.json())
            .then((data) => setComments(data))
            .catch((err) => {
                console.error("載入留言失敗：", err);
                setComments([]);
            });
    }, [id, token]);

    const handleBack = () => {
        navigate("/sharing");
    };

    const handleAddComment = () => {
        if (newComment.trim() === "") return;

        fetch(`http://localhost:5000/api/notes/${id}/replies`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ text: newComment })
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    setComments([...comments, data.comment]);
                    setNewComment("");
                } else {
                    console.error("留言新增失敗：", data.message);
                }
            })
            .catch((err) => {
                console.error("留言新增失敗：", err);
            });
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
