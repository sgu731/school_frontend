import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import './App.css';
import HomePage from './pages/HomePage';
import RoomsPage from './pages/RoomsPage';

function App() {
    return (
        <Router>
            <div className="App">
                <header className="App-header">
                    <nav>
                        <Link to="/">主頁</Link> | <Link to="/rooms">自習室</Link>
                    </nav>
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/rooms" element={<RoomsPage />} />
                    </Routes>
                </header>
            </div>
        </Router>
    );
}
export default App;