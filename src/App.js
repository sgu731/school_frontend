import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import './App.css';
import HomePage from './pages/HomePage';
import RoomsPage from './pages/RoomsPage';
import TrackerPage from './pages/TrackerPage';
import PlanPage from './pages/PlanPage';

function App() {
    return (
        <Router>
            <div className="App">
                <header className="App-header">
                    <nav>
                        <Link to="/">主頁</Link> | <Link to="/rooms">自習室</Link>
                        |<Link to="/tracker">成效追蹤</Link>
                        |<Link to="/plan">讀書計畫</Link>
                    </nav>
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/rooms" element={<RoomsPage />} />
                        <Route path="/tracker" element={<TrackerPage />} />
                        <Route path="/plan" element={<PlanPage />} />
                    </Routes>
                </header>
            </div>
        </Router>
    );
}

export default App;
