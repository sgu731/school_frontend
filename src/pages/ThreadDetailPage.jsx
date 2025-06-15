import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./ThreadDetailPage.css";
import { useTranslation } from 'react-i18next'; // 導入 useTranslation

export default function ThreadDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const bottomRef = useRef(null);
    const { t } = useTranslation('threadDetail'); // 指定 threadDetail 命名空間

    const [thread, setThread] = useState(null);
    const [newReply, setNewReply] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // 載入討論串資料（含留言）
    useEffect(() => {
        fetch(`${process.env.REACT_APP_API_URL}/api/forum/${id}`)
            .then(res => {
                if (!res.ok) throw new Error(t('postNotFound'));
                return res.json();
            })
            .then(data => {
                setThread(data);
                setError("");
            })
            .catch(err => {
                console.error(t('loadThreadFailed'), err);
                setError(t('threadNotFound'));
            })
            .finally(() => setLoading(false));
    }, [id, t]);

    // 滑動到留言區底部
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [thread]);

    // 送出留言
    const handleAddReply = async () => {
        if (newReply.trim() === "") return;

        const token = localStorage.getItem("token");
        if (!token) {
            alert(t('loginToComment'));
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
            if (!res.ok) throw new Error(result.error || t('commentFailed'));

            const newComment = result.reply || result;

            if (!newComment || !newComment.author || !newComment.text) {
                throw new Error(t('invalidResponseFormat'));
            }

            setThread(prev => ({
                ...prev,
                replies: [...(prev.replies || []), newComment]
            }));

            setNewReply("");
        } catch (err) {
            console.error(t('submitCommentFailed'), err);
            alert(t('submitCommentError', { message: err.message }));
        }
    };

    if (loading) return <div>{t('loading')}</div>;
    if (error) return <div>{error}</div>;

    return (
        <div className="thread-detail-container">
            <button className="back-button" onClick={() => navigate(-1)}>
                {t('backToForum')}
            </button>

            <div className="thread-title">{thread.title}</div>
            <div className="thread-author">{t('postedBy', { author: thread.author })}</div>
            <p className="thread-content">{thread.content}</p>

            <h3>{t('commentSection')}</h3>
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
                    placeholder={t('enterCommentPlaceholder')}
                />
                <button onClick={handleAddReply}>{t('submitComment')}</button>
            </div>
        </div>
    );
}