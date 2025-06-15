import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Camera, Upload, ImagePlus } from "lucide-react";
import axios from "axios";
import "./CameraPage.css";
import { useTranslation } from "react-i18next"; // 導入 useTranslation

export default function CameraPage() {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [draggedFiles, setDraggedFiles] = useState([]);
  const [pastedImage, setPastedImage] = useState(null);
  const dropZoneRef = useRef(null);
  const { t } = useTranslation('camera'); // 指定 camera 命名空間

  const startCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert(t('allowCameraPermission')); // 使用翻譯
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    const image = canvas.toDataURL("image/png");
    saveImage(image);
    stopCamera();
  };

  const uploadImages = (files) => {
    Array.from(files).forEach((file) => {
      const formData = new FormData();
      formData.append("image", file);

      axios
        .post(`${process.env.REACT_APP_API_URL}/api/images`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        })
        .then(() => alert(t('imageSavedSuccess'))) // 使用翻譯
        .catch((err) => {
          console.error("圖片儲存失敗", err);
          alert(t('imageSaveFailed')); // 使用翻譯
        });
    });
    setIsUploadModalOpen(false);
    setDraggedFiles([]);
    setPastedImage(null);
  };

  const saveImage = async (imageDataUrl) => {
    try {
      const res = await fetch(imageDataUrl);
      const blob = await res.blob();
      const file = new File([blob], "photo.png", { type: "image/png" });

      const formData = new FormData();
      formData.append("image", file);

      await axios.post(`${process.env.REACT_APP_API_URL}/api/images`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      alert(t('imageSavedSuccess')); // 使用翻譯
    } catch (err) {
      console.error("圖片儲存失敗", err);
      alert(t('imageSaveFailed')); // 使用翻譯
    }
  };

  // 處理拖放事件
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setDraggedFiles(Array.from(files));
    }
  };

  // 處理貼上圖片
  const handlePaste = (e) => {
    const items = (e.clipboardData || window.clipboardData).items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") === 0) {
        const file = items[i].getAsFile();
        setPastedImage(file);
        break;
      }
    }
  };

  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, []);

  return (
    <div className="p-6 relative">
      <h2 className="text-2xl font-bold mb-6">{t('cameraTitle')}</h2>

      {/* 相機畫面 */}
      {isCameraOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center z-50">
          <video ref={videoRef} autoPlay className="w-full max-w-md rounded shadow" />
          <div className="mt-4 flex gap-3">
            <button onClick={capturePhoto} className="camera-btn">
              {t('capturePhoto')}
            </button>
            <button onClick={stopCamera} className="camera-btn">
              {t('cancel')}
            </button>
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {/* 三張卡片：拍照、上傳、圖片庫 */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        {/* 拍照 */}
        <Card
          onClick={startCamera}
          style={{
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
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f3f4f6")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          <Camera size={32} />
          <p className="text-sm mt-2">{t('takePhoto')}</p>
        </Card>

        {/* 上傳 */}
        <Card
          onClick={() => setIsUploadModalOpen(true)}
          style={{
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
            position: "relative",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f3f4f6")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          <Upload size={32} />
          <p className="text-sm mt-2">{t('uploadImage')}</p>
        </Card>

        {/* 圖片庫 */}
        <Card
          onClick={() => navigate("/gallery")}
          style={{
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
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f3f4f6")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          <ImagePlus size={32} />
          <p className="text-sm mt-2">{t('imageGallery')}</p>
        </Card>
      </div>

      {/* 上傳 Modal */}
      {isUploadModalOpen && (
        <div className="upload-modal-overlay">
          <div
            ref={dropZoneRef}
            className="upload-modal-content"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <h3>{t('uploadImageTitle')}</h3>
            <div className="upload-modal-dropzone">
              <p>{t('dragDropHere')}</p>
              <label>
                {t('clickToSelect')}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => uploadImages(e.target.files)}
                />
              </label>
              <p className="hint">{t('orPasteImage')}</p>
              {draggedFiles.length > 0 && (
                <div className="upload-modal-files">
                  <p>{t('draggedFiles', { count: draggedFiles.length })}</p>
                  <button onClick={() => uploadImages(draggedFiles)}>
                    {t('upload')}
                  </button>
                </div>
              )}
              {pastedImage && (
                <div className="upload-modal-files">
                  <p>{t('pastedImage')}</p>
                  <button onClick={() => uploadImages([pastedImage])}>
                    {t('upload')}
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={() => {
                setIsUploadModalOpen(false);
                setDraggedFiles([]);
                setPastedImage(null);
              }}
              className="upload-modal-close"
            >
              {t('close')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}