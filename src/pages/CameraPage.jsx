import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Camera, Upload, ImagePlus } from "lucide-react";
import axios from "axios";
import "./CameraPage.css";

export default function CameraPage() {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const startCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert("請允許相機權限！");
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

  const uploadImages = (e) => {
    Array.from(e.target.files).forEach((file) => {
      const formData = new FormData();
      formData.append("image", file);

      axios
        .post(`${process.env.REACT_APP_API_URL}/api/images`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        })
        .then(() => alert("✅ 圖片已儲存到資料庫！"))
        .catch((err) => {
          console.error("圖片儲存失敗", err);
          alert("❌ 圖片儲存失敗！");
        });
    });
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

      alert("✅ 圖片已儲存到資料庫！");
    } catch (err) {
      console.error("圖片儲存失敗", err);
      alert("❌ 圖片儲存失敗！");
    }
  };

  return (
    <div className="p-6 relative">
      <h2 className="text-2xl font-bold mb-6">相機</h2>

      {/* 相機畫面 */}
      {isCameraOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center z-50">
          <video ref={videoRef} autoPlay className="w-full max-w-md rounded shadow" />
          <div className="mt-4 flex gap-3">
            <button onClick={capturePhoto} className="camera-btn">
              擷取畫面
            </button>
            <button onClick={stopCamera} className="camera-btn">
              取消
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
          <p className="text-sm mt-2">拍照</p>
        </Card>

        {/* 上傳 */}
        <Card
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
          <p className="text-sm mt-2">上傳圖片</p>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={uploadImages}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              opacity: 0,
              cursor: "pointer",
            }}
          />
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
          <p className="text-sm mt-2">圖片庫</p>
        </Card>
      </div>
    </div>
  );
}