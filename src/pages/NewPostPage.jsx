import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./NewPostPage.css";
import { useTranslation } from "react-i18next"; // 導入 useTranslation

export default function NewPostPage() {
    const navigate = useNavigate();
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [category, setCategory] = useState("");
    const [categories, setCategories] = useState([]);
    const { t } = useTranslation('newPost'); // 指定 newPost 命名空間

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
            alert(t('fillTitleAndContent')); // 使用翻譯
            return;
        }

        const token = localStorage.getItem("token");
        if (!token) {
            alert(t('loginToPost')); // 使用翻譯
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
                alert(t('postSuccess')); // 使用翻譯
                navigate("/forum");
            } else {
                const result = await res.json();
                alert(t('postFailed', { error: result.error })); // 使用翻譯
            }
        } catch (err) {
            console.error("發表文章失敗", err);
            alert(t('postError')); // 使用翻譯
        }
    };

    return (
        <div className="new-post-container">
            <h2>{t('newPostTitle')}</h2>

            <input
                type="text"
                placeholder={t('titlePlaceholder')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
            />

            <textarea
                placeholder={t('contentPlaceholder')}
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

            <button onClick={handleSubmit}>{t('submitPost')}</button>
        </div>
    );
}