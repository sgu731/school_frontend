import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

export default function NoteDetailPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { title, content } = state || {};
  const [selectedText, setSelectedText] = useState("");
  const [toolbarPosition, setToolbarPosition] = useState(null);
  const textRef = useRef();

  useEffect(() => {
    const handleMouseUp = () => {
      const selection = window.getSelection();
      const selected = selection?.toString();
      if (selected && selection.rangeCount > 0) {
        const rect = selection.getRangeAt(0).getBoundingClientRect();
        setSelectedText(selected);
        setToolbarPosition({
          top: rect.top + window.scrollY - 40,
          left: rect.left + window.scrollX + rect.width / 2,
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
    if (mode === "考試模式") {
      alert(`🔍 為選取文字生成重點整理 + 延伸補充：\n${selectedText}`);
    } else if (mode === "報告模式") {
      alert(`📊 將選取文字自動轉換為圖表：\n${selectedText}`);
    } else if (mode === "摘要") {
      alert(`📝 簡化選取內容摘要：\n${selectedText}`);
    }
  };

  return (
    <div className="p-6 relative">
      {/* 返回按鈕 */}
      <Button
        variant="ghost"
        className="mb-4 flex items-center gap-1"
        onClick={() => navigate("/")}
      >
        <ArrowLeft size={18} /> 返回筆記列表
      </Button>

      {/* 筆記內容 */}
      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      <div
        ref={textRef}
        className="prose max-w-full text-gray-800 border p-4 rounded bg-white"
        style={{ minHeight: "300px" }}
      >
        {content}
      </div>

      {selectedText && toolbarPosition && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute z-50 bg-white shadow-md border rounded flex gap-2 p-2"
          style={{
            top: toolbarPosition.top,
            left: toolbarPosition.left,
            transform: "translateX(-50%)",
          }}
        >
          <Button size="sm" onClick={() => handleMode("考試模式")}>考試模式</Button>
          <Button size="sm" onClick={() => handleMode("報告模式")}>報告模式</Button>
          <Button size="sm" variant="outline" onClick={() => handleMode("摘要")}>摘要</Button>
        </motion.div>
      )}
    </div>
  );
}