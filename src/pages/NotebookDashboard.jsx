import React, { useState, useEffect } from "react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Search, Pencil, Trash2, Plus } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

export default function NotebookDashboard() {
  const navigate = useNavigate();
  const location = useLocation();

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
      title: `新筆記 ${notes.length + 1}`,
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
    if (!window.confirm("確定要刪除這筆筆記嗎？")) return;
  
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
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">你的筆記</h2>
        <div className="relative">
          <Search className="absolute left-2 top-2 text-gray-400" size={16} />
          <Input
            placeholder="搜尋"
            className="pl-8 w-64 border rounded-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Notes Flex Container */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        {/* Add Note Button */}
        <div
          onClick={addNote}
          style={{
            width: "150px",
            height: "150px",
            border: "2px solid #d1d5db",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
            borderRadius: "12px",
            cursor: "pointer",
            transition: "background-color 0.2s",
            padding: "12px",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f3f4f6")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          <Plus size={48} color="#9ca3af" />
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
              style={{
                width: "150px",
                height: "150px",
                border: "2px solid #d1d5db",
                borderRadius: "12px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: "12px",
                position: "relative",
                cursor: "pointer",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f3f4f6")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              {editingNoteId === note.id ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    style={{
                      fontSize: "14px",
                      fontWeight: "bold",
                      padding: "4px",
                      border: "1px solid #ccc",
                      borderRadius: "6px",
                    }}
                  />
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    style={{
                      fontSize: "12px",
                      padding: "4px",
                      border: "1px solid #ccc",
                      borderRadius: "6px",
                      resize: "none",
                    }}
                    rows={2}
                  />
                  <div style={{ display: "flex", gap: "4px", justifyContent: "flex-end" }}>
                    <button
                      onClick={saveEditing}
                      style={{
                        fontSize: "12px",
                        backgroundColor: "#3b82f6",
                        color: "#fff",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      儲存
                    </button>
                    <button
                      onClick={cancelEditing}
                      style={{
                        fontSize: "12px",
                        backgroundColor: "#fff",
                        color: "#374151",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        border: "1px solid #d1d5db",
                        cursor: "pointer",
                      }}
                    >
                      取消
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div
                    style={{
                      flex: 1,
                      overflow: "auto",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <div style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "4px" }}>
                      {note.title || "（未命名筆記）"}
                    </div>
                    <div style={{ fontSize: "12px", color: "#6b7280", wordBreak: "break-word" }}>
                      {(() => {
                        try {
                          const parsed = typeof note.content === "string" ? JSON.parse(note.content) : note.content;
                          return extractPlainTextFromTipTapJSON(parsed.editor);
                        } catch {
                          return note.content; // fallback：顯示原始字串
                        }
                      })()}
                    </div>
                  </div>
                  <div style={{ fontSize: "10px", color: "#9ca3af", marginTop: "4px" }}>
                    {formatDate(note.updatedAt)}
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                      display: "flex",
                      gap: "4px",
                    }}
                  >
                    <Pencil
                      size={16}
                      color="#3b82f6"
                      style={{ cursor: "pointer" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(note);
                      }}
                    />
                    <Trash2
                      size={16}
                      color="#ef4444"
                      style={{ cursor: "pointer" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNote(note.id);
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}