import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Save, Plus, CheckCircle } from "lucide-react";
import { useTranslation } from 'react-i18next'; // 導入 useTranslation

export default function RecordingDetail() {
  const { state } = useLocation();
  const audioRef = useRef(null);
  const [transcript, setTranscript] = useState(state?.text || "");
  const [translation, setTranslation] = useState(state?.translation || "");
  const [successMessage, setSuccessMessage] = useState("");
  const [speed, setSpeed] = useState(1);
  const speedOptions = [0.5, 0.75, 1, 1.5, 2];
  const { t } = useTranslation('recordingDetail'); // 指定 recordingDetail 命名空間

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
    setSuccessMessage(t('saveSuccess'));
    setTimeout(() => setSuccessMessage(""), 2000);
  };

  const handleAddNote = () => {
    const now = new Date().toISOString();
    const fullContent = `${transcript}\n\n${translation}`;
    const newNote = {
      id: Date.now(),
      title: state?.title || t('defaultTitle'),
      content: fullContent,
      date: now,
      updatedAt: now,
    };

    const existingNotes = JSON.parse(localStorage.getItem("importedNotes") || "[]");
    const updatedNotes = [newNote, ...existingNotes];
    localStorage.setItem("importedNotes", JSON.stringify(updatedNotes));

    setSuccessMessage(t('addNoteSuccess'));
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
        <h2 className="text-xl font-bold mr-2">{state?.title || t('recording')}</h2>
        <span className="!text-[10px] !text-gray-300">{state?.time}</span>
      </div>

      <audio ref={audioRef} controls src={state?.url} className="w-full my-2" />

      {/* 播放附加控制功能 */}
      <div className="flex items-center justify-center gap-4 text-sm mt-4">
        <Button size="sm" onClick={() => skip(-5)}>{t('rewind5s')}</Button>
        <Button size="sm" onClick={() => skip(5)}>{t('fastForward5s')}</Button>
        <Button size="sm" onClick={toggleSpeed}>{t('playbackSpeed', { speed: speed })}x</Button>
      </div>

      {/* 文字區塊 */}
      <div className="mt-6">
        <label className="block text-sm font-bold mb-1">{t('transcriptLabel')}</label>
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          rows={6}
          className="w-full border rounded p-2"
        />

        <label className="block text-sm font-bold mt-4 mb-1">{t('translationLabel')}</label>
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
          <Save size={16} className="mr-2" />{t('saveChanges')}
        </Button>
        <Button variant="outline" onClick={handleAddNote}>
          <Plus size={16} className="mr-2" />{t('addNote')}
        </Button>
      </div>
    </div>
  );
}