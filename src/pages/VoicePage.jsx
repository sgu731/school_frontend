import React, { useState, useRef, useEffect } from "react";
import { Mic, Upload, Library, Download } from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./VoicePage.css";
import { useTranslation } from 'react-i18next'; // 導入 useTranslation

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
  const { t } = useTranslation('voice'); // 指定 voice 命名空間

  const [transcript, setTranscript] = useState("");
  const [translated, setTranslated] = useState("");
  const [language, setLanguage] = useState("zh-TW");
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef(null);
  const [enableTranslation, setEnableTranslation] = useState(true);

  useEffect(() => {
    const fetchRecordings = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/recordings`, authHeader);
        // 將 file_path (作為 url) 轉為完整 URL
        const recordingsWithUrl = (res.data.recordings || []).map((rec) => ({
          ...rec,
          file_path: rec.url, // 後端返回 file_path 作為 url
          url: `${process.env.REACT_APP_API_URL}/${rec.url}`, // 拼接完整 URL
        }));
        setRecordings(recordingsWithUrl);
      } catch (err) {
        console.error(t('fetchRecordingsFailed'), err);
        alert(t('loadLibraryFailed'));
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
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        if (audioChunks.current.length === 0) {
          alert(t('recordingFailedNoAudio'));
          return;
        }
        if (!transcript) {
          alert(t('noSpeechContent'));
          return;
        }

        const blob = new Blob(audioChunks.current, { type: "audio/webm" });
        const now = new Date();
        const formattedDuration = `${String(Math.floor(recordingTime / 60)).padStart(2, "0")}:${String(recordingTime % 60).padStart(2, "0")}`;
        const localTime = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

        const formData = new FormData();
        formData.append("audio", blob, `${Date.now()}.webm`);
        formData.append("title", t('recordingTitle', { count: recordings.length + 1 }));
        formData.append("duration", formattedDuration);
        formData.append("time", localTime);
        formData.append("text", transcript || "");
        formData.append("translation", translated || "");

        console.log("發送 formData:", { title: t('recordingTitle', { count: recordings.length + 1 }), duration: formattedDuration, time: localTime, text: transcript, translation: translated });

        try {
          const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/recordings`, formData, authHeader);
          const newRecording = {
            ...res.data.recording,
            file_path: res.data.recording.url, // 後端返回 file_path 作為 url
            url: `${process.env.REACT_APP_API_URL}/${res.data.recording.url}`, // 拼接完整 URL
          };
          setRecordings((prev) => [...prev, newRecording]);
          alert(t('recordingSaved'));
        } catch (err) {
          console.error(t('saveRecordingFailed'), err.response?.data || err.message);
          alert(t('saveRecordingError'));
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

        recognitionRef.current.onstart = () => {
          console.log(t('speechRecognitionStarted', { language }));
        };

        recognitionRef.current.onresult = (e) => {
          let interim = "";
          let final = "";
          for (let i = e.resultIndex; i < e.results.length; ++i) {
            const transcript = e.results[i][0].transcript;
            if (e.results[i].isFinal) {
              final += transcript;
            } else {
              interim += transcript;
            }
          }
          console.log(t('finalTranscript'), final, t('interimTranscript'), interim);
          setTranscript((prev) => prev + final);
          if (enableTranslation && final) {
            translateText(final);
          }
        };

        recognitionRef.current.onerror = (e) => {
          console.error(t('speechRecognitionError'), e.error, e.message);
          if (e.error === "not-allowed") {
            alert(t('micPermissionDenied'));
          }
        };

        recognitionRef.current.onend = () => {
          console.log(t('speechRecognitionEnded'));
          if (recording) {
            console.log(t('speechRecognitionRestart'));
            setTimeout(() => recognitionRef.current?.start(), 500);
          }
        };

        try {
          recognitionRef.current.start();
        } catch (err) {
          console.error(t('speechRecognitionStartFailed'), err);
          alert(t('speechRecognitionStartError'));
        }
      } else {
        console.error(t('browserNotSupported'));
        alert(t('unsupportedBrowser'));
      }
    } catch (err) {
      console.error(t('recordingStartFailed'), err);
      alert(t('micPermissionError'));
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
    try {
      const response = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${language}&dt=t&q=${encodeURIComponent(text)}`
      );
      if (!response.ok) {
        throw new Error(t('translationFailed', { status: response.status, statusText: response.statusText }));
      }
      const data = await response.json();
      const translatedText = data[0].map((item) => item[0]).join("");
      console.log(t('translationResult'), translatedText);
      setTranslated((prev) => prev + translatedText);
    } catch (err) {
      console.error(t('translationError'), err);
    }
  };

  const deleteRecording = async (id) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/recordings/${id}`, authHeader);
      setRecordings(recordings.filter((r) => r.id !== id));
      alert(t('recordingDeleted'));
    } catch (err) {
      console.error(t('deleteRecordingFailed'), err);
      alert(t('deleteRecordingError'));
    }
  };

  const updateTitle = async (id, newTitle) => {
    try {
      const res = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/recordings/${id}`,
        { title: newTitle },
        authHeader
      );
      const updated = recordings.map((r) => (r.id === id ? { ...res.data.recording, file_path: r.file_path, url: r.url } : r));
      setRecordings(updated);
      setEditingId(null);
      alert(t('titleUpdated'));
    } catch (err) {
      console.error(t('updateTitleFailed'), err);
      alert(t('updateTitleError'));
    }
  };

  const downloadRecording = (file_path, title) => {
    const url = `${process.env.REACT_APP_API_URL}/${file_path}`;
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
        throw new Error(t('serverError', { status: res.status }));
      }

      const result = await res.json();
      if (result.text) {
        const newNote = {
          title: t('whisperTitle'),
          content: result.text,
          date: new Date().toISOString(),
        };
        const existing = JSON.parse(localStorage.getItem("importedNotes")) || [];
        const updated = [...existing, newNote];
        localStorage.setItem("importedNotes", JSON.stringify(updated));
        alert(t('whisperSuccess'));
      } else {
        alert(t('whisperFailure'));
      }
    } catch (error) {
      console.error(t('uploadFailed'), error);
      alert(t('uploadOrTranscribeFailed'));
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">{t('voiceTitle')}</h2>

      {!view && (
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          <Card onClick={() => navigate("/recording")} style={cardStyle}>
            <Mic size={36} />
            <p className="mt-2 text-sm">{t('record')}</p>
          </Card>
          <Card onClick={() => navigate("/transcribe")} style={cardStyle}>
            <Upload size={36} />
            <p className="mt-2 text-sm">{t('uploadRecording')}</p>
          </Card>
          <Card onClick={() => setView("library")} style={cardStyle}>
            <Library size={36} />
            <p className="mt-2 text-sm">{t('voiceLibrary')}</p>
          </Card>
        </div>
      )}

      {view === "library" && (
        <div className="mt-6">
          <button onClick={() => setView(null)} className="voice-page-btn mb-4">{t('back')}</button>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...recordings].reverse().map((rec) => (
              <div key={rec.id} className="border rounded-xl p-4 shadow hover:shadow-md transition">
                {editingId === rec.id ? (
                  <div className="flex items-center gap-2 mb-2">
                    <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="border p-1 rounded" />
                    <button className="voice-page-btn" onClick={() => updateTitle(rec.id, editTitle)}>{t('save')}</button>
                    <button className="voice-page-btn" onClick={() => setEditingId(null)}>{t('cancel')}</button>
                  </div>
                ) : (
                  <div
                    className="text-lg font-bold whitespace-nowrap cursor-pointer"
                    //onClick={() => navigate("/recording-detail", { state: rec })}
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
                <p className="text-sm text-gray-500">{t('duration')}: {rec.duration}</p>
                <audio controls src={rec.url} className="w-full my-2" />
                <div className="flex gap-2 mt-2 flex-wrap">
                  <button className="voice-page-btn" onClick={() => downloadRecording(rec.file_path, rec.title)}>
                    <Download size={16} className="mr-2 inline-block" />{t('downloadAudio')}
                  </button>
                  <button className="voice-page-btn" onClick={() => deleteRecording(rec.id)}>
                    🗑️ {t('delete')}
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