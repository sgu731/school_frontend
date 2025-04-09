import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Search, Pencil, Trash2, Save, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function NotebookDashboard() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    const imported = JSON.parse(localStorage.getItem("importedNotes") || "[]");
    const formatted = imported.map((item, i) => ({
      id: Date.now() + i,
      title: item.title || "從語音轉文字",
      content: item.content || "",
      date: new Date(item.date).toLocaleString("zh-TW"),
    }));
    setNotes(formatted);
  }, []);

  const addNote = () => {
    const newNote = {
      id: Date.now(),
      title: `新筆記 ${notes.length + 1}`,
      content: "",
      date: new Date().toLocaleString("zh-TW", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
    };
    setNotes([...notes, newNote]);
  };

  const startEditing = (note) => {
    setEditingNoteId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
  };

  const saveEditing = () => {
    const updated = notes.map((note) =>
      note.id === editingNoteId
        ? { ...note, title: editTitle, content: editContent }
        : note
    );
    setNotes(updated);
    setEditingNoteId(null);
    const saved = updated.map(({ title, content, date }) => ({ title, content, date }));
    localStorage.setItem("importedNotes", JSON.stringify(saved));
  };

  const cancelEditing = () => {
    setEditingNoteId(null);
  };

  const deleteNote = (id) => {
    if (window.confirm("確定要刪除這筆筆記嗎？")) {
      const remaining = notes.filter(note => note.id !== id);
      setNotes(remaining);
      localStorage.setItem("importedNotes", JSON.stringify(remaining));
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">你的筆記</h1>
        <div className="relative">
          <Search className="absolute left-2 top-2 text-gray-400" size={16} />
          <Input placeholder="搜尋" className="pl-8 w-64 border rounded-md" />
        </div>
        <Avatar className="bg-gray-300" />
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* New Note Tile */}
        <Card
          className="flex flex-col items-center justify-center h-40 border-dashed border-2 border-gray-300 cursor-pointer"
          onClick={addNote}
        >
          <span className="text-3xl">+</span>
          <p className="text-sm mt-2">新增筆記</p>
        </Card>

        {/* Existing Notes */}
        {notes.map((note) => (
          <Card
            key={note.id}
            className="p-4 h-40 flex flex-col justify-between relative cursor-pointer"
            onClick={() =>
              editingNoteId === note.id ? null :
              navigate("/note", {
                state: {
                  title: note.title,
                  content: note.content,
                },
              })
           }
          >
            {editingNoteId === note.id ? (
              <div className="flex flex-col gap-2">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="text-base font-semibold"
                />
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="text-sm p-2 border rounded resize-none"
                  rows={2}
                />
                <div className="flex gap-2 justify-end">
                  <Button onClick={saveEditing} size="sm" className="flex items-center gap-1">
                    <Save size={14} /> 儲存
                  </Button>
                  <Button variant="outline" onClick={cancelEditing} size="sm" className="flex items-center gap-1">
                    <X size={14} /> 取消
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <p className="text-lg font-semibold">{note.title}</p>
                  <p className="text-sm text-gray-500">{note.date}</p>
                  {note.content && (
                    <p className="text-sm text-gray-700 mt-1 truncate">{note.content}</p>
                  )}
                </div>
                <div className="absolute top-2 right-2 flex space-x-2">
                  <Pencil
                    size={16}
                    className="text-blue-500 cursor-pointer"
                    onClick={() => startEditing(note)}
                  />
                  <Trash2
                    size={16}
                    className="text-red-500 cursor-pointer"
                    onClick={() => deleteNote(note.id)}
                  />
                </div>
              </>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}