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
      const response = await fetch(`${process.env.REACT_APP_API_URL}/profile/avatar`, {
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
    <div className="upload-avatar-card">
      <h3 className="upload-title">上傳大頭貼</h3>
      <div className="avatar-preview">
        <img
          src={preview || `${process.env.REACT_APP_API_URL}/uploads/default-avatar.jpg`}
          alt="大頭貼預覽"
          className="avatar-preview-img"
          onError={(e) => {
            e.target.onerror = null; // 防止循環錯誤
            e.target.src = `${process.env.REACT_APP_API_URL}/uploads/default-avatar.jpg`; // 預設圖片
          }}
        />
      </div>
      <div className="upload-controls">
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <label className="select-file-btn" onClick={() => fileInputRef.current.click()}>
          選擇檔案
        </label>
        <button onClick={handleUpload} className="upload-btn">
          上傳照片
        </button>
      </div>
    </div>
  );
}