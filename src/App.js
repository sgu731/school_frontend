import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import './App.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import axios from 'axios';
import { useTranslation } from 'react-i18next'; // 導入 useTranslation
import i18n from './i18n'; // 假設你創建了 i18n.js 配置文件

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
import TranscribePage from "./components/TranscribePage";
import RecordingPage from "./components/RecordingPage";
import ForgotPasswordPage from './components/account/ForgotPasswordPage';

const queryClient = new QueryClient();

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [showEditNameModal, setShowEditNameModal] = useState(false);
    const [newName, setNewName] = useState('');
    const [isLoading, setIsLoading] = useState(true); // 新增載入狀態
    const { t } = useTranslation('common'); // 指定 common 命名空間

    // 檢查 token 並恢復使用者狀態
    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const response = await axios.get(`${process.env.REACT_APP_API_URL}/profile`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });
                    if (response.data.success) {
                        setUser(response.data.user);
                        setIsLoggedIn(true);
                    } else {
                        localStorage.removeItem('token');
                        setIsLoggedIn(false);
                        setUser(null);
                    }
                } catch (err) {
                    console.error('Check auth error:', err);
                    localStorage.removeItem('token');
                    setIsLoggedIn(false);
                    setUser(null);
                }
            }
            setIsLoading(false);
        };

        checkAuth();
        // 檢查是否需要跳轉到登入頁面
        if (!isLoading) {
            const currentPath = window.location.pathname;
            const publicPaths = ['/login', '/register'];
            if (!isLoggedIn && !publicPaths.includes(currentPath)) {
                window.location.replace('/login'); // 使用 window.location.replace 替代 useNavigate
            }
        }
    }, [isLoggedIn, isLoading]); // 監聽 isLoggedIn 和 isLoading 的變化

    // 登出函數
    const handleLogout = () => {
        localStorage.removeItem('token');
        setIsLoggedIn(false);
        setUser(null);
    };

    // 語言切換函數
    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    // 渲染載入狀態
    if (isLoading) {
        return <div>{t('loading')}</div>; // 使用翻譯的載入文字
    }

    return (
        <QueryClientProvider client={queryClient}>
            <Router>
                <Routes>
                    {/* 獨立頁面：不需要側欄和頂部橫條 */}
                    <Route path="/login" element={<LoginPage setIsLoggedIn={setIsLoggedIn} setUser={setUser} />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    {/* 其他路由：包含側欄和頂部橫條 */}
                    <Route
                        path="*"
                        element={
                            <div className="app-container">
                                {/* 頂部橘色橫條 */}
                                <header className="top-bar">
                                    <div className="logo">{t('appTitle')}</div>
                                    <div className="user-icon">
                                        {isLoggedIn ? (
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <Link to="/profile" className="user-link" style={{ display: 'flex', alignItems: 'center' }}>
                                                    {user?.avatar ? (
                                                        <img
                                                            src={`${process.env.REACT_APP_API_URL}${user.avatar}`}
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
                                                    {t('hiUser', { name: user?.name || t('user') })}
                                                </Link>
                                                <button onClick={handleLogout} style={{ marginLeft: '10px', cursor: 'pointer' }}>
                                                    {t('logout')}
                                                </button>
                                                {/* 語言切換按鈕 */}
                                                <div className="language-switcher">
                                                    <button onClick={() => changeLanguage('en')} style={{ marginLeft: '10px' }}>
                                                        EN
                                                    </button>
                                                    <button onClick={() => changeLanguage('zh')} style={{ marginLeft: '5px' }}>
                                                        中文
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <Link to="/login" className="user-link">👤 {t('login')}</Link>
                                        )}
                                    </div>
                                </header>

                                {/* 左側選單 + 右側內容 */}
                                <div className="main-content">
                                    <nav className="side-menu">
                                        {/* <Link to="/">登入</Link> */}
                                        <Link to="/notebook">{t('yourNotes')}</Link>
                                        <Link to="/camera">{t('camera')}</Link>
                                        <Link to="/voice">{t('voice')}</Link>
                                        <Link to="/tracker">{t('tracker')}</Link>
                                        {/* <Link to="/knowledge">知識庫</Link> */}
                                        <Link to="/rooms">{t('rooms')}</Link>
                                        <Link to="/forum">{t('forum')}</Link>
                                        <Link to="/sharing">{t('sharing')}</Link>
                                        <Link to="/plan">{t('plan')}</Link>
                                    </nav>

                                    <div className="page-content">
                                        <Routes>
                                            {/* <Route path="/" element={<HomePage />} /> */}
                                            <Route path="/" element={<Navigate to="/login" replace />} />
                                            <Route
                                                path="/profile"
                                                element={isLoggedIn ? <UserProfilePage user={user} setUser={setUser} setIsLoggedIn={setIsLoggedIn} /> : <Navigate to="/login" replace />}
                                            />
                                            <Route
                                                path="/notebook"
                                                element={isLoggedIn ? <NotebookDashboard /> : <Navigate to="/login" replace />}
                                            />
                                            <Route
                                                path="/camera"
                                                element={isLoggedIn ? <CameraPage /> : <Navigate to="/login" replace />}
                                            />
                                            <Route
                                                path="/gallery"
                                                element={isLoggedIn ? <GalleryPage /> : <Navigate to="/login" replace />}
                                            />
                                            <Route
                                                path="/voice"
                                                element={isLoggedIn ? <VoicePage /> : <Navigate to="/login" replace />}
                                            />
                                            <Route
                                                path="/rooms"
                                                element={isLoggedIn ? <RoomsPage /> : <Navigate to="/login" replace />}
                                            />
                                            <Route
                                                path="/studyroom"
                                                element={isLoggedIn ? <StudyRoom /> : <Navigate to="/login" replace />}
                                            />
                                            <Route
                                                path="/tracker"
                                                element={isLoggedIn ? <TrackerPage /> : <Navigate to="/login" replace />}
                                            />
                                            <Route
                                                path="/plan"
                                                element={isLoggedIn ? <PlanPage /> : <Navigate to="/login" replace />}
                                            />
                                            {/* <Route path="/knowledge" element={<KnowledgePage />} /> */}
                                            <Route
                                                path="/forum"
                                                element={isLoggedIn ? <ForumPage /> : <Navigate to="/login" replace />}
                                            />
                                            <Route
                                                path="/forum/:id"
                                                element={isLoggedIn ? <ThreadDetailPage /> : <Navigate to="/login" replace />}
                                            />
                                            <Route
                                                path="/forum/new"
                                                element={isLoggedIn ? <NewPostPage /> : <Navigate to="/login" replace />}
                                            />
                                            <Route
                                                path="/sharing"
                                                element={isLoggedIn ? <SharingPage /> : <Navigate to="/login" replace />}
                                            />
                                            <Route
                                                path="/sharing/:id"
                                                element={isLoggedIn ? <NoteDetail /> : <Navigate to="/login" replace />}
                                            />
                                            <Route
                                                path="/note-detail"
                                                element={isLoggedIn ? <NoteDetailPage /> : <Navigate to="/login" replace />}
                                            />
                                            <Route
                                                path="/transcribe"
                                                element={isLoggedIn ? <TranscribePage /> : <Navigate to="/login" replace />}
                                            />
                                            <Route
                                                path="/recording"
                                                element={isLoggedIn ? <RecordingPage /> : <Navigate to="/login" replace />}
                                            />
                                        </Routes>
                                    </div>
                                </div>
                            </div>
                        }
                    />
                </Routes>
            </Router>
        </QueryClientProvider>
    );
}

export default App;