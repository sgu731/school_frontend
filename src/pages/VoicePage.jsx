import React, { useState, useRef, useEffect } from "react";
import { Mic, Upload, Library } from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";


export default function VoicePage() {
  const [recordings, setRecordings] = useState([]);
  const [recording, setRecording] = useState(false);
  const [view, setView] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunks = useRef([]);
  const recognitionRef = useRef(null);

  const [transcript, setTranscript] = useState("");
  const [translated, setTranslated] = useState("");
  const [language, setLanguage] = useState("zh-TW");
  const audioRefs = useRef({});

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

    mediaRecorderRef.current.ondataavailable = (e) => audioChunks.current.push(e.data);
    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(audioChunks.current);
      const url = URL.createObjectURL(blob);
      const newRecord = {
        id: Date.now(),
        url,
        text: transcript,
        translation: translated,
        time: new Date().toLocaleString(),
        title: `錄音 ${recordings.length + 1}`,
      };
      const updated = [...recordings, newRecord];
      saveToLocalStorage(updated);
    };

    mediaRecorderRef.current.start();
    setRecording(true);

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = language;

      recognitionRef.current.onresult = (e) => {
        let finalTranscript = "";
        for (let i = e.resultIndex; i < e.results.length; ++i) {
          finalTranscript += e.results[i][0].transcript;
        }
        setTranscript(finalTranscript);
        translateText(finalTranscript);
      };

      recognitionRef.current.start();
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setRecording(false);
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

  const importNote = (text, translation) => {
    const newNote = {
      title: "語音匯入筆記",
      content: `${text}\n\n翻譯：${translation}`,
      date: new Date().toLocaleString("zh-TW"),
    };
    const existing = JSON.parse(localStorage.getItem("importedNotes")) || [];
    const updated = [...existing, newNote];
    localStorage.setItem("importedNotes", JSON.stringify(updated));
    alert("已匯入至你的筆記！");
  };

  const handleWhisperUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/whisper", {
      method: "POST",
      body: formData,
    });

    const result = await res.json();
    if (result.text) {
      const newNote = {
        title: `Whisper 語音轉文字`,
        content: result.text,
        date: new Date().toLocaleString("zh-TW"),
      };
      const existing = JSON.parse(localStorage.getItem("importedNotes")) || [];
      const updated = [...existing, newNote];
      localStorage.setItem("importedNotes", JSON.stringify(updated));
      alert("✅ Whisper 已完成轉錄並儲存成筆記！");
    } else {
      alert("❌ Whisper 語音轉文字失敗");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">語音</h1>

      {/* 卡片選單 */}
      {!view && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <Card
            onClick={() => setView("record")}
            className="flex flex-col items-center justify-center h-40 cursor-pointer hover:bg-muted transition"
          >
            <Mic size={36} />
            <p className="mt-2 text-sm">錄音</p>
          </Card>

          <Card className="flex flex-col items-center justify-center h-40 cursor-pointer hover:bg-muted transition">
            <label className="flex flex-col items-center cursor-pointer">
              <Upload size={36} />
              <p className="mt-2 text-sm">上傳錄音</p>
              <input type="file" accept="audio/*" onChange={handleWhisperUpload} className="hidden" />
            </label>
          </Card>

          <Card
            onClick={() => setView("library")}
            className="flex flex-col items-center justify-center h-40 cursor-pointer hover:bg-muted transition"
          >
            <Library size={36} />
            <p className="mt-2 text-sm">你的語音庫</p>
          </Card>
        </div>
      )}

      {/* 錄音模組 */}
      {view === "record" && (
        <div className="mt-4">
          <Button onClick={() => setView(null)} className="mb-4">返回</Button>
          <div className="flex space-x-4">
            <Button onClick={recording ? stopRecording : startRecording} className="bg-orange-600 text-white">
              {recording ? "🛑 停止錄音" : "🎙️ 開始錄音"}
            </Button>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className="border p-2 rounded">
              <option value="zh-TW">中文</option>
              <option value="en-US">英文</option>
              <option value="ja-JP">日文</option>
              <option value="ko-KR">韓文</option>
              <option value="fr-FR">法文</option>
              <option value="de-DE">德文</option>
            </select>
          </div>
        </div>
      )}

      {/* 語音庫 */}
      {view === "library" && (
        <div className="mt-4">
          <Button onClick={() => setView(null)} className="mb-4">返回</Button>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recordings.map((rec) => (
              <Card key={rec.id} className="p-4">
                <p className="font-bold">{rec.title}</p>
                <p className="text-sm text-gray-500 mb-1">{rec.time}</p>
                <audio
                  controls
                  ref={(el) => (audioRefs.current[rec.id] = el)}
                  src={rec.url}
                  className="w-full my-2"
                />
                <p className="text-sm mt-2">🗣 {rec.text}</p>
                <p className="text-sm text-green-700">🌐 {rec.translation}</p>
                <div className="flex justify-between mt-2">
                  <button
                    onClick={() => importNote(rec.text, rec.translation)}
                    className="text-blue-600"
                  >📥 匯入筆記</button>
                  <button onClick={() => deleteRecording(rec.id)} className="text-red-600">🗑️ 刪除</button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}