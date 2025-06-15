import React, { useState, useEffect } from "react";
import Tesseract from "tesseract.js";
import { Trash2, Brain } from "lucide-react";
import axios from "axios";
import "./GalleryPage.css";
import { useTranslation } from 'react-i18next'; // 導入 useTranslation

export default function GalleryPage() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const { t } = useTranslation('galleryPage'); // 指定 galleryPage 命名空間

  const token = localStorage.getItem("token");
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/images`, authHeader);
        setImages(res.data.images || []);
      } catch (err) {
        console.error(t('fetchImagesFailed'), err);
        alert(t('loadGalleryError'));
      }
    };

    fetchImages();
  }, []);

  const deleteImage = async (id) => {
    if (!window.confirm(t('confirmDeleteImage'))) return;
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/images/${id}`, authHeader);
      setImages(images.filter((img) => img.id !== id));
    } catch (err) {
      console.error(t('deleteFailed'), err);
      alert(t('deleteImageError'));
    }
  };

  const handleOCR = async (imageBase64) => {
    setLoading(true);
    try {
      const { data } = await Tesseract.recognize(imageBase64, "chi_tra+eng+jpn", {
        logger: (m) => console.log(m),
      });
      const text = data.text.trim();
      if (!text) {
        alert(t('noTextRecognized'));
        return;
      }

      const confirmAdd = window.confirm(t('ocrResultConfirm', { text: text }));
      if (confirmAdd) {
        const now = new Date().toISOString();
        await axios.post(
          `${process.env.REACT_APP_API_URL}/api/note`,
          {
            title: t('noteTitleFromImage'),
            content: text,
          },
          authHeader
        );
        alert(t('noteAddedSuccessfully'));
      }
    } catch (error) {
      console.error(t('ocrFailed'), error);
      alert(t('ocrError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">{t('gallery')}</h1>

      {images.length === 0 ? (
        <p className="text-gray-500">{t('noImagesYet')}</p>
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
                <button className="gallery-btn-icon" onClick={() => deleteImage(img.id)}>
                  <Trash2 size={16} />
                </button>
                <button className="gallery-btn-icon" onClick={() => handleOCR(img.image_data)}>
                  <Brain size={16} />
                </button>
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
              className="gallery-btn absolute top-2 right-2"
            >
              {t('close')}
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <p className="text-white text-xl">{t('recognizing')}</p>
        </div>
      )}
    </div>
  );
}