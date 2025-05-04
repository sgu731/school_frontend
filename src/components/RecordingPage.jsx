import React, { useState, useRef } from "react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";

export default function RecordingPage() {
  const navigate = useNavigate();
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [language, setLanguage] = useState("zh-TW");
  const [enableTranslation, setEnableTranslation] = useState(true);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [translated, setTranslated] = useState("");

  const mediaRecorderRef = useRef(null);
  const audioChunks = useRef([]);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);

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

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    audioChunks.current = [];

    mediaRecorderRef.current.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunks.current.push(e.data);
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

      mediaRecorderRef.current.onstop = () => {
        if (audioChunks.current.length === 0) {
          alert("⚠️ 錄音失敗，請錄久一點！");
          return;
        }

        const blob = new Blob(audioChunks.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);

        const now = new Date();
        const localTime = `${now.getFullYear()}/${(now.getMonth() + 1)
          .toString()
          .padStart(2, "0")}/${now.getDate().toString().padStart(2, "0")} ${now
          .getHours()
          .toString()
          .padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

        const prev = JSON.parse(localStorage.getItem("voiceNotes") || "[]");
        const maxIndex = prev.reduce((max, r) => {
          const match = r.title.match(/^錄音 (\d+)$/);
          const num = match ? parseInt(match[1]) : 0;
          return Math.max(max, num);
        }, 0);

        const newRecord = {
          id: Date.now(),
          title: `錄音 ${maxIndex + 1}`,
          url,
          time: localTime,
          duration: `${Math.floor(recordingTime / 60)
            .toString()
            .padStart(2, "0")}:${(recordingTime % 60).toString().padStart(2, "0")}`,
          text: transcript,
          translation: translated,
        };

        localStorage.setItem("voiceNotes", JSON.stringify([...prev, newRecord]));
        alert("✅ 錄音已儲存至語音庫");
      };
    }

    setRecording(false);
    clearInterval(timerRef.current);
    setPaused(false);
    if (recognitionRef.current) recognitionRef.current.stop();
  };

  return (
    <div className="mt-6 p-6">
      <Button
        onClick={() => {
          stopRecording();
          navigate("/voice");
        }}
        className="mb-4"
      >
        返回
      </Button>

      <div className="flex flex-wrap items-center gap-4 mb-4">
        <Button
          onClick={recording ? stopRecording : startRecording}
          className="bg-orange-600 text-white"
        >
          {recording ? "儲存" : "🎙️ 開始錄音"}
        </Button>

        {recording && (
          <>
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
                  timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
                  setPaused(false);
                }
              }}
              className="bg-yellow-500 text-white"
            >
              {paused ? "▶ 繼續" : "⏸ 暫停"}
            </Button>

            <p className="text-sm text-gray-600">
              ⏱ 錄音時長：{Math.floor(recordingTime / 60).toString().padStart(2, "0")}:{(recordingTime % 60).toString().padStart(2, "0")}
            </p>

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
          </>
        )}
      </div>

      {recording && (
        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
          <p className="text-sm text-gray-500 mb-2">語音辨識中...</p>
          <p className="whitespace-pre-wrap">{transcript}</p>
          <p className="text-sm text-gray-500 mb-2">🌐 即時翻譯：</p>
          <p className="text-green-700 whitespace-pre-wrap mb-4">{translated}</p>
        </div>
      )}
    </div>
  );
}