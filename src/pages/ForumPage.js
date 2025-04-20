import React from "react";
import "./ForumPage.css"; 

const fakeThreads = [
    {
        id: 1,
        author: "Lisa",
        title: "Python 問題請教",
        posts: 5,
        replies: 30,
        favorites: 10,
        date: "2024 / 01 / 01"
    },
    {
        id: 2,
        author: "Toby",
        title: "微積分問題請教",
        posts: 3,
        replies: 18,
        favorites: 20,
        date: "2024 / 10 / 09"
    },
    {
        id: 3,
        author: "瑪莉有隻小綿羊",
        title: "供需法則怎麼看",
        posts: 1,
        replies: 12,
        favorites: 5,
        date: "2025 / 01 / 09"
    },
     {
        id: 4,
        author: "好想吃馬卡龍",
        title: "竹北好吃馬卡龍推薦",
        posts: 2,
        replies: 2,
        favorites: 6,
        date: "2025 / 03 / 13"
    },
    {
        id: 5,
        author: "老師",
        title: "給會考生的小建議",
        posts: 15,
        replies: 2,
        favorites: 6,
        date: "2025 / 03 / 30"
    }
];

export default function ForumPage() {
    return (
        <div className="forum-container">
            <div className="forum-header">
                <h2>討論區</h2>
                {/* 可加上分類與搜尋條 */}
            </div>
            <div className="thread-list">
                {fakeThreads.map(thread => (
                    <div key={thread.id} className="thread-card">
                        <div className="thread-author">
                            <div className="avatar-placeholder">👤</div>
                            <span>{thread.author}</span>
                        </div>
                        <div className="thread-content">
                            <h3>{thread.title}</h3>
                            <div className="thread-meta">
                                <span>{thread.posts} 已發佈</span>
                                <span>{thread.replies} 回覆</span>
                                <span>{thread.favorites} 收藏</span>
                                <span>{thread.date}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
