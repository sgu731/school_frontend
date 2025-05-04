import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

export default function NoteDetailPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { title: initialTitle, content: initialContent, date } = state || {};

  const [title, setTitle] = useState(initialTitle || "");
  const [content, setContent] = useState(initialContent || "");
  const [selectedText, setSelectedText] = useState("");
  const [toolbarPosition, setToolbarPosition] = useState(null);
  const [popupMode, setPopupMode] = useState(null);

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

  const handleMode = (mode) => {
    if (!selectedText) return;
    setPopupMode(mode);
  };

  const saveChanges = () => {
    const notes = JSON.parse(localStorage.getItem("importedNotes") || "[]");
    const updated = notes.map((note) =>
      note.date === date
        ? { ...note, title, content }
        : note
    );
    localStorage.setItem("importedNotes", JSON.stringify(updated));
    alert("✅ 筆記已儲存！");
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
        {/* 左邊返回 */}
        <Button
          variant="ghost"
          className="flex items-center gap-1"
          onClick={() => navigate("/notebook")}
        >
          <ArrowLeft size={18} />
        </Button>

        {/* 中間置中標題 */}
        <div className="flex-1 text-center">
          <input
            ref={titleRef}
            className="text-lg font-bold text-center bg-transparent outline-none w-full"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* 右側儲存＋刪除按鈕 */}
        <div className="flex gap-2">
          <Button variant="destructive" size="sm" onClick={deleteNote}>
            刪除筆記
          </Button>
          <Button size="sm" onClick={saveChanges}>
            儲存變更
          </Button>
        </div>
      </div>

      {/* 筆記內容 */}
      <div className="flex-1 overflow-auto p-6 bg-gray-50 relative">
        <textarea
          ref={contentRef}
          className="prose w-full max-w-full text-gray-800 border p-6 rounded bg-white min-h-[200px] outline-none resize-none"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="請輸入筆記內容..."
          onInput={autoGrow}
        />

        {/* 浮動選單（智慧浮動＋邊界自適應） */}
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
            {/* 小箭頭 */}
            <div className="w-full flex justify-center">
              <div className="w-3 h-3 rotate-45 bg-white border-l border-t border-gray-300 -mb-1" />
            </div>

            {/* 選單卡片 */}
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

        {/* Popup 彈窗 */}
        {popupMode && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
            <div className="bg-white p-6 rounded shadow-lg w-96 relative">
              <h2 className="text-xl font-bold mb-4">{popupMode}</h2>
              <div className="text-gray-700 whitespace-pre-wrap mb-4">{selectedText}</div>
              <Button
                onClick={() => setPopupMode(null)}
                className="absolute top-2 right-2"
                size="icon"
                variant="ghost"
              >
                ✖
              </Button>
              <div className="flex justify-end">
                <Button onClick={() => setPopupMode(null)}>關閉</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
