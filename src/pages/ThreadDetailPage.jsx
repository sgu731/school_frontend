import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./ThreadDetailPage.css";

export default function ThreadDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const bottomRef = useRef(null);

    const [thread, setThread] = useState(null);
    const [newReply, setNewReply] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // 載入討論串資料（含留言）
    useEffect(() => {
        fetch(`${process.env.REACT_APP_API_URL}/api/forum/${id}`)
            .then(res => {
                if (!res.ok) throw new Error("找不到貼文");
                return res.json();
            })
            .then(data => {
                setThread(data);
                setError("");
            })
            .catch(err => {
                console.error("載入討論串失敗", err);
                setError("❌ 找不到這篇討論串！");
            })
            .finally(() => setLoading(false));
    }, [id]);

    // 滑動到留言區底部
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [thread]);

    // 送出留言
    const handleAddReply = async () => {
        if (newReply.trim() === "") return;

        const token = localStorage.getItem("token");
        if (!token) {
            alert("請先登入才能留言！");
            return;
        }

        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/api/forum/${id}/reply`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ text: newReply })
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.error || "留言失敗");

            const newComment = result.reply || result;

            if (!newComment || !newComment.author || !newComment.text) {
                throw new Error("回傳格式錯誤");
            }

            setThread(prev => ({
                ...prev,
                replies: [...(prev.replies || []), newComment]
            }));

            setNewReply("");
        } catch (err) {
            console.error("送出留言失敗", err);
            alert("❌ 無法送出留言：" + err.message);
        }
    };

    if (loading) return <div>載入中...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div className="thread-detail-container">
            <button className="back-button" onClick={() => navigate(-1)}>
                ← 返回討論區
            </button>

            <div className="thread-title">{thread.title}</div>
            <div className="thread-author">發文者：{thread.author}</div>
            <p className="thread-content">{thread.content}</p>

            <h3>留言區</h3>
            <div className="replies">
                {(thread.replies || []).map((reply) => (
                    <div key={reply.id} className="reply">
                        <div className="avatar">👤</div>
                        <div className="bubble">
                            <strong>{reply.author}：</strong> {reply.text}
                        </div>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>

            <div className="reply-input">
                <textarea
                    value={newReply}
                    onChange={(e) => setNewReply(e.target.value)}
                    placeholder="輸入你的留言..."
                />
                <button onClick={handleAddReply}>送出留言</button>
            </div>
        </div>
    );
}