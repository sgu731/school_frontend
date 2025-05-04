import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ForumPage.css";

const initialThreads = {
    1: {
        author: "人中人",
        title: "Python 問題請教",
        content: "請問 Python 裡面 for loop 裡的 else 是怎麼用的？",
        replies: [
            { id: 1, author: "Anna", text: "else 是 for loop 結束時才會執行的！" },
            { id: 2, author: "回覆者B", text: "如果 loop 有 break，就不會進入 else。" }
        ],
        favorites: 10,
        date: "2024 / 01 / 01",
        bookmarked: false,
        category: "Python"
    },
    2: {
        author: "人上人",
        title: "微積分問題請教",
        content: "求導數一定要用極限定義嗎？",
        replies: [{ id: 1, author: "回覆者C", text: "一開始學是用極限，後來會有公式快速做！" }],
        favorites: 20,
        date: "2023 / 10 / 09",
        bookmarked: false,
        category: "數學"
    },
    3: {
        author: "人上人",
        title: "供需法則怎麼看",
        content: "想問供需法則有沒有例外情況？",
        replies: [{ id: 1, author: "Danny", text: "有些商品是非典型的，比如奢侈品。" }],
        favorites: 5,
        date: "2023 / 10 / 09",
        bookmarked: false,
        category: "經濟"
    }
};

const categories = ["全部", "Python", "數學", "經濟"];

export default function ForumPage() {
    const navigate = useNavigate();
    const [threads, setThreads] = useState({});
    const [selectedCategory, setSelectedCategory] = useState("全部");
    const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);

    useEffect(() => {
        const storedThreads = JSON.parse(localStorage.getItem("threads")) || initialThreads;
        setThreads(storedThreads);
    }, []);

    const handleClick = (id) => {
        navigate(`/forum/${id}`);
    };

    const handleBookmarkToggle = (id) => {
        const updatedThreads = {
            ...threads,
            [id]: {
                ...threads[id],
                bookmarked: !threads[id].bookmarked
            }
        };
        setThreads(updatedThreads);
        localStorage.setItem("threads", JSON.stringify(updatedThreads));
    };

    const filteredThreads = Object.entries(threads).filter(([id, thread]) => {
        const matchCategory =
            selectedCategory === "全部" || thread.category === selectedCategory;
        const matchBookmark = !showBookmarkedOnly || thread.bookmarked;
        return matchCategory && matchBookmark;
    });

    return (
        <div className="forum-container">
            {/* 上方 header 區 */}
            <div className="forum-header">
                <h2>討論區</h2>
                <button className="new-post-button" onClick={() => navigate("/forum/new")}>
                    ＋ 發表新文章
                </button>
            </div>

            {/* 分類＋收藏篩選 */}
            <div className="category-bar">
                {categories.map((cat) => (
                    <button
                        key={cat}
                        className={`category-button ${selectedCategory === cat ? "active" : ""}`}
                        onClick={() => setSelectedCategory(cat)}
                    >
                        {cat}
                    </button>
                ))}
                <button
                    className={`bookmark-toggle ${showBookmarkedOnly ? "active" : ""}`}
                    onClick={() => setShowBookmarkedOnly(!showBookmarkedOnly)}
                >
                    ⭐ 只看收藏
                </button>
            </div>

            {/* 貼文列表 */}
            <div className="thread-list">
                {filteredThreads.map(([id, thread]) => (
                    <div
                        key={id}
                        className="thread-card"
                    >
                        <div className="thread-author">
                            <div className="avatar-placeholder">👤</div>
                            <span>{thread.author}</span>
                        </div>
                        <div className="thread-content" onClick={() => handleClick(id)}>
                            <h3>{thread.title}</h3>
                            <div className="thread-meta">
                                <span>{thread.category}</span>
                                <span>{thread.replies.length} 回覆</span>
                                <span>{thread.favorites} 收藏</span>
                                <span>{thread.date}</span>
                            </div>
                        </div>
                        <div
                            className="bookmark-icon"
                            onClick={() => handleBookmarkToggle(id)}
                        >
                            {thread.bookmarked ? "⭐" : "☆"}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
