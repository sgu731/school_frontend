import React, { useState, useRef, useEffect } from "react";
import { Mic, Upload, Library, Download } from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

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

  const [transcript, setTranscript] = useState("");
  const [translated, setTranslated] = useState("");
  const [language, setLanguage] = useState("zh-TW");
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef(null);
  const [enableTranslation, setEnableTranslation] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("voiceNotes");
    if (stored) setRecordings(JSON.parse(stored));
  }, []);

  const saveToLocalStorage = (data) => {
    setRecordings(data);
    localStorage.setItem("voiceNotes", JSON.stringify(data));
  };

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    audioChunks.current = [];

    mediaRecorderRef.current.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunks.current.push(e.data);
    };

    mediaRecorderRef.current.onstop = () => {
      if (audioChunks.current.length === 0) {
        alert("⚠️ 錄音失敗：沒有有效音訊，請錄久一點再試一次。");
        return;
      }
      const blob = new Blob(audioChunks.current, { type: "audio/webm" });
      const url = URL.createObjectURL(blob);
      const newRecord = {
        id: Date.now(),
        title: `錄音 ${recordings.length + 1}`,
        url,
        time: new Date().toISOString().slice(0, 16).replace("T", " ").replace(/-/g, "/"), 
        duration: `${Math.floor(recordingTime / 60).toString().padStart(2, '0')}:${(recordingTime % 60).toString().padStart(2, '0')}`,
        text: transcript,
        translation: translated,
      };
      const updated = [...recordings, newRecord];
      saveToLocalStorage(updated);
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

  const deleteRecording = (id) => {
    const updated = recordings.filter((r) => r.id !== id);
    saveToLocalStorage(updated);
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
      <h1 className="text-2xl font-bold mb-6">語音</h1>

      {/* 首頁三個卡片 */}
      {!view && (
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          <Card
            onClick={() => setView("record")}
            style={{
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
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f3f4f6")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <Mic size={36} />
            <p className="mt-2 text-sm">錄音</p>
          </Card>

          <Card
            style={{
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
              position: "relative",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f3f4f6")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <Upload size={36} />
            <p className="mt-2 text-sm">上傳錄音</p>
            <input
              type="file"
              accept="audio/*"
              onChange={handleWhisperUpload}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                opacity: 0,
                cursor: "pointer",
              }}
            />
          </Card>

          <Card
            onClick={() => setView("library")}
            style={{
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
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f3f4f6")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <Library size={36} />
            <p className="mt-2 text-sm">語音庫</p>
          </Card>
        </div>
      )}

      {/* 錄音畫面 */}
      {view === "record" && (
        <div className="mt-6">
          <Button onClick={() => setView(null)} className="mb-4">返回</Button>

          {/* 錄音控制區 */}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <Button onClick={recording ? stopRecording : startRecording} className="bg-orange-600 text-white">
              {recording ? "🛑 停止錄音" : "🎙️ 開始錄音"}
            </Button>

            {recording && (
              <Button
                onClick={() => {
                  if (!mediaRecorderRef.current) return;
                  if (mediaRecorderRef.current.state === "recording") {
                    mediaRecorderRef.current.pause();
                    recognitionRef.current?.stop();
                    clearInterval(timerRef.current);
                    setPaused(true);
                  } else if (mediaRecorderRef.current.state === "paused") {
                    mediaRecorderRef.current.resume();
                    recognitionRef.current?.start();
                    timerRef.current = setInterval(() => setRecordingTime((prev) => prev + 1), 1000);
                    setPaused(false);
                  }
                }}
                className="bg-yellow-500 text-white"
              >
                {paused ? "▶️ 繼續" : "⏸ 暫停"}
              </Button>
            )}

            {recording && (
              <p className="text-sm text-gray-600">
                ⏱ 錄音時長：{Math.floor(recordingTime / 60).toString().padStart(2, '0')}:{(recordingTime % 60).toString().padStart(2, '0')}
              </p>
            )}

            {recording && (
              <div className="flex items-center gap-2">
                <label className="text-sm flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={enableTranslation}
                    onChange={() => setEnableTranslation(!enableTranslation)}
                  />
                  啟用即時翻譯
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="border p-2 rounded"
                >
                  <option value="zh-TW">中文</option>
                  <option value="en-US">英文</option>
                </select>
              </div>
            )}
          </div>

          {/* 即時辨識 */}
          {recording && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
              <p className="text-sm text-gray-500 mb-2">🌐 即時翻譯：</p>
              <p className="text-green-700 whitespace-pre-wrap mb-4">{translated}</p>
              <p className="text-sm text-gray-500 mb-2">即時語音辨識中...</p>
              <p className="whitespace-pre-wrap">{transcript}</p>
            </div>
          )}
        </div>
      )}

      {/* 語音庫畫面 */}
      {view === "library" && (
        <div className="mt-6">
          <Button onClick={() => setView(null)} className="mb-4">返回</Button>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recordings.map((rec) => (
              <div 
                key={rec.id} 
                className="border rounded-xl p-4 shadow hover:shadow-md transition"
              >
                {editingId === rec.id ? (
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="border p-1 rounded"
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        const updated = recordings.map((r) =>
                          r.id === rec.id ? { ...r, title: editTitle } : r
                        );
                        saveToLocalStorage(updated);
                        setEditingId(null);
                      }}
                    >
                      ✅ 儲存
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setEditingId(null)}>
                      ❌ 取消
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between mb-2 w-full">
                    <p 
                      className="text-lg font-bold whitespace-nowrap"
                      onClick={() => navigate("/recording-detail", { state: rec })}
                    >
                      {rec.title}
                    </p>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-blue-500"
                      onClick={() => {
                        setEditingId(rec.id);
                        setEditTitle(rec.title);
                      }}
                    >
                      <Pencil size={16} />
                    </Button>
                  </div>
                )}
                <p className="text-sm text-gray-500">{rec.time}</p>
                <p className="text-sm text-gray-500">時長：{rec.duration}</p>
                <audio controls src={rec.url} className="w-full my-2" />
                <div className="flex gap-2 mt-2">
                  <Button size="sm" onClick={() => downloadRecording(rec.url, rec.title)}>
                    <Download size={16} className="mr-2" />下載音檔
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteRecording(rec.id)}>
                    🗑️ 刪除
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}