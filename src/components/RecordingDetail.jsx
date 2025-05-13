import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Save, Plus, CheckCircle } from "lucide-react";
import axios from "axios";

export default function RecordingDetail() {
  const { state } = useLocation();
  const token = localStorage.getItem("token");
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const audioRef = useRef(null);
  const [transcript, setTranscript] = useState(state?.text || "");
  const [translation, setTranslation] = useState(state?.translation || "");
  const [successMessage, setSuccessMessage] = useState("");
  const [speed, setSpeed] = useState(1);
  const speedOptions = [0.5, 0.75, 1, 1.5, 2];


  const formatDate = (isoString) => {
    const date = new Date(isoString);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const h = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    return `${y}/${m}/${d} ${h}:${min}`;
  };

  useEffect(() => {
    if (!state?.id) return;

    const fetchRecording = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/recordings/${state.id}`, authHeader);
        const data = res.data.recording;
        setTranscript(data.text || "");
        setTranslation(data.translation || "");
      } catch (err) {
        console.error("載入錄音失敗", err);
      }
    };

    fetchRecording();
  }, [state?.id]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  }, [speed]);

  const skip = (sec) => {
    if (audioRef.current) {
      audioRef.current.currentTime += sec;
    }
  };

  const toggleSpeed = () => {
    const currentIndex = speedOptions.indexOf(speed);
    const nextIndex = (currentIndex + 1) % speedOptions.length;
    setSpeed(speedOptions[nextIndex]);
  };

  const handleSaveChanges = async () => {
    try {
      await axios.put(
        `http://localhost:5000/api/recordings/${state.id}`,
        {
          title: state?.title,
          text: transcript,
          translation,
        },
        authHeader
      );

      setSuccessMessage("儲存變更成功！");
      setTimeout(() => setSuccessMessage(""), 2000);
    } catch (err) {
      console.error("更新錄音失敗", err);
    }
  };

  const handleAddNote = async () => {
    try {
      await axios.post(
        "http://localhost:5000/api/note",
        {
          title: state?.title,
          content: `${transcript}\n\n${translation}`,
        },
        authHeader
      );
      setSuccessMessage("已成功加入筆記！");
      setTimeout(() => setSuccessMessage(""), 2000);
    } catch (err) {
      console.error("新增筆記失敗", err);
    }
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
        <span className="!text-[10px] !text-gray-300">{formatDate(state?.time)}</span>
      </div>

      <audio ref={audioRef} controls src={state?.url} className="w-full my-2" />

      <div className="flex items-center justify-center gap-4 text-sm mt-4">
        <Button size="sm" onClick={() => skip(-5)}>⏮️ 倒轉5秒</Button>
        <Button size="sm" onClick={() => skip(5)}>快轉5秒 ⏭️</Button>
        <Button size="sm" onClick={toggleSpeed}>播放速度：{speed}x</Button>
      </div>

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