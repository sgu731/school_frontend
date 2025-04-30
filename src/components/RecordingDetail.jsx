import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Save, Plus, CheckCircle } from "lucide-react";

export default function RecordingDetail() {
  const { state } = useLocation();
  const audioRef = useRef(null);
  const [transcript, setTranscript] = useState(state?.text || "");
  const [translation, setTranslation] = useState(state?.translation || "");
  const [successMessage, setSuccessMessage] = useState("");
  const [speed, setSpeed] = useState(1);
  const speedOptions = [0.5, 0.75, 1, 1.5, 2];

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.playbackRate = speed;
    }
  }, [speed]);

  const skip = (sec) => {
    const audio = audioRef.current;
    if (audio) audio.currentTime += sec;
  };

  const toggleSpeed = () => {
    const currentIndex = speedOptions.indexOf(speed);
    const nextIndex = (currentIndex + 1) % speedOptions.length;
    setSpeed(speedOptions[nextIndex]);
  };

  const handleSaveChanges = () => {
    setSuccessMessage("儲存變更成功！");
    setTimeout(() => setSuccessMessage(""), 2000);
  };

  const handleAddNote = () => {
    const now = new Date().toISOString();
    const fullContent = `${transcript}\n\n${translation}`;
    const newNote = {
      id: Date.now(),
      title: state?.title || "錄音筆記",
      content: fullContent,
      date: now,
      updatedAt: now,
    };

    const existingNotes = JSON.parse(localStorage.getItem("importedNotes") || "[]");
    const updatedNotes = [newNote, ...existingNotes];
    localStorage.setItem("importedNotes", JSON.stringify(updatedNotes));

    setSuccessMessage("已成功加入筆記！");
    setTimeout(() => setSuccessMessage(""), 2000);
  };

  return (
    <div className="p-6 relative">
      {successMessage && (
        <div className="absolute top-4 right-4 bg-green-100 text-green-700 px-4 py-2 rounded-lg flex items-center shadow-lg z-50 animate-fade-in-down">
          <CheckCircle className="mr-2" size={20} />
          {successMessage}
        </div>
      )}

      <div className="flex items-baseline mb-2">
        <h2 className="text-xl font-bold mr-2">{state?.title || "錄音"}</h2>
        <span className="!text-[10px] !text-gray-300">{state?.time}</span>
      </div>

      <audio ref={audioRef} controls src={state?.url} className="w-full my-2" />

      {/* 播放附加控制功能 */}
      <div className="flex items-center justify-center gap-4 text-sm mt-4">
        <Button size="sm" onClick={() => skip(-5)}>⏮️ 倒轉5秒</Button>
        <Button size="sm" onClick={() => skip(5)}>快轉5秒 ⏭️</Button>
        <Button size="sm" onClick={toggleSpeed}>播放速度：{speed}x</Button>
      </div>

      {/* 文字區塊 */}
      <div className="mt-6">
        <label className="block text-sm font-bold mb-1">轉錄文字：</label>
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          rows={6}
          className="w-full border rounded p-2"
        />

        <label className="block text-sm font-bold mt-4 mb-1">翻譯內容：</label>
        <textarea
          value={translation}
          onChange={(e) => setTranslation(e.target.value)}
          rows={6}
          className="w-full border rounded p-2"
        />
      </div>

      {/* 儲存與加入筆記 */}
      <div className="border-t pt-6 mt-6 flex justify-between">
        <Button variant="default" onClick={handleSaveChanges}>
          <Save size={16} className="mr-2" />儲存變更
        </Button>
        <Button variant="outline" onClick={handleAddNote}>
          <Plus size={16} className="mr-2" />加入筆記
        </Button>
      </div>
    </div>
  );
}