import React, { useState } from 'react';
import axios from 'axios';

function TranscribePage() {
    const token = localStorage.getItem('token');
    const [file, setFile] = useState(null);
    const [url, setUrl] = useState('');
    const [transcription, setTranscription] = useState('');
    const [source, setSource] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setUrl('');
        setTranscription('');
        setSource('');
        setError('');
    };

    const handleUrlChange = (e) => {
        setUrl(e.target.value);
        setFile(null);
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
                    'http://localhost:5000/api/transcribe/transcribe',
                    formData,
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );
            } else if (url) {
                response = await axios.post(
                    'http://localhost:5000/api/transcribe/youtube',
                    { url },
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );
            } else {
                setError('請選擇檔案或輸入 YouTube URL');
                setLoading(false);
                return;
            }
            setTranscription(response.data.transcription);
            setSource(response.data.source || 'whisper'); // 預設 whisper
            setError('');
        } catch (err) {
            setError('轉錄失敗：' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    // 處理轉錄結果的分行顯示
    const formatTranscription = (text, source) => {
        if (!text) return '';
        if (source === 'subtitles') {
            // 移除 .vtt 格式的時間戳，只保留字幕文字
            const lines = text.split('\n').filter(line => {
                return line && !line.startsWith('WEBVTT') && !line.match(/^\d{2}:\d{2}/);
            });
            return lines.join('\n');
        }
        // Whisper 轉錄結果按句號或換行分行
        return text.split(/[。！？\n]/).filter(line => line.trim()).join('\n');
    };

    return (
        <div>
            <h2>語音轉錄</h2>
            <form onSubmit={handleUpload}>
                <input type="file" accept=".mp3,.wav,.m4a" onChange={handleFileChange} />
                <input
                    type="text"
                    placeholder="輸入 YouTube URL"
                    value={url}
                    onChange={handleUrlChange}
                />
                <button type="submit" disabled={loading}>
                    {loading ? '轉錄中...' : '上傳並轉錄'}
                </button>
            </form>
            {transcription && (
                <div>
                    <h3>轉錄結果（來源：{source}）：</h3>
                    <pre style={{ 
                        maxHeight: '300px', 
                        overflowY: 'auto', 
                        whiteSpace: 'pre-wrap', 
                        wordWrap: 'break-word' 
                    }}>
                        {formatTranscription(transcription, source)}
                    </pre>

                    <button
                      style={{
                        marginTop: '12px',
                        padding: '8px 16px',
                        backgroundColor: '#3b82f6',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                      onClick={async () => {
                        try {
                          const response = await axios.post(
                            "http://localhost:5000/api/note",
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
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
}

export default TranscribePage;