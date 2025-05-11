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
import ThreadDetailPage from './pages/ThreadDetailPage';
import NewPostPage from './pages/NewPostPage';
import SharingPage from './pages/SharingPage';
import NoteDetail from "./pages/NoteDetail";
import LoginPage from './pages/LoginPage';
import UserProfilePage from './pages/UserProfilePage';
import RegisterPage from './pages/RegisterPage';
import GalleryPage from './components/GalleryPage';
import NoteDetailPage from './components/NoteDetailPage';
import RecordingDetail from './components/RecordingDetail'; 
import TranscribePage from "./components/TranscribePage";
import RecordingPage from "./components/RecordingPage";
import ResetPasswordPage from './components/account/ResetPasswordPage';
import ForgotPasswordPage from './components/account/ForgotPasswordPage';
import StudyTimerTestPage from './pages/StudyTimerTestPage';

const queryClient = new QueryClient();

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [showEditNameModal, setShowEditNameModal] = useState(false);
    const [newName, setNewName] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
          fetch('http://localhost:5000/profile', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          })
            .then(res => res.json())
            .then(data => {
              if (data.user) {
                setIsLoggedIn(true);
                setUser(data.user);
              }
            })
            .catch(err => {
              console.error('取得使用者資料失敗', err);
            });
        }
      }, []);      

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
                            <Link to="/study-test">讀書計時測試</Link>
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
                                <Route path="/gallery" element={<GalleryPage />} />
                                <Route path="/voice" element={<VoicePage />} />
                                <Route path="/rooms" element={<RoomsPage />} />
                                <Route path="/studyroom" element={<StudyRoom />} />
                                <Route path="/tracker" element={<TrackerPage />} />
                                <Route path="/plan" element={<PlanPage />} />
                                {/* <Route path="/knowledge" element={<KnowledgePage />} /> */}
                                <Route path="/forum" element={<ForumPage />} />
                                <Route path="/forum/:id" element={<ThreadDetailPage />} />
                                <Route path="/forum/new" element={<NewPostPage />} />
                                <Route path="/sharing" element={<SharingPage />} />
                                <Route path="/sharing/:id"element={<NoteDetail />} />
                                <Route path="/note-detail" element={<NoteDetailPage />} />
                                <Route path="/recording-detail" element={<RecordingDetail />} />
                                <Route path="/transcribe" element={<TranscribePage />} />
                                <Route path="/recording" element={<RecordingPage />} />
                                <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
                                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                                <Route path="/study-test" element={<StudyTimerTestPage />} />
                            </Routes>
                        </div>
                    </div>
                </div>
            </Router>
        </QueryClientProvider>
    );
}

export default App;