import React, { useState, useEffect } from "react";
import Tesseract from "tesseract.js";
import { Button } from "../components/ui/button";
import { Trash2, Brain } from "lucide-react";

export default function GalleryPage() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const imported = JSON.parse(localStorage.getItem("importedImages") || "[]");
    setImages(imported);
  }, []);

  const deleteImage = (index) => {
    const updated = images.filter((_, i) => i !== index);
    setImages(updated);
    localStorage.setItem("importedImages", JSON.stringify(updated));
  };

  const handleOCR = async (image) => {
    setLoading(true);
    try {
      const { data } = await Tesseract.recognize(image, "chi_tra+eng", {
        logger: (m) => console.log(m),
      });
      const text = data.text.trim();
      if (!text) {
        alert("辨識不到任何文字！");
        return;
      }

      const confirmAdd = window.confirm("OCR 結果如下：\n\n" + text + "\n\n是否加入筆記？");
      if (confirmAdd) {
        const newNote = {
          title: "從圖片轉文字",
          content: text,
          date: new Date().toISOString(),
        };
        const prevNotes = JSON.parse(localStorage.getItem("importedNotes") || "[]");
        const updatedNotes = [...prevNotes, newNote];
        localStorage.setItem("importedNotes", JSON.stringify(updatedNotes));
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
          {images.map((img, index) => (
            <div
              key={index}
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
                src={img}
                alt={`img-${index}`}
                className="rounded"
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "cover",
                  borderRadius: "8px",
                }}
              />
              <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition">
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => deleteImage(index)}
                >
                  <Trash2 size={16} />
                </Button>
                <Button size="icon" onClick={() => handleOCR(img)}>
                  <Brain size={16} />
                </Button>
              </div>
            </div>
          ))}
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
