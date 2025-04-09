// src/routes/AppRoutes.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "../components/Layout"; // 引入 Layout
import NotebookDashboard from "../pages/NotebookDashboard";
import NoteDetailPage from "../pages/NoteDetailPage";
import CameraPage from "../pages/CameraPage";
import VoicePage from "../pages/VoicePage";
import TrackerPage from "../pages/TrackerPage";
import KnowledgePage from "../pages/KnowledgePage";
import StudyRoomPage from "../pages/StudyRoomPage";
import ForumPage from "../pages/ForumPage";
import SharingPage from "../pages/SharingPage";
import PlanPage from "../pages/PlanPage";
import NotFoundPage from "../pages/NotFoundPage"; // 404 頁面（選擇性）

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<NotebookDashboard />} />
        <Route path="/note" element={<NoteDetailPage />} />
        <Route path="/camera" element={<CameraPage />} />
        <Route path="/voice" element={<VoicePage />} />
        <Route path="/tracker" element={<TrackerPage />} />
        <Route path="/knowledge" element={<KnowledgePage />} />
        <Route path="/studyroom" element={<StudyRoomPage />} />
        <Route path="/forum" element={<ForumPage />} />
        <Route path="/sharing" element={<SharingPage />} />
        <Route path="/plan" element={<PlanPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}