import React, { useState, useRef, useEffect } from "react";
import { Mic, Upload, Library, Download } from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./VoicePage.css"; 

export default function VoicePage() {
  const navigate = useNavigate();
  const [recordings, setRecordings] = useState([]);
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [view, setView] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const mediaRecorderRef = useRef(null);
  const audioChunks = useRef([]);
  const recognitionRef = useRef(null);
  const token = localStorage.getItem("token");
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const [transcript, setTranscript] = useState("");
  const [translated, setTranslated] = useState("");
  const [language, setLanguage] = useState("zh-TW");
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef(null);
  const [enableTranslation, setEnableTranslation] = useState(true);

  useEffect(() => {
    const fetchRecordings = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/recordings", authHeader);
        setRecordings(res.data.recordings || []);
      } catch (err) {
        console.error("讀取錄音失敗", err);
      }
    };
    fetchRecordings();
  }, []);

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const h = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    return `${y}/${m}/${d} ${h}:${min}`;
  };

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    audioChunks.current = [];

    mediaRecorderRef.current.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunks.current.push(e.data);
    };

    mediaRecorderRef.current.onstop = async () => {
      if (audioChunks.current.length === 0) {
        alert("⚠️ 錄音失敗：沒有有效音訊，請錄久一點再試一次。");
        return;
      }
      const blob = new Blob(audioChunks.current, { type: "audio/webm" });
      const now = new Date();
      const formattedDuration = `${String(Math.floor(recordingTime / 60)).padStart(2, "0")}:${String(recordingTime % 60).padStart(2, "0")}`;
      const localTime = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

      const formData = new FormData();
      formData.append("audio", blob);
      formData.append("title", `錄音 ${recordings.length + 1}`);
      formData.append("duration", formattedDuration);
      formData.append("time", localTime);
      formData.append("text", transcript);
      formData.append("translation", translated);

      try {
        const res = await axios.post("http://localhost:5000/api/recordings", formData, authHeader);
        setRecordings((prev) => [...prev, res.data.recording]);
      } catch (err) {
        console.error("錄音儲存失敗", err);
      }
    };

    mediaRecorderRef.current.start();
    setRecordingTime(0);
    timerRef.current = setInterval(() => setRecordingTime((prev) => prev + 1), 1000);
    setPaused(false);
    setRecording(true);
    setTranscript("");
    setTranslated("");

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = language;

      recognitionRef.current.onresult = (e) => {
        let result = "";
        for (let i = e.resultIndex; i < e.results.length; ++i) {
          result += e.results[i][0].transcript;
        }
        setTranscript((prev) => prev + result);
        if (enableTranslation) translateText(result);
      };

      recognitionRef.current.start();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
    clearInterval(timerRef.current);
    setPaused(false);
    if (recognitionRef.current) recognitionRef.current.stop();
  };

  const translateText = async (text) => {
    if (!text) return;
    const response = await fetch(
      "https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=" +
        language +
        "&dt=t&q=" +
        encodeURIComponent(text)
    );
    const data = await response.json();
    const translatedText = data[0].map((item) => item[0]).join("");
    setTranslated(translatedText);
  };

  const deleteRecording = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/recordings/${id}`, authHeader);
      setRecordings(recordings.filter((r) => r.id !== id));
    } catch (err) {
      console.error("刪除錄音失敗", err);
    }
  };

  const updateTitle = async (id, newTitle) => {
    try {
      const res = await axios.put(
        `http://localhost:5000/api/recordings/${id}`,
        { title: newTitle },
        authHeader
      );
      const updated = recordings.map((r) => (r.id === id ? res.data.recording : r));
      setRecordings(updated);
      setEditingId(null);
    } catch (err) {
      console.error("更新標題失敗", err);
    }
  };

  const downloadRecording = (url, title) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title}.webm`;
    a.click();
  };

  const handleWhisperUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/whisper", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`伺服器錯誤，狀態碼 ${res.status}`);
      }

      const result = await res.json();
      if (result.text) {
        const newNote = {
          title: `Whisper 語音轉文字`,
          content: result.text,
          date: new Date().toISOString(),
        };
        const existing = JSON.parse(localStorage.getItem("importedNotes")) || [];
        const updated = [...existing, newNote];
        localStorage.setItem("importedNotes", JSON.stringify(updated));
        alert("✅ Whisper轉文字成功！");
      } else {
        alert("❌ Whisper轉文字失敗，伺服器沒有返回正確資料。");
      }
    } catch (error) {
      console.error("上傳失敗：", error);
      alert("❌ 上傳或轉文字失敗，請確認伺服器是否正確運作！");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">語音</h2>

      {!view && (
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          <Card onClick={() => navigate("/recording")} style={cardStyle}>
            <Mic size={36} />
            <p className="mt-2 text-sm">錄音</p>
          </Card>
          <Card onClick={() => navigate("/transcribe")} style={cardStyle}>
            <Upload size={36} />
            <p className="mt-2 text-sm">上傳錄音</p>
          </Card>
          <Card onClick={() => setView("library")} style={cardStyle}>
            <Library size={36} />
            <p className="mt-2 text-sm">語音庫</p>
          </Card>
        </div>
      )}

      {view === "library" && (
        <div className="mt-6">
          <button onClick={() => setView(null)} className="voice-page-btn mb-4">返回</button>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...recordings].reverse().map((rec) => (
              <div key={rec.id} className="border rounded-xl p-4 shadow hover:shadow-md transition">
                {editingId === rec.id ? (
                  <div className="flex items-center gap-2 mb-2">
                    <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="border p-1 rounded" />
                    <button className="voice-page-btn" onClick={() => updateTitle(rec.id, editTitle)}>✅ 儲存</button>
                    <button className="voice-page-btn" onClick={() => setEditingId(null)}>❌ 取消</button>
                  </div>
                ) : (
                  <div
                    className="text-lg font-bold whitespace-nowrap cursor-pointer"
                    onClick={() => navigate("/recording-detail", { state: rec })}
                  >
                    {rec.title}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(rec.id);
                        setEditTitle(rec.title);
                      }}
                      className="voice-page-btn text-blue-500 hover:text-blue-700 p-1 ml-2"
                    >
                      <Pencil size={16} />
                    </button>
                  </div>
                )}
                <p className="text-xs text-gray-300">{formatDate(rec.time)}</p>
                <p className="text-sm text-gray-500">時長：{rec.duration}</p>
                <audio controls src={rec.url} className="w-full my-2" />
                <div className="flex gap-2 mt-2 flex-wrap">
                  <button className="voice-page-btn" onClick={() => downloadRecording(rec.url, rec.title)}>
                    <Download size={16} className="mr-2 inline-block" />下載音檔
                  </button>
                  <button className="voice-page-btn" onClick={() => deleteRecording(rec.id)}>
                    🗑️ 刪除
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const cardStyle = {
  width: "150px",
  height: "150px",
  border: "2px solid #d1d5db",
  borderRadius: "12px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  cursor: "pointer",
  transition: "background-color 0.2s",
};