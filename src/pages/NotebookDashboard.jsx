import React, { useState, useEffect } from "react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Search, Pencil, Trash2, Plus } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./NotebookDashboard.css";
import { useTranslation } from "react-i18next"; // 導入 useTranslation

export default function NotebookDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation('notebook'); // 指定 notebook 命名空間

  const [notes, setNotes] = useState([]);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const token = localStorage.getItem("token");
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    loadNotes();
  }, []);

  useEffect(() => {
    if (location.state?.reload) {
      loadNotes();
    }
  }, [location.state]);

  const loadNotes = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/note`, authHeader);
      const sorted = res.data.notes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      setNotes(sorted);
    } catch (err) {
      console.error("無法載入筆記", err);
    }
  };

  const formatDate = (isoDate) => {
    const d = new Date(isoDate);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  const addNote = async () => {
    const formatForMySQL = (d) => {
      return d.toISOString().slice(0, 19).replace("T", " ");
    };
    
    const now = formatForMySQL(new Date());
    const newNote = {
      title: t('newNoteTitle', { count: notes.length + 1 }), // 使用翻譯
      content: "",
      date: now,
      updatedAt: now,
    };
  
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/note`, newNote, authHeader);
      const createdNote = res.data.note;
      setNotes([createdNote, ...notes]);
      navigate("/note-detail", { state: createdNote });
    } catch (err) {
      console.error("新增筆記失敗", err);
    }
  };

  const startEditing = (note) => {
    setEditingNoteId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
  };

  const saveEditing = async () => {
    const now = new Date().toISOString();
    try {
      const res = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/note/${editingNoteId}`,
        { title: editTitle, content: editContent, updatedAt: now },
        authHeader
      );
      const updated = notes.map((note) =>
        note.id === editingNoteId ? { ...res.data.note } : note
      );
      const sorted = updated.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      setNotes(sorted);
      setEditingNoteId(null);
    } catch (err) {
      console.error("儲存筆記失敗", err);
    }
  };

  const cancelEditing = () => {
    setEditingNoteId(null);
  };

  const deleteNote = async (id) => {
    if (!window.confirm(t('confirmDelete'))) return; // 使用翻譯
  
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/note/${id}`, authHeader);
      setNotes(notes.filter((note) => note.id !== id));
    } catch (err) {
      console.error("刪除筆記失敗", err);
    }
  };

  function extractPlainTextFromTipTapJSON(json) {
    if (!json || typeof json !== 'object') return '';
    let text = '';
  
    if (Array.isArray(json.content)) {
      json.content.forEach((node) => {
        text += extractPlainTextFromTipTapJSON(node);
      });
    }
  
    if (json.type === 'text') {
      text += json.text || '';
    }
  
    return text;
  }

  return (
    <div className="notebook-dashboard">
      {/* Header */}
      <div className="header">
        <h2>{t('yourNotes')}</h2>
        <div className="search-container">
          <Search className="search-icon" size={16} />
          <Input
            placeholder={t('searchNotes')}
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Notes Container */}
      <div className="notes-container">
        {/* Add Note Button */}
        <div className="add-note" onClick={addNote}>
          <Plus size={48} />
          <span>{t('addNote')}</span>
        </div>

        {/* Notes */}
        {notes
          .filter((note) =>
            note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            note.content.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .map((note) => (
            <div
              key={note.id}
              className="note-card"
              onClick={() => {
                if (editingNoteId === note.id) return;
                navigate("/note-detail", {
                  state: {
                    id: note.id,
                    title: note.title,
                    content: note.content,
                    date: note.date,
                  },
                });
              }}
            >
              {editingNoteId === note.id ? (
                <div className="edit-form">
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="edit-title"
                    placeholder={t('noteTitlePlaceholder')}
                  />
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="edit-content"
                    placeholder={t('noteContentPlaceholder')}
                    rows={3}
                  />
                  <div className="edit-actions">
                    <button onClick={saveEditing} className="save-btn">{t('save')}</button>
                    <button onClick={cancelEditing} className="cancel-btn">{t('cancel')}</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="note-content">
                    <div className="note-title">{note.title || t('untitledNote')}</div>
                    <div className="note-preview">
                      {(() => {
                        try {
                          const parsed = typeof note.content === "string" ? JSON.parse(note.content) : note.content;
                          return extractPlainTextFromTipTapJSON(parsed.editor);
                        } catch {
                          return note.content;
                        }
                      })()}
                    </div>
                  </div>
                  <div className="note-footer">
                    <div className="note-date">{formatDate(note.updatedAt)}</div>
                    <div className="note-actions">
                      <Pencil
                        size={16}
                        className="edit-icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditing(note);
                        }}
                      />
                      <Trash2
                        size={16}
                        className="delete-icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNote(note.id);
                        }}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}