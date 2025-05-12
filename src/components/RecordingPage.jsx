import React, { useState, useRef } from "react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function RecordingPage() {
  const navigate = useNavigate();
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [translated, setTranslated] = useState("");

  const mediaRecorderRef = useRef(null);
  const audioChunks = useRef([]);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const enableTranslationRef = useRef(true);

  const token = localStorage.getItem("token");
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

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
      recognitionRef.current.lang = "zh-TW";

      recognitionRef.current.onresult = (e) => {
        let finalTranscript = "";
        for (let i = e.resultIndex; i < e.results.length; ++i) {
          if (e.results[i].isFinal) {
            finalTranscript += e.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          setTranscript((prev) => prev + finalTranscript);
          if (enableTranslationRef.current) {
            (async () => {
              try {
                const detectRes = await fetch(
                  "https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=zh-TW&dt=t&q=" +
                    encodeURIComponent(finalTranscript)
                );
                const detectData = await detectRes.json();
                const sourceLang = detectData[2];
                const targetLang = sourceLang.startsWith("zh") ? "en" : "zh-TW";
                if (sourceLang.startsWith(targetLang.slice(0, 2))) return;

                const transRes = await fetch(
                  `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(finalTranscript)}`
                );
                const transData = await transRes.json();
                const translatedText = transData[0].map((item) => item[0]).join("");
                setTranslated((prev) => prev + translatedText);
              } catch (err) {
                console.error("翻譯失敗：", err);
              }
            })();
          }
        }
      };

      recognitionRef.current.start();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();

      mediaRecorderRef.current.onstop = async () => {
        if (audioChunks.current.length === 0) {
          alert("⚠️ 錄音失敗，請錄久一點！");
          return;
        }

        const blob = new Blob(audioChunks.current, { type: "audio/webm" });
        const now = new Date();
        const formattedDuration = `${String(Math.floor(recordingTime / 60)).padStart(2, "0")}:${String(recordingTime % 60).padStart(2, "0")}`;
        const localTime = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

        const formData = new FormData();
        formData.append("audio", blob);
        formData.append("title", `錄音 ${Date.now()}`);
        formData.append("duration", formattedDuration);
        formData.append("time", localTime);
        formData.append("text", transcript);
        formData.append("translation", translated);

        try {
          await axios.post("http://localhost:5000/api/recordings", formData, authHeader);
          alert("✅ 錄音已儲存至語音庫");
        } catch (err) {
          console.error("儲存失敗", err);
          alert("❌ 儲存失敗");
        }
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
                  defaultChecked={enableTranslationRef.current}
                  onChange={(e) => {
                    enableTranslationRef.current = e.target.checked;
                  }}
                />
                啟用即時翻譯
              </label>
            </div>
          </>
        )}
      </div>

      {recording && (
        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
          <p className="text-sm text-gray-500 mb-2">🗣 即時語音：</p>
          <p className="whitespace-pre-wrap">{transcript}</p>
          <p className="text-sm text-gray-500 mb-2">🌐 即時翻譯：</p>
          <p className="text-green-700 whitespace-pre-wrap mb-4">{translated}</p>
        </div>
      )}
    </div>
  );
}
