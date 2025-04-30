import React from "react";
import { Button } from "../components/ui/button";

export default function Records({ recordings, importNote, deleteRecording, setView, onSelect }) {
  return (
    <div className="mt-6">
      <Button onClick={() => setView(null)} className="mb-4">返回</Button>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recordings.map((rec) => (
          <div
            key={rec.id}
            onClick={() => onSelect && onSelect(rec)}
            className="p-4 border rounded-xl shadow-sm bg-white hover:shadow-md transition cursor-pointer"
          >
            <div className="mb-2">
              <p className="text-lg font-bold">{rec.title || "未命名"}</p>
              <p className="text-sm text-gray-500">🕒 {rec.time || "未知時間"}</p>
              <p className="text-sm text-gray-500">⏱ 時長：{rec.duration || "未知"}</p>
            </div>
            <p className="text-sm text-gray-600 line-clamp-2">
              {rec.text ? rec.text.slice(0, 100) + "..." : "（無文字內容）"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
