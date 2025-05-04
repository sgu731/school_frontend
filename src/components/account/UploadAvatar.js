import React, { useState, useRef } from 'react';

export default function UploadAvatar({ user, setUser }) {
  const [preview, setPreview] = useState(user?.avatar || ''); 
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert('請先選擇圖片');
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    const token = localStorage.getItem('token');

    try {
      const response = await fetch('http://localhost:5000/profile/avatar', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        alert('大頭貼上傳成功！');
        setUser(prev => ({ ...prev, avatar: data.avatarUrl }));
      } else {
        alert('上傳失敗: ' + (data.message || '未知錯誤'));
      }
    } catch (error) {
      console.error('上傳錯誤:', error);
      alert('系統錯誤，請稍後再試');
    }
  };

  return (
    <div className="upload-section">
      <h3>上傳大頭貼</h3>

      {preview && (
        <div style={{ marginBottom: '10px' }}>
          <img src={preview} alt="預覽" style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '50%' }} />
        </div>
      )}

      {/* 隱藏的檔案input */}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* 用label做漂亮按鈕 */}
      <label className="select-file-btn" onClick={() => fileInputRef.current.click()}>
        選擇檔案
      </label>

      <div style={{ marginTop: '10px' }}>
        <button onClick={handleUpload} className="upload-btn">
          上傳照片
        </button>
      </div>
    </div>
  );
}
