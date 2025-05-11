import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./ForumPage.css";

export default function ForumPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const [categories, setCategories] = useState([{ id: 0, name: "全部" }]);
    const [selectedCategory, setSelectedCategory] = useState("全部");

    const [threads, setThreads] = useState({});
    const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);

    // 抓分類（來自 /api/categories）
    useEffect(() => {
        fetch("http://localhost:5000/api/categories")
            .then(res => res.json())
            .then(data => {
                const all = [{ id: 0, name: "全部" }, ...data];
                setCategories(all);
            })
            .catch(err => {
                console.error("讀取分類失敗", err);
            });
    }, []);

    // 每次切換頁面時重新讀取討論串（含留言數）
    useEffect(() => {
        fetch("http://localhost:5000/api/forum")
            .then(res => res.json())
            .then(data => {
                const threadMap = {};
                data.forEach(thread => {
                    threadMap[thread.id] = {
                        ...thread,
                        bookmarked: thread.bookmarked === 1 || thread.bookmarked === true,
                        date: new Date(thread.created_at).toLocaleDateString("zh-TW")
                    };
                });
                setThreads(threadMap);
            })
            .catch(err => {
                console.error("讀取討論串失敗", err);
            });
    }, [location]);

    // 切換收藏
    const handleBookmarkToggle = async (id) => {
        try {
            const res = await fetch(`http://localhost:5000/api/forum/${id}/bookmark`, {
                method: "PATCH"
            });
            const result = await res.json();
            setThreads(prev => ({
                ...prev,
                [id]: {
                    ...prev[id],
                    bookmarked: result.bookmarked
                }
            }));
        } catch (err) {
            console.error("切換收藏失敗", err);
        }
    };

    const handleClick = (id) => {
        navigate(`/forum/${id}`);
    };

    // 篩選分類與收藏
    const filteredThreads = Object.entries(threads).filter(([id, thread]) => {
        const matchCategory = selectedCategory === "全部" || thread.category === selectedCategory;
        const matchBookmark = !showBookmarkedOnly || thread.bookmarked;
        return matchCategory && matchBookmark;
    });

    return (
        <div className="forum-container">
            <div className="forum-header">
                <h2>討論區</h2>
                <button className="new-post-button" onClick={() => navigate("/forum/new")}>
                    ＋ 發表新文章
                </button>
            </div>

            <div className="category-bar">
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        className={`category-button ${selectedCategory === cat.name ? "active" : ""}`}
                        onClick={() => setSelectedCategory(cat.name)}
                    >
                        {cat.name}
                    </button>
                ))}
                <button
                    className={`bookmark-toggle ${showBookmarkedOnly ? "active" : ""}`}
                    onClick={() => setShowBookmarkedOnly(!showBookmarkedOnly)}
                >
                    ⭐ 只看收藏
                </button>
            </div>

            <div className="thread-list">
                {filteredThreads.map(([id, thread]) => (
                    <div key={id} className="thread-card">
                        <div className="thread-author">
                            <div className="avatar-placeholder">👤</div>
                            <span>{thread.author}</span>
                        </div>
                        <div className="thread-content" onClick={() => handleClick(id)}>
                            <h3>{thread.title}</h3>
                            <div className="thread-meta">
                                <span>{thread.category}</span>
                                <span>{thread.replyCount ?? 0} 回覆</span>
                                <span>{thread.favorites} 收藏</span>
                                <span>{thread.date}</span>
                            </div>
                        </div>
                        <div className="bookmark-icon" onClick={() => handleBookmarkToggle(id)}>
                            {thread.bookmarked ? "⭐" : "☆"}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
