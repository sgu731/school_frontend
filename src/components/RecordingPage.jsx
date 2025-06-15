import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./RecordingPage.css";
import { useTranslation } from 'react-i18next'; // 導入 useTranslation

export default function RecordingPage() {
  const navigate = useNavigate();
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [pausing, setPausing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [translated, setTranslated] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [recognitionLang, setRecognitionLang] = useState("zh-TW");
  const [translationLang, setTranslationLang] = useState("en");
  const { t } = useTranslation('recording'); // 指定 recording 命名空間

  const mediaRecorderRef = useRef(null);
  const audioChunks = useRef([]);
  const recognitionRef = useRef(null);
  const timerRef = useRef({});
  const enableTranslationRef = useRef(true);
  const translationTimeoutRef = useRef(null);
  const lastResultTimeRef = useRef(null);
  const recognitionErrorRef = useRef(false);
  const retryCountRef = useRef(0); // 新增：追蹤重試次數

  const token = localStorage.getItem("token");
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    console.log(t('currentTranscript'), transcript);
    console.log(t('currentTranslation'), translated);
  }, [transcript, translated]);

  const stopRecognition = () => {
    return new Promise((resolve) => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = () => {
          console.log(t('speechRecognitionStopped'));
          resolve();
        };
        recognitionRef.current.stop();
      } else {
        resolve();
      }
    });
  };

  const startRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error(t('browserNotSupported'));
      alert(t('unsupportedBrowser'));
      recognitionErrorRef.current = true;
      return;
    }

    if (retryCountRef.current >= 5) {
      console.error(t('retryLimitExceeded'));
      alert(t('recognitionRetryLimit'));
      recognitionErrorRef.current = true;
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = recognitionLang;
    recognitionRef.current.maxAlternatives = 1;

    recognitionRef.current.onstart = () => {
      console.log(t('speechRecognitionStarted', { language: recognitionLang }));
      recognitionErrorRef.current = false;
      lastResultTimeRef.current = Date.now(); // 重置時間
      retryCountRef.current = 0; // 重置重試計數
    };

    recognitionRef.current.onresult = (e) => {
      lastResultTimeRef.current = Date.now();
      let interim = "";
      let final = "";
      console.log(t('speechRecognitionResult'), e.results);
      for (let i = e.resultIndex; i < e.results.length; ++i) {
        const transcript = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      setInterimTranscript(interim);
      console.log(t('finalTranscript'), final, t('interimTranscript'), interim);
      if (final) {
        setTranscript((prev) => prev + final);
        if (enableTranslationRef.current) {
          clearTimeout(translationTimeoutRef.current);
          translationTimeoutRef.current = setTimeout(async () => {
            try {
              const sourceLang = recognitionLang;
              console.log(t('assumedSourceLang'), sourceLang, t('targetLang'), translationLang);
              if (sourceLang === translationLang || sourceLang.startsWith(translationLang)) {
                console.log(t('skipTranslation'), sourceLang, translationLang);
                return;
              }

              const transRes = await fetch(
                `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${translationLang}&dt=t&q=${encodeURIComponent(final)}`
              );
              if (!transRes.ok) {
                throw new Error(t('translationFailed', { status: transRes.status, statusText: transRes.statusText }));
              }
              const transData = await transRes.json();
              console.log(t('translationResult'), transData);
              const translatedText = transData[0].map((item) => item[0]).join("");
              setTranslated((prev) => prev + translatedText);
            } catch (err) {
              console.error(t('translationError'), err.message, err);
            }
          }, 500);
        }
      }
    };

    recognitionRef.current.onerror = (e) => {
      console.error(t('speechRecognitionError'), e.error, e.message);
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        recognitionErrorRef.current = true;
        alert(t('micPermissionDenied'));
      } else if (e.error === "no-speech") {
        console.log(t('noSpeechInput'));
      } else if (e.error === "aborted") {
        console.log(t('recognitionAborted'));
        retryCountRef.current += 1;
        if (retryCountRef.current < 5 && recording && !recognitionErrorRef.current && !pausing) {
          console.log(t('restartingRecognition'), retryCountRef.current);
          setTimeout(() => startRecognition(), 1000); // 延長延遲
        } else {
          recognitionErrorRef.current = true;
          alert(t('recognitionAbortedMultiple'));
        }
      } else {
        retryCountRef.current += 1;
        if (recording && !recognitionErrorRef.current && !pausing && retryCountRef.current < 5) {
          console.log(t('restartingRecognition'), retryCountRef.current);
          recognitionRef.current.stop();
          setTimeout(() => startRecognition(), 1000);
        }
      }
    };

    recognitionRef.current.onend = () => {
      console.log(t('speechRecognitionEnded'));
      if (recording && !recognitionErrorRef.current && !pausing) {
        retryCountRef.current += 1;
        if (retryCountRef.current < 5) {
          console.log(t('restartDueToEnd'), retryCountRef.current);
          setTimeout(() => startRecognition(), 1000);
        } else {
          recognitionErrorRef.current = true;
          alert(t('recognitionRetryLimit'));
        }
      }
    };

    try {
      recognitionRef.current.start();
    } catch (err) {
      console.error(t('speechRecognitionStartFailed'), err);
      recognitionErrorRef.current = true;
      alert(t('speechRecognitionStartError'));
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data);
      };

      mediaRecorderRef.current.start();
      setRecordingTime(0);
      console.log(t('settingTimerBefore'), timerRef.current);
      timerRef.current = { ...timerRef.current };
      timerRef.current.main = setInterval(() => setRecordingTime((prev) => prev + 1), 1000);
      setPaused(false);
      setPausing(false);
      setRecording(true);
      setTranscript("");
      setInterimTranscript("");
      setTranslated("");
      lastResultTimeRef.current = Date.now();
      retryCountRef.current = 0; // 重置重試計數

      startRecognition();

      timerRef.current.checkStuck = setInterval(() => {
        console.log(t('checkingRecognition'), timerRef.current, t('lastResultTime'), lastResultTimeRef.current);
        if (recording && !pausing && Date.now() - lastResultTimeRef.current > 5000 && !recognitionErrorRef.current) {
          retryCountRef.current += 1;
          if (retryCountRef.current < 5) {
            console.log(t('recognitionStuck'), retryCountRef.current);
            recognitionRef.current?.stop();
            setTimeout(() => startRecognition(), 1000);
          } else {
            recognitionErrorRef.current = true;
            alert(t('recognitionStuckMultiple'));
          }
        }
      }, 1000);
    } catch (err) {
      console.error(t('recordingStartFailed'), err);
      alert(t('micPermissionError'));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();

      mediaRecorderRef.current.onstop = async () => {
        if (audioChunks.current.length === 0) {
          alert(t('recordingFailed'));
          return;
        }

        if (!transcript) {
          alert(t('noSpeechContent'));
          return;
        }

        const blob = new Blob(audioChunks.current, { type: "audio/webm" });
        const now = new Date();
        const localTime = now.toISOString().replace("T", " ").slice(0, 16);

        const formData = new FormData();
        formData.append("audio", blob, `${Date.now()}.webm`);
        formData.append("title", t('recordingTitle', { time: Date.now() }));
        formData.append("duration", recordingTime);
        formData.append("time", localTime);
        formData.append("text", transcript || "");
        formData.append("translation", translated || "");

        console.log(t('sendingFormData'), {
          title: t('recordingTitle', { time: Date.now() }),
          duration: recordingTime,
          time: localTime,
          text: transcript,
          translation: translated,
        });

        try {
          const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/recordings`, formData, authHeader);
          console.log(t('saveResponse'), response.data);
          alert(t('recordingSaved'));
        } catch (err) {
          console.error(t('saveFailed'), err.response?.data || err.message);
          alert(t('saveError'));
        }
      };
    }

    setRecording(false);
    setPausing(false);
    clearInterval(timerRef.current.main);
    clearInterval(timerRef.current.checkStuck);
    setPaused(false);
    stopRecognition();
  };

  return (
    <div className="mt-6 p-6">
      <button
        className="recording-btn mb-4"
        onClick={() => {
          stopRecording();
          navigate("/voice");
        }}
      >
        {t('back')}
      </button>

      {!recording && (
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div>
            <label className="text-sm mr-2">{t('recognitionLanguageLabel')}：</label>
            <select
              value={recognitionLang}
              onChange={(e) => setRecognitionLang(e.target.value)}
              className="p-2 border rounded"
            >
              <option value="zh-TW">{t('zhTW')}</option>
              <option value="zh-CN">{t('zhCN')}</option>
              <option value="en-US">{t('enUS')}</option>
            </select>
          </div>
          <div>
            <label className="text-sm mr-2">{t('translationTargetLabel')}：</label>
            <select
              value={translationLang}
              onChange={(e) => setTranslationLang(e.target.value)}
              className="p-2 border rounded"
            >
              <option value="zh-TW">{t('zhTW')}</option>
              <option value="en">{t('en')}</option>
            </select>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4 mb-4">
        <button
          className="recording-btn"
          onClick={recording ? stopRecording : startRecording}
        >
          {recording ? t('save') : t('startRecording')}
        </button>

        {recording && (
          <>
            <button
              className="recording-btn"
              onClick={async () => {
                if (!mediaRecorderRef.current) return;
                if (mediaRecorderRef.current.state === "recording") {
                  mediaRecorderRef.current.pause();
                  setPausing(true);
                  await stopRecognition(); // 等待停止完成
                  clearInterval(timerRef.current.main);
                  clearInterval(timerRef.current.checkStuck);
                  setPaused(true);
                } else if (mediaRecorderRef.current.state === "paused") {
                  mediaRecorderRef.current.resume();
                  console.log(t('resumingRecording'), timerRef.current);
                  timerRef.current = { ...timerRef.current };
                  timerRef.current.main = setInterval(() => setRecordingTime((prev) => prev + 1), 1000);
                  timerRef.current.checkStuck = setInterval(() => {
                    console.log(t('checkingRecognition'), timerRef.current, t('lastResultTime'), lastResultTimeRef.current);
                    if (recording && !pausing && Date.now() - lastResultTimeRef.current > 5000 && !recognitionErrorRef.current) {
                      retryCountRef.current += 1;
                      if (retryCountRef.current < 5) {
                        console.log(t('recognitionStuck'), retryCountRef.current);
                        recognitionRef.current?.stop();
                        setTimeout(() => startRecognition(), 1000);
                      } else {
                        recognitionErrorRef.current = true;
                        alert(t('recognitionStuckMultiple'));
                      }
                    }
                  }, 1000);
                  setPaused(false);
                  setPausing(false);
                  startRecognition();
                }
              }}
            >
              {paused ? t('resume') : t('pause')}
            </button>

            <p className="text-sm text-gray-600">
              ⏱ {t('recordingDuration')}: {Math.floor(recordingTime / 60).toString().padStart(2, "0")}:{(recordingTime % 60).toString().padStart(2, "0")}
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
                {t('enableRealTimeTranslation')}
              </label>
            </div>
          </>
        )}
      </div>

      {recording && (
        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
          <p className="text-sm text-gray-500 mb-2">{t('realTimeSpeech')}</p>
          <p className="whitespace-pre-wrap">
            <span>{transcript}</span>
            <span className="text-gray-400">{interimTranscript}</span>
          </p>
          <p className="text-sm text-gray-500 mb-2">{t('realTimeTranslation')}</p>
          <p className="text-green-700 whitespace-pre-wrap mb-4">{translated}</p>
        </div>
      )}
    </div>
  );
}