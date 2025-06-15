import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Eye } from "lucide-react"; // 添加 Eye 圖標用於展開
import MermaidRenderer from "./common/MermaidRenderer";
import axios from "axios";
import NoteEditor from "./NoteEditor";
import "./NoteDetailPage.css";
import { useTranslation } from 'react-i18next'; // 導入 useTranslation

export default function NoteDetailPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { title: initialTitle, content: initialContent } = state || {};
  const { t, i18n } = useTranslation('noteDetailPage'); // 指定 noteDetailPage 命名空間

  const isValidTipTapJson = (data) => {
    return data?.editor?.type === "doc" && Array.isArray(data?.editor?.content);
  };

  const parsed = (() => {
    try {
      return typeof initialContent === "string" ? JSON.parse(initialContent) : initialContent;
    } catch {
      return null;
    }
  })();

  const [title, setTitle] = useState(initialTitle || "");
  const [editorContent, setEditorContent] = useState(() =>
    isValidTipTapJson(parsed)
      ? parsed.editor
      : { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: initialContent || "" }] }] }
  );
  const [analysisResults, setAnalysisResults] = useState(() =>
    isValidTipTapJson(parsed) ? parsed.analysis ?? [] : []
  );
  const [selectedText, setSelectedText] = useState("");
  const [toolbarPosition, setToolbarPosition] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedAnalysis, setSelectedAnalysis] = useState(null); // 控制展開的分析內容
  const titleRef = useRef();
  const [isTranslateMenuOpen, setIsTranslateMenuOpen] = useState(false);
  const toolbarRef = useRef();
  const editorContainerRef = useRef();

  useEffect(() => {
    const handleMouseUp = (e) => {
      if (titleRef.current && titleRef.current.contains(e.target)) {
        setSelectedText("");
        setToolbarPosition(null);
        return;
      }

      const selection = window.getSelection();
      const selected = selection?.toString();
      if (selected && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        let centerX = (rect.left + rect.right) / 2;
        const safePadding = 100;
        if (centerX < safePadding) centerX = safePadding;
        else if (centerX > viewportWidth - safePadding) centerX = viewportWidth - safePadding;
        setSelectedText(selected);
        setToolbarPosition({ top: rect.top + window.scrollY - 60, left: centerX });
      } else {
        setSelectedText("");
        setToolbarPosition(null);
        setIsTranslateMenuOpen(false);
      }
    };

    const handleClickOutside = (e) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target)) {
        setIsTranslateMenuOpen(false);
      }
    };

    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const handleMode = async (mode) => {
    if (!selectedText) return;
    const isEnglish = i18n.language === 'en';
    const promptMap = {
      [t('examMode')]: isEnglish
        ? `Please organize the following content into a bullet-point list, provide a brief explanation for each point, and optionally include possible multiple-choice or true/false questions:\n\n${selectedText}`
        : `請將以下內容整理成條列式重點，並提供每點的簡要補充說明，你也可以補充可能會出現的選擇題以及是非題等等，如果內容是英文，請出英文題目：\n\n${selectedText}`,
      [t('reportMode')]: isEnglish
        ? `Please convert the following content into a report chart using Mermaid syntax, and append the Mermaid website link for the user to paste the syntax:\n\n${selectedText}`
        : `請將以下內容轉換成一份報告圖表，你可以使用 mermaid 語法，並在最後補上 mermaid 網站給使用者貼上語法：\n\n${selectedText}`,
      [t('summary')]: isEnglish
        ? `Please condense the following content into a concise summary:\n\n${selectedText}`
        : `請將以下內容濃縮成簡潔摘要：\n\n${selectedText}`,
    };

    const token = localStorage.getItem("token");
    setLoading(true);
    setError("");

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/ai/analyze`,
        { text: selectedText, prompt: promptMap[mode] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const analysis = response.data.analysis || t('noResponseContent');
      setAnalysisResults((prev) => [...prev, { mode, content: analysis }]);
    } catch (err) {
      const errorMessage = t('analysisFailed', { error: err.response?.data?.error || err.message });
      setError(errorMessage);
      setAnalysisResults((prev) => [...prev, { mode, content: `⚠️ ${errorMessage}` }]);
      setTimeout(() => setError(""), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleTranslate = async (language) => {
    if (!selectedText) return;
    const prompt = t('translatePrompt', { language: language, text: selectedText });

    const token = localStorage.getItem("token");
    setLoading(true);
    setError("");
    setIsTranslateMenuOpen(false);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/ai/analyze`,
        { text: selectedText, prompt },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const translation = response.data.analysis || t('noResponseContent');
      setAnalysisResults((prev) => [...prev, { mode: t('translationMode', { language: language }), content: translation }]);
    } catch (err) {
      const errorMessage = t('translationFailed', { error: err.response?.data?.error || err.message });
      setError(errorMessage);
      setAnalysisResults((prev) => [...prev, { mode: t('translationMode', { language: language }), content: `⚠️ ${errorMessage}` }]);
      setTimeout(() => setError(""), 2000);
    } finally {
      setLoading(false);
    }
  };

  const saveChanges = async () => {
    const token = localStorage.getItem("token");
    const authHeader = { headers: { Authorization: `Bearer ${token}` } };
    const now = new Date().toISOString();
    const fullContent = JSON.stringify({ editor: editorContent, analysis: analysisResults });

    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/note/${state.id}`,
        { title, content: fullContent, updatedAt: now },
        authHeader
      );
      alert(t('noteSaved'));
    } catch (err) {
      console.error(t('noteSaveFailed'), err);
      alert(t('noteSaveError'));
    }
  };

  const deleteNote = async () => {
    if (!window.confirm(t('confirmDelete'))) return;
    const token = localStorage.getItem("token");
    const authHeader = { headers: { Authorization: `Bearer ${token}` } };

    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/note/${state.id}`, authHeader);
      alert(t('noteDeleted'));
      navigate("/notebook", { state: { reload: true } });
    } catch (err) {
      console.error(t('noteDeleteFailed'), err);
      alert(t('noteDeleteError'));
    }
  };

  const shareNote = async () => {
    const token = localStorage.getItem("token");
    const authHeader = { headers: { Authorization: `Bearer ${token}` } };
    const author = JSON.parse(atob(token.split('.')[1])).name || "Anonymous"; // 無實際效果
    const content = JSON.stringify({ editor: editorContent, analysis: analysisResults });

    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/notes`,
        { title, author, content },
        authHeader
      );
      alert(t('noteSharedSuccessfully'));
    } catch (err) {
      console.error(t('noteShareFailed'), err);
      alert(t('noteShareError'));
    }
  };  

  const handleViewAnalysis = (item) => {
    setSelectedAnalysis(item);
  };

  const closeAnalysisModal = () => {
    setSelectedAnalysis(null);
  };

  return (
    <div className="note-detail-page flex flex-col min-h-screen app-container">
      <div className="note-header">
        <button
          className="note-btn note-btn--back flex items-center gap-1"
          onClick={() => navigate("/notebook")}
        >
          <ArrowLeft size={18} />
        </button>
        <input
          ref={titleRef}
          className="note-title-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button className="note-btn note-btn--danger" onClick={deleteNote}>
          {t('deleteNote')}
        </button>
        <button className="note-btn note-btn--success" onClick={saveChanges}>
          {t('saveChanges')}
        </button>
        <button className="note-btn note-btn--primary" onClick={shareNote}>
          {t('shareNote')}
        </button>        
      </div>

      <div className="note-content">
        <div className="note-layout">
          <div className="note-editor-container" ref={editorContainerRef}>
            <NoteEditor value={editorContent} onChange={setEditorContent} />
          </div>
          <div className="note-analysis-sidebar">
            {analysisResults.length > 0 && (
              <div className="note-analysis-timeline">
                {analysisResults.map((item, index) => (
                  <div key={index} className="note-analysis-card" onClick={() => handleViewAnalysis(item)}>
                    <h3 className="note-analysis-card__title">{item.mode}</h3>
                    <p className="note-analysis-card__preview">
                      {item.content.length > 100 ? item.content.slice(0, 100) + "..." : item.content}
                    </p>
                    <button className="note-analysis-view-btn">
                      <Eye size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {selectedText && toolbarPosition && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="note-toolbar-wrapper"
            ref={toolbarRef}
            style={{
              top: toolbarPosition.top,
              left: toolbarPosition.left,
              transform: "translateX(-50%)",
            }}
          >
            <div className="note-toolbar">
              {[t('examMode'), t('reportMode'), t('summary')].map((mode) => (
                <button
                  key={mode}
                  onClick={() => handleMode(mode)}
                  className="note-toolbar__button"
                >
                  {mode}
                </button>
              ))}
              <div className="relative">
                <button
                  className="note-toolbar__button"
                  onClick={() => setIsTranslateMenuOpen((prev) => !prev)}
                >
                  {t('translate')}
                </button>
                {isTranslateMenuOpen && (
                  <div className="note-translate-menu">
                    {[
                      t('english'),
                      t('traditionalChinese'),
                      t('simplifiedChinese'),
                      t('japanese'),
                      t('korean'),
                      t('french')
                    ].map((lang) => (
                      <button
                        key={lang}
                        onClick={() => handleTranslate(lang)}
                        className="note-translate-menu__item"
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {loading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="note-loading"
          >
            <svg
              className="note-loading__spinner"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </motion.div>
        )}

        {selectedAnalysis && (
          <div className="note-analysis-modal" onClick={closeAnalysisModal}>
            <div className="note-analysis-modal-content" onClick={(e) => e.stopPropagation()}>
              <h3 className="note-analysis-modal-title">{selectedAnalysis.mode}</h3>
              {selectedAnalysis.mode === t('reportMode') ? (
                <>
                  {/* <MermaidRenderer chart={selectedAnalysis.content} /> */}
                  <pre className="note-analysis-card__code">
                    {selectedAnalysis.content}
                  </pre>
                </>
              ) : (
                <pre className="note-analysis-card__content">{selectedAnalysis.content}</pre>
              )}
              <button className="note-analysis-close-btn" onClick={closeAnalysisModal}>
                {t('close')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}