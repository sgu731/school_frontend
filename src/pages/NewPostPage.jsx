import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./NewPostPage.css";

const categories = ["Python", "數學", "經濟", "哲學"];

export default function NewPostPage() {
    const navigate = useNavigate();
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [category, setCategory] = useState(categories[0]);

    const handleSubmit = () => {
        if (!title.trim() || !content.trim()) {
            alert("請填寫標題與內容！");
            return;
        }

        const storedThreads = JSON.parse(localStorage.getItem("threads")) || {};
        const newId = Date.now(); // 用 timestamp 當新的 id

        const newThread = {
            author: "你",
            title,
            content,
            replies: [],
            favorites: 0,
            date: new Date().toISOString().slice(0, 10),
            bookmarked: false,
            category
        };

        storedThreads[newId] = newThread;
        localStorage.setItem("threads", JSON.stringify(storedThreads));

        navigate("/forum"); // 發表完回討論區
    };

    return (
        <div className="new-post-container">
            <h2>發表新文章</h2>

            <input
                type="text"
                placeholder="請輸入標題"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
            />

            <textarea
                placeholder="請輸入內容"
                value={content}
                onChange={(e) => setContent(e.target.value)}
            />

            <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
            >
                {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                ))}
            </select>

            <button onClick={handleSubmit}>送出文章</button>
        </div>
    );
}
