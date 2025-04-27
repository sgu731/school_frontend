import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import './App.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// import HomePage from './pages/HomePage';
import NotebookDashboard from './pages/NotebookDashboard';
import CameraPage from './pages/CameraPage';
import VoicePage from './pages/VoicePage';
import RoomsPage from './pages/RoomsPage';
import StudyRoom from './pages/StudyRoom';
import TrackerPage from './pages/TrackerPage';
import PlanPage from './pages/PlanPage';
// import KnowledgePage from './pages/KnowledgePage';
import ForumPage from './pages/ForumPage';
import SharingPage from './pages/SharingPage';
import NoteDetail from "./pages/NoteDetail";
import LoginPage from './pages/LoginPage';
import UserProfilePage from './pages/UserProfilePage';
import RegisterPage from './pages/RegisterPage';

const queryClient = new QueryClient();

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [showEditNameModal, setShowEditNameModal] = useState(false);
    const [newName, setNewName] = useState('');

    return (
        <QueryClientProvider client={queryClient}>
            <Router>
                <div className="app-container">
                    {/* 頂部橘色橫條 */}
                    <header className="top-bar">
                        <div className="logo">逮救補</div>
                        <input type="text" placeholder="搜尋" className="search-bar" />
                            <div className="user-icon">
                            {isLoggedIn ? (
                                <Link to="/profile" className="user-link" style={{ display: 'flex', alignItems: 'center' }}>
                                {user?.avatar ? (
                                    <img
                                    src={`http://localhost:5000${user.avatar}`}
                                    alt="avatar"
                                    style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        objectFit: 'cover',
                                        marginRight: '8px'
                                    }}
                                    />
                                ) : (
                                    <span style={{ fontSize: '24px' }}>👤</span>
                                )}
                                Hi, {user?.name || '使用者'}
                                </Link>
                            ) : (
                                <Link to="/login" className="user-link">👤</Link>
                            )}
                            </div>
                    </header>

                    {/* 左側選單 + 右側內容 */}
                    <div className="main-content">
                        <nav className="side-menu">
                            {/* <Link to="/">登入</Link> */}
                            <Link to="/notebook">你的筆記</Link>
                            <Link to="/camera">相機</Link>
                            <Link to="/voice">語音</Link>
                            <Link to="/tracker">成效追蹤</Link>
                            {/* <Link to="/knowledge">知識庫</Link> */}
                            <Link to="/rooms">自習室</Link>
                            <Link to="/forum">討論區</Link>
                            <Link to="/sharing">筆記分享</Link>
                            <Link to="/plan">讀書計畫</Link>
                        </nav>

                        <div className="page-content">
                            <Routes>
                                {/* <Route path="/" element={<HomePage />} /> */}
                                <Route path="/" element={<Navigate to="/login" replace />} />
                                <Route path="/login" element={<LoginPage setIsLoggedIn={setIsLoggedIn} setUser={setUser} />} />
                                <Route path="/profile" element={<UserProfilePage user={user} setUser={setUser} setIsLoggedIn={setIsLoggedIn} />} />
                                <Route path="/register" element={<RegisterPage />} />
                                <Route path="/notebook" element={<NotebookDashboard />} />
                                <Route path="/camera" element={<CameraPage />} />
                                <Route path="/voice" element={<VoicePage />} />
                                <Route path="/rooms" element={<RoomsPage />} />
                                <Route path="/studyroom" element={<StudyRoom />} />
                                <Route path="/tracker" element={<TrackerPage />} />
                                <Route path="/plan" element={<PlanPage />} />
                                {/* <Route path="/knowledge" element={<KnowledgePage />} /> */}
                                <Route path="/forum" element={<ForumPage />} />
                                <Route path="/sharing" element={<SharingPage />} />
                                <Route path="/sharing/:id"element={<NoteDetail />} />
                            </Routes>
                        </div>
                    </div>
                </div>
            </Router>
        </QueryClientProvider>
    );
}

export default App;