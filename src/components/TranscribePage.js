import React, { useState } from 'react';
import axios from 'axios';
import "./TranscribePage.css"; 

function TranscribePage() {
  const token = localStorage.getItem('token');
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('未選擇任何檔案'); // ✅ 顯示用檔名
  const [url, setUrl] = useState('');
  const [transcription, setTranscription] = useState('');
  const [source, setSource] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setFileName(selectedFile?.name || '未選擇任何檔案');
    setUrl('');
    setTranscription('');
    setSource('');
    setError('');
  };

  const handleUrlChange = (e) => {
    setUrl(e.target.value);
    setFile(null);
    setFileName('未選擇任何檔案');
    setTranscription('');
    setSource('');
    setError('');
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let response;
      if (file) {
        const formData = new FormData();
        formData.append('audio', file);
        response = await axios.post(
          `${process.env.REACT_APP_API_URL}/api/transcribe/transcribe`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else if (url) {
        response = await axios.post(
          `${process.env.REACT_APP_API_URL}/api/transcribe/youtube`,
          { url },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        setError('請選擇檔案或輸入 YouTube URL');
        setLoading(false);
        return;
      }
      setTranscription(response.data.transcription);
      setSource(response.data.source || 'whisper');
      setError('');
    } catch (err) {
      setError('轉錄失敗：' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const formatTranscription = (text) => {
    if (!text) return '';
    const lines = text
      .split('\n')
      .filter(line => {
        const isMeta = line.startsWith('WEBVTT') || line.startsWith('Kind') || line.startsWith('Language');
        const isTimestamp = /^\d{2}:\d{2}:\d{2}/.test(line);
        return line && !isMeta && !isTimestamp;
      })
      .map(line => line.replace(/<[^>]+>/g, '').trim());
    const uniqueLines = [...new Set(lines)];
    return uniqueLines.join(' ');
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">語音轉錄</h2>
      {/* ✅ 一行排列表單 */}
      <form
        onSubmit={handleUpload}
        style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}
      >
        {/* 選擇檔案按鈕 + 狀態 */}
        <label className="transcribe-btn cursor-pointer">
          選擇檔案
          <input
            type="file"
            accept=".mp3,.wav,.m4a"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
        </label>
        <span>{fileName}</span>

        {/* YouTube URL 輸入 */}
        <input
          type="text"
          placeholder="輸入 YouTube URL"
          value={url}
          onChange={handleUrlChange}
          className="border px-2 py-1 rounded"
        />

        {/* 上傳按鈕 */}
        <button type="submit" className="transcribe-btn" disabled={loading}>
          {loading ? '轉錄中...' : '上傳並轉錄'}
        </button>
      </form>

      {transcription && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">轉錄結果（來源：{source}）：</h3>
          <pre style={{
            maxHeight: '300px',
            overflowY: 'auto',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word'
          }}>
            {formatTranscription(transcription, source)}
          </pre>

          <button
            className="transcribe-btn mt-4"
            onClick={async () => {
              try {
                const response = await axios.post(
                  `${process.env.REACT_APP_API_URL}/api/note`,
                  {
                    title: "語音轉錄筆記",
                    content: formatTranscription(transcription, source),
                  },
                  {
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  }
                );
                alert("✅ 已成功將轉錄結果加入筆記！");
              } catch (err) {
                console.error("加入筆記失敗：", err);
                alert("❌ 加入筆記失敗，請稍後再試！");
              }
            }}
          >
            加入筆記
          </button>
        </div>
      )}

      {error && <p className="text-red-600 mt-4">{error}</p>}
    </div>
  );
}

export default TranscribePage;