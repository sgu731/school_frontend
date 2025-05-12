import React, { useState, useEffect } from "react";
import Tesseract from "tesseract.js";
import { Button } from "../components/ui/button";
import { Trash2, Brain } from "lucide-react";
import axios from "axios";

export default function GalleryPage() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const token = localStorage.getItem("token");
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  // 讀取圖片
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/images", authHeader);
        setImages(res.data.images || []);
      } catch (err) {
        console.error("讀取圖片失敗", err);
        alert("❌ 無法載入圖片庫");
      }
    };

    fetchImages();
  }, []);

  // 刪除圖片
  const deleteImage = async (id) => {
    if (!window.confirm("確定要刪除這張圖片？")) return;
    try {
      await axios.delete(`http://localhost:5000/api/images/${id}`, authHeader);
      setImages(images.filter((img) => img.id !== id));
    } catch (err) {
      console.error("刪除失敗", err);
      alert("❌ 刪除圖片失敗");
    }
  };

  // OCR 並加入筆記
  const handleOCR = async (imageBase64) => {
    setLoading(true);
    try {
      const { data } = await Tesseract.recognize(imageBase64, "chi_tra+eng", {
        logger: (m) => console.log(m),
      });
      const text = data.text.trim();
      if (!text) {
        alert("辨識不到任何文字！");
        return;
      }

      const confirmAdd = window.confirm("OCR 結果如下：\n\n" + text + "\n\n是否加入筆記？");
      if (confirmAdd) {
        const now = new Date().toISOString();
        await axios.post(
          "http://localhost:5000/api/note",
          {
            title: "從圖片轉文字",
            content: text,
          },
          authHeader
        );
        alert("✅ 已成功加入筆記！");
      }
    } catch (error) {
      console.error("OCR失敗：", error);
      alert("❌ OCR 辨識失敗，請稍後再試！");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">圖片庫</h1>

      {images.length === 0 ? (
        <p className="text-gray-500">尚無圖片，請從相機頁新增！</p>
      ) : (
        <div className="flex overflow-x-auto gap-4 pb-2">
          {images.map((img) => (
            <div
              key={img.id}
              className="relative group border border-gray-300 rounded-xl p-2 shadow hover:shadow-md transition bg-white flex-shrink-0"
              style={{
                width: "200px",
                height: "200px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <img
                src={img.image_data}
                alt={`img-${img.id}`}
                onClick={() => setPreviewImage(img.image_data)}
                className="rounded cursor-pointer"
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "cover",
                  borderRadius: "8px",
                }}
              />
              <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition">
                <Button variant="destructive" size="icon" onClick={() => deleteImage(img.id)}>
                  <Trash2 size={16} />
                </Button>
                <Button size="icon" onClick={() => handleOCR(img.image_data)}>
                  <Brain size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 圖片預覽彈窗 */}
      {previewImage && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center">
          <div className="relative">
            <img
              src={previewImage}
              alt="preview"
              className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-lg"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-2 right-2 bg-white text-black rounded-full px-3 py-1 text-sm shadow hover:bg-gray-200"
            >
              關閉
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <p className="text-white text-xl">辨識中...</p>
        </div>
      )}
    </div>
  );
}