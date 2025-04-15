import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import React from 'react';
import './App.css';

import HomePage from './pages/HomePage';
import NotebookDashboard from './pages/NotebookDashboard';
import NoteDetailPage from './pages/NoteDetailPage';
import CameraPage from './pages/CameraPage';
import VoicePage from './pages/VoicePage';
import RoomsPage from './pages/RoomsPage';
import TrackerPage from './pages/TrackerPage';
import PlanPage from './pages/PlanPage';
import KnowledgePage from './pages/KnowledgePage';
import ForumPage from './pages/ForumPage';
import SharingPage from './pages/SharingPage';

function App() {
  return (
    <Router>
      <div className="app-container">
        {/* 頂部橘色橫條 */}
        <header className="top-bar">
          <div className="logo">逮救補</div>
          <input type="text" placeholder="搜尋" className="search-bar" />
          <div className="user-icon">👤</div>
        </header>

        {/* 左側選單 + 右側內容 */}
        <div className="main-content">
          <nav className="side-menu">
            <Link to="/">登入</Link>
            <Link to="/notebook">你的筆記</Link>
            <Link to="/camera">相機</Link>
            <Link to="/voice">語音</Link>
            <Link to="/tracker">成效追蹤</Link>
            <Link to="/knowledge">知識庫</Link>
            <Link to="/rooms">自習室</Link>
            <Link to="/forum">討論區</Link>
            <Link to="/sharing">筆記分享</Link>
            <Link to="/plan">讀書計畫</Link>
            <Link to="/note-detail">筆記細節</Link>
          </nav>

          <div className="page-content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/notebook" element={<NotebookDashboard />} />
              <Route path="/notebook/:index" element={<NoteDetailPage />} />
              <Route path="/camera" element={<CameraPage />} />
              <Route path="/voice" element={<VoicePage />} />
              <Route path="/rooms" element={<RoomsPage />} />
              <Route path="/tracker" element={<TrackerPage />} />
              <Route path="/plan" element={<PlanPage />} />
              <Route path="/knowledge" element={<KnowledgePage />} />
              <Route path="/forum" element={<ForumPage />} />
              <Route path="/sharing" element={<SharingPage />} />
              <Route path="/note-detail" element={<NoteDetailPage />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
