import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./NewPostPage.css";

export default function NewPostPage() {
    const navigate = useNavigate();
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [category, setCategory] = useState("");
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        fetch(`${process.env.REACT_APP_API_URL}/api/categories`)
            .then(res => res.json())
            .then(data => {
                setCategories(data);
                if (data.length > 0) setCategory(data[0].name);
            })
            .catch(err => {
                console.error("讀取分類失敗", err);
            });
    }, []);

    const handleSubmit = async () => {
        if (!title.trim() || !content.trim()) {
            alert("請填寫標題與內容！");
            return;
        }

        const token = localStorage.getItem("token");
        if (!token) {
            alert("請先登入才能發文");
            return;
        }

        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/api/forum`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ title, content, category })
            });

            if (res.ok) {
                alert("✅ 發表成功！");
                navigate("/forum");
            } else {
                const result = await res.json();
                alert("❌ 發表失敗: " + result.error);
            }
        } catch (err) {
            console.error("發表文章失敗", err);
            alert("❌ 發文時出錯！");
        }
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
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
            </select>

            <button onClick={handleSubmit}>送出文章</button>
        </div>
    );
}
