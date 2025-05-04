import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./ThreadDetailPage.css";

// 原本假資料，現在只當初始資料用
const initialThreads = {
    1: {
        author: "人中人",
        title: "Python 問題請教",
        content: "請問 Python 裡面 for loop 裡的 else 是怎麼用的？",
        replies: [
            { id: 1, author: "回覆者A", text: "else 是 for loop 結束時才會執行的！" },
            { id: 2, author: "回覆者B", text: "如果 loop 有 break，就不會進入 else。" }
        ],
        favorites: 10,
        date: "2024 / 01 / 01"
    },
    2: {
        author: "人上人",
        title: "微積分問題請教",
        content: "求導數一定要用極限定義嗎？",
        replies: [{ id: 1, author: "回覆者C", text: "一開始學是用極限，後來會有公式快速做！" }],
        favorites: 20,
        date: "2023 / 10 / 09"
    },
    3: {
        author: "人上人",
        title: "供需法則怎麼看",
        content: "想問供需法則有沒有例外情況？",
        replies: [{ id: 1, author: "回覆者D", text: "有些商品是非典型的，比如奢侈品。" }],
        favorites: 5,
        date: "2023 / 10 / 09"
    }
};

export default function ThreadDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const bottomRef = useRef(null);

    const [thread, setThread] = useState(null);
    const [newReply, setNewReply] = useState("");

    // 載入討論串
    useEffect(() => {
        const storedThreads = JSON.parse(localStorage.getItem("threads")) || initialThreads;
        setThread(storedThreads[id]);
    }, [id]);

    // 每次留言更新後，滑到最下面
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [thread]);

    const handleAddReply = () => {
        if (newReply.trim() === "") return;

        const updatedThread = {
            ...thread,
            replies: [...thread.replies, { id: thread.replies.length + 1, author: "你", text: newReply }]
        };

        const storedThreads = JSON.parse(localStorage.getItem("threads")) || initialThreads;
        storedThreads[id] = updatedThread;
        localStorage.setItem("threads", JSON.stringify(storedThreads));

        setThread(updatedThread);
        setNewReply("");
    };

    if (!thread) return <div>找不到這篇討論串！</div>;

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
                {thread.replies.map((reply) => (
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
