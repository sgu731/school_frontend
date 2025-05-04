import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import MermaidRenderer from "./common/MermaidRenderer";
import axios from "axios";

export default function NoteDetailPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { title: initialTitle, content: initialContent, date } = state || {};

  const [title, setTitle] = useState(initialTitle || "");
  const [content, setContent] = useState(initialContent || "");
  const [selectedText, setSelectedText] = useState("");
  const [toolbarPosition, setToolbarPosition] = useState(null);
  const [analysisResults, setAnalysisResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const contentRef = useRef();
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

        if (centerX < safePadding) {
          centerX = safePadding;
        } else if (centerX > viewportWidth - safePadding) {
          centerX = viewportWidth - safePadding;
        }

        setSelectedText(selected);
        setToolbarPosition({
          top: rect.top + window.scrollY - 50,
          left: centerX,
        });
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
      setAnalysisResults((prev) => [
        ...prev,
        {
          mode,
          content: analysis,
        },
      ]);
    } catch (err) {
      const errorMessage = `分析失敗：${err.response?.data?.error || err.message}`;
      setError(errorMessage);
      setAnalysisResults((prev) => [
        ...prev,
        {
          mode,
          content: `⚠️ ${errorMessage}`,
        },
      ]);
      setTimeout(() => setError(""), 2000);
    } finally {
      setLoading(false);
    }
  };

  const saveChanges = () => {
    const notes = JSON.parse(localStorage.getItem("importedNotes") || "[]");

    const analysisText = analysisResults
      .map((item) => {
        if (item.mode === "報告模式") {
          return `\n\n【${item.mode}】\n\`\`\`mermaid\n${item.content}\n\`\`\``;
        } else {
          return `\n\n【${item.mode}】\n${item.content}`;
        }
      })
      .join("");

    const fullContent = content + analysisText;

    const updated = notes.map((note) =>
      note.date === date
        ? { ...note, title, content: fullContent }
        : note
    );

    localStorage.setItem("importedNotes", JSON.stringify(updated));
    alert("✅ 筆記已儲存（包含分析結果）！");
    setAnalysisResults([]);
  };

  const deleteNote = () => {
    if (window.confirm("❗確定要刪除這篇筆記嗎？")) {
      const notes = JSON.parse(localStorage.getItem("importedNotes") || "[]");
      const updated = notes.filter((note) => note.date !== date);
      localStorage.setItem("importedNotes", JSON.stringify(updated));
      alert("✅ 筆記已刪除！");
      navigate("/notebook", { state: { reload: true } });
    }
  };

  const autoGrow = () => {
    if (contentRef.current) {
      contentRef.current.style.height = "auto";
      contentRef.current.style.height = `${contentRef.current.scrollHeight}px`;
    }
  };

  useEffect(() => {
    autoGrow();
  }, [content]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* 上方橘色橫條 */}
      <div className="bg-orange-400 p-4 flex items-center justify-between gap-4 relative">
        <Button variant="ghost" className="flex items-center gap-1" onClick={() => navigate("/notebook")}>
          <ArrowLeft size={18} />
        </Button>

        <div className="flex-1 text-center">
          <input
            ref={titleRef}
            className="text-lg font-bold text-center bg-transparent outline-none w-full"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <Button variant="destructive" size="sm" onClick={deleteNote}>
            刪除筆記
          </Button>
          <Button size="sm" onClick={saveChanges}>
            儲存變更
          </Button>
        </div>
      </div>

      {/* 筆記內容 + 分析 */}
      <div className="flex-1 overflow-auto p-6 bg-gray-50 relative">
        <textarea
          ref={contentRef}
          className="prose w-full max-w-full text-gray-800 border p-6 rounded bg-white min-h-[200px] outline-none resize-none"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="請輸入筆記內容..."
          onInput={autoGrow}
        />

        {/* 浮動選單 */}
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
                  className={`px-4 py-2 hover:bg-gray-100 ${
                    index < 2 ? "border-r border-gray-300" : ""
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* 分析結果呈現 */}
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
