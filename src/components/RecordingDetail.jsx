import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Save, Plus, CheckCircle } from "lucide-react";

export default function RecordingDetail() {
  const { state } = useLocation();
  const audioRef = useRef(null);
  const [speed, setSpeed] = useState(1);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [transcript, setTranscript] = useState(state?.text || "");
  const [translation, setTranslation] = useState(state?.translation || "");
  const [isPlaying, setIsPlaying] = useState(false);
  const [successMessage, setSuccessMessage] = useState(""); 

  const speedOptions = [0.5, 0.75, 1, 1.5, 2];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = speed;

    const updateTime = () => setPosition(audio.currentTime);
    const setFullDuration = () => setDuration(audio.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", setFullDuration);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", setFullDuration);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
    };
  }, [speed]);

  const skip = (sec) => {
    const audio = audioRef.current;
    if (audio) audio.currentTime += sec;
  };

  const format = (s) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  };

  const toggleSpeed = () => {
    const currentIndex = speedOptions.indexOf(speed);
    const nextIndex = (currentIndex + 1) % speedOptions.length;
    setSpeed(speedOptions[nextIndex]);
  };

  const handleSaveChanges = () => {
    // 儲存邏輯（可以加localStorage，這邊先單純展示成功）
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
      {/* 成功提示 */}
      {successMessage && (
        <div className="absolute top-4 right-4 bg-green-100 text-green-700 px-4 py-2 rounded-lg flex items-center shadow-lg z-50 animate-fade-in-down">
          <CheckCircle className="mr-2" size={20} />
          {successMessage}
        </div>
      )}

      <div className="flex justify-between items-center mb-2">
        <h1 className="text-xl font-bold">{state?.title || "錄音"}</h1>
        <span className="text-gray-500 text-sm">{state?.time}</span>
      </div>

      <audio ref={audioRef} src={state?.url} preload="metadata" />

      <div className="bg-gray-200 rounded p-4">
        {/* 進度條 */}
        <input
          type="range"
          min={0}
          max={duration}
          step={0.1}
          value={position}
          onChange={(e) => {
            audioRef.current.currentTime = e.target.value;
            setPosition(parseFloat(e.target.value));
          }}
          className="w-full h-2 rounded-full bg-gray-300 appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:bg-black [&::-webkit-slider-thumb]:rounded-full"
        />

        <div className="flex justify-between items-center my-2 text-sm text-gray-600">
          <span>{format(position)}</span>
          <span>{format(duration)}</span>
        </div>

        {/* 播放控制 */}
        <div className="flex items-center justify-center gap-4 text-xl">
          <Button onClick={() => skip(-15)}>⏪ 15</Button>
          <Button onClick={togglePlay}>
            {isPlaying ? "⏸️" : "▶️"}
          </Button>
          <Button onClick={() => skip(15)}>15 ⏩</Button>
        </div>

        {/* 播放速度切換 */}
        <div className="flex items-center gap-2 mt-4 justify-center">
          <label className="text-sm">播放速度</label>
          <Button onClick={toggleSpeed} className="text-sm">
            {speed}x
          </Button>
        </div>
      </div>

      {/* 空白間距 */}
      <div className="mt-6" />

      {/* 轉錄與翻譯內容 */}
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

      {/* 分隔線 + 儲存、加入按鈕 */}
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