import React, { useState, useRef } from "react";
import Tesseract from "tesseract.js";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Camera,
  Upload,
  ImagePlus,
  X,
  Brain,
  StickyNote,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";

export default function CameraPage() {
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [ocrText, setOcrText] = useState("");
  const [ocrDialogOpen, setOcrDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

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

  const capturePhoto = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    const image = canvas.toDataURL("image/png");

    setSelectedImage(image);
    setImages([...images, image]);
    stopCamera();
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    }
    setIsCameraOpen(false);
  };

  const uploadImages = (e) => {
    Array.from(e.target.files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => setImages((prev) => [...prev, reader.result]);
      reader.readAsDataURL(file);
    });
  };

  const handleOCR = async () => {
    if (!selectedImage) return;
    setLoading(true);
    const { data } = await Tesseract.recognize(selectedImage, "eng", {
      logger: (m) => console.log(m),
    });
    setLoading(false);
    setOcrText(data.text.trim());
    setOcrDialogOpen(true);
  };

  const saveToNotebook = () => {
    const newNote = {
      title: "從圖片轉文字",
      content: ocrText,
      date: new Date().toLocaleString("zh-TW"),
    };
    const prev = JSON.parse(localStorage.getItem("importedNotes") || "[]");
    const updated = [...prev, newNote];
    localStorage.setItem("importedNotes", JSON.stringify(updated));
    setOcrDialogOpen(false);
    setSelectedImage(null);
    setOcrText("");
    alert("已成功加入你的筆記！");
  };

  return (
    <div className="p-6 relative">
      <h1 className="text-2xl font-bold mb-6">相機</h1>

      {/* OCR 預覽 Dialog */}
      <Dialog open={ocrDialogOpen} onOpenChange={setOcrDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>OCR 辨識結果</DialogTitle>
          </DialogHeader>
          <div className="whitespace-pre-wrap max-h-60 overflow-y-auto border rounded p-2 text-sm">
            {ocrText || "（無文字）"}
          </div>
          <DialogFooter className="mt-4">
            <Button onClick={saveToNotebook} disabled={!ocrText}>
              加入筆記
            </Button>
            <Button variant="outline" onClick={() => setOcrDialogOpen(false)}>
              取消
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 相機畫面 */}
      {isCameraOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center z-50">
          <video ref={videoRef} autoPlay className="w-full max-w-md rounded shadow" />
          <div className="mt-4 flex gap-3">
            <Button onClick={capturePhoto} className="bg-orange-500 text-white">
              擷取畫面
            </Button>
            <Button variant="outline" onClick={stopCamera}>
              取消
            </Button>
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {/* 圖片詳細預覽 + 分析 */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center z-40">
          <img src={selectedImage} className="max-h-[70vh] rounded shadow-lg" />
          <div className="mt-4 flex gap-4">
            <Button onClick={handleOCR} disabled={loading}>
              <Brain size={16} className="mr-1" />
              {loading ? "辨識中..." : "分析"}
            </Button>
            <Button variant="destructive" onClick={() => setSelectedImage(null)}>
              <X size={16} className="mr-1" /> 關閉
            </Button>
          </div>
        </div>
      )}

      {/* 卡片區 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* 拍照卡片 */}
        <Card
          onClick={startCamera}
          className="flex flex-col items-center justify-center h-40 cursor-pointer hover:bg-muted transition"
        >
          <Camera size={32} />
          <p className="text-sm mt-2">拍照</p>
        </Card>

        {/* 上傳圖片 */}
        <Card className="flex flex-col items-center justify-center h-40">
          <label className="cursor-pointer flex flex-col items-center">
            <Upload size={32} />
            <p className="text-sm mt-2">上傳圖片</p>
            <input type="file" accept="image/*" multiple onChange={uploadImages} className="hidden" />
          </label>
        </Card>

        {/* 圖片庫 */}
        <Card className="overflow-y-auto h-40 p-3">
          <div className="flex items-center mb-2 text-sm font-semibold space-x-2">
            <ImagePlus className="inline-block" size={16} />
            <span className="align-middle">圖片庫</span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {images.map((img, i) => (
              <img
                key={i}
                src={img}
                className="w-full h-20 object-cover rounded cursor-pointer hover:opacity-80"
                onClick={() => setSelectedImage(img)}
              />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}