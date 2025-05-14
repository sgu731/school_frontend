import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import MermaidRenderer from "./common/MermaidRenderer";
import axios from "axios";
import NoteEditor from "./NoteEditor";
import "./NoteDetailPage.css";

export default function NoteDetailPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { title: initialTitle, content: initialContent } = state || {};

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
  const titleRef = useRef();

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
        setToolbarPosition({ top: rect.top + window.scrollY - 50, left: centerX });
      } else {
        setSelectedText("");
        setToolbarPosition(null);
      }
    };

    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, []);

  const handleMode = async (mode) => {
    if (!selectedText) return;
    const promptMap = {
      "考試模式": `請將以下內容整理成條列式重點，並提供每點的簡要補充說明：\n\n${selectedText}`,
      "報告模式": `請將以下內容轉換成一份報告圖表：\n\n${selectedText}`,
      "摘要": `請將以下內容濃縮成簡潔摘要：\n\n${selectedText}`,
    };

    const token = localStorage.getItem("token");
    setLoading(true);
    setError("");

    try {
      const response = await axios.post(
        "http://localhost:5000/api/ai/analyze",
        { text: selectedText, prompt: promptMap[mode] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const analysis = response.data.analysis || "⚠️ 無回應內容";
      setAnalysisResults((prev) => [...prev, { mode, content: analysis }]);
    } catch (err) {
      const errorMessage = `分析失敗：${err.response?.data?.error || err.message}`;
      setError(errorMessage);
      setAnalysisResults((prev) => [...prev, { mode, content: `⚠️ ${errorMessage}` }]);
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
      alert("✅ 筆記已儲存（包含分析結果）！");
      setAnalysisResults([]);
    } catch (err) {
      console.error("筆記儲存失敗", err);
      alert("❌ 儲存筆記失敗！");
    }
  };

  const deleteNote = async () => {
    if (!window.confirm("❗確定要刪除這篇筆記嗎？")) return;
    const token = localStorage.getItem("token");
    const authHeader = { headers: { Authorization: `Bearer ${token}` } };

    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/note/${state.id}`, authHeader);
      alert("✅ 筆記已刪除！");
      navigate("/notebook", { state: { reload: true } });
    } catch (err) {
      console.error("筆記刪除失敗", err);
      alert("❌ 刪除筆記失敗！");
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-orange-400 p-4 flex items-center justify-between gap-4 relative">
        <button className="note-btn flex items-center gap-1" onClick={() => navigate("/notebook")}>
          <ArrowLeft size={18} />
        </button>

        {/* ✅ 中央區塊：標題 + 按鈕並排 */}
        <div className="flex-1 flex justify-center">
          <div className="flex items-center gap-4 w-full max-w-[700px]">
            <input
              ref={titleRef}
              className="flex-1 text-lg font-bold text-center bg-transparent outline-none"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <button className="note-btn" onClick={deleteNote}>
              刪除筆記
            </button>
            <button className="note-btn" onClick={saveChanges}>
              儲存變更
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 bg-gray-50 relative">
        <NoteEditor value={editorContent} onChange={setEditorContent} />

        {selectedText && toolbarPosition && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute z-50"
            style={{
              top: toolbarPosition.top,
              left: toolbarPosition.left,
              transform: "translateX(-50%) translateY(-8px)",
            }}
          >
            <div className="w-full flex justify-center">
              <div className="w-3 h-3 rotate-45 bg-white border-l border-t border-gray-300 -mb-1" />
            </div>
            <div className="flex rounded-md shadow-md border bg-white text-sm font-medium overflow-hidden">
              {["考試模式", "報告模式", "摘要"].map((mode, index) => (
                <button
                  key={mode}
                  onClick={() => handleMode(mode)}
                  className={`note-btn ${index < 2 ? "border-r border-gray-300" : ""}`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {analysisResults.length > 0 && (
          <div className="mt-6 space-y-4">
            {analysisResults.map((item, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-md p-4">
                <h3 className="font-semibold mb-2 text-orange-600">{item.mode}</h3>
                {item.mode === "報告模式" ? (
                  <>
                    <MermaidRenderer chart={item.content} />
                    <pre className="whitespace-pre-wrap text-sm text-green-700 font-mono bg-gray-100 p-3 rounded mt-4">
                      {item.content}
                    </pre>
                  </>
                ) : (
                  <pre className="whitespace-pre-wrap text-sm text-gray-800">{item.content}</pre>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}