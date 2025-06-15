import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEditor, EditorContent } from "@tiptap/react"; // 導入 Tiptap
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import { useTranslation } from "react-i18next"; // 導入 useTranslation

function NoteDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [note, setNote] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const token = localStorage.getItem("token");
    const { t } = useTranslation('noteDetail'); // 指定 noteDetail 命名空間

    // 解析 JSON 內容的工具函數
    const isValidTipTapJson = (data) => {
        return data?.editor?.type === "doc" && Array.isArray(data?.editor?.content);
    };

    const parseContent = (content) => {
        try {
            return typeof content === "string" ? JSON.parse(content) : content;
        } catch {
            return { editor: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: content || "" }] }] }, analysis: [] };
        }
    };

    // 初始化只讀編輯器用於渲染
    const editor = useEditor({
        extensions: [StarterKit, Underline, Highlight.configure({ multicolor: true })],
        content: note?.content?.editor || { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "" }] }] },
        editable: false, // 設為只讀模式，僅用於渲染
        onUpdate: ({ editor }) => {}, // 不需要 onUpdate，因為是只讀
    });

    useEffect(() => {
        // 抓單篇筆記內容
        fetch(`${process.env.REACT_APP_API_URL}/api/notes/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then((res) => res.json())
            .then((data) => {
                if (data && typeof data.content === "object") {
                    setNote({ ...data, content: parseContent(data.content) });
                    editor?.commands.setContent(data.content.editor || { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "" }] }] });
                } else {
                    setNote({ ...data, content: parseContent(data.content) });
                    editor?.commands.setContent(parseContent(data.content).editor || { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "" }] }] });
                }
            })
            .catch((err) => {
                console.error(t('loadNoteFailed'), err);
                setNote(null);
            });

        // 抓留言串
        fetch(`${process.env.REACT_APP_API_URL}/api/notes/${id}/replies`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then((res) => res.json())
            .then((data) => setComments(data))
            .catch((err) => {
                console.error(t('loadCommentsFailed'), err);
                setComments([]);
            });
    }, [id, token]);

    useEffect(() => {
        // 當 note 內容更新時，同步更新編輯器內容
        if (note && editor) {
            editor.commands.setContent(note.content.editor || { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "" }] }] });
        }
    }, [note, editor]);

    const handleBack = () => {
        navigate("/sharing");
    };

    const handleAddComment = () => {
        if (newComment.trim() === "") return;

        fetch(`${process.env.REACT_APP_API_URL}/api/notes/${id}/replies`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ text: newComment })
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    setComments([...comments, data.comment]);
                    setNewComment("");
                } else {
                    console.error(t('addCommentFailed'), data.message);
                }
            })
            .catch((err) => {
                console.error(t('addCommentFailed'), err);
            });
    };

    if (!note) {
        return (
            <div style={{ padding: "24px" }}>
                <button onClick={handleBack} style={backBtnStyle}>{t('backToList')}</button>
                <p style={{ marginTop: "20px" }}>{t('noteNotFound')}</p>
            </div>
        );
    }

    return (
        <div style={{ padding: "24px" }}>
            <button onClick={handleBack} style={backBtnStyle}>{t('backToList')}</button>

            {/* 筆記內容 */}
            <h2 style={{ fontSize: "24px", fontWeight: "bold", marginTop: "20px" }}>{note.title}</h2>
            <p style={{ color: "#666", margin: "12px 0" }}>{t('author', { author: note.author })}</p>
            <EditorContent editor={editor} className="min-h-[200px] p-2 outline-none" />

            {/* 討論區 */}
            <div style={{ marginTop: "40px" }}>
                <h3>{t('discussionArea')}</h3>

                {/* 新增留言輸入框 */}
                <div style={{ marginTop: "20px" }}>
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={t('commentPlaceholder')}
                        style={textareaStyle}
                    />
                    <button onClick={handleAddComment} style={submitBtnStyle}>{t('submitComment')}</button>
                </div>

                <div style={{ marginTop: "16px" }}>
                    {comments.length === 0 ? (
                        <p style={{ color: "#999" }}>{t('noComments')}</p>
                    ) : (
                        comments.map((cmt, idx) => (
                            <div key={idx} style={commentStyle}>
                                <div>{cmt.text}</div>
                                <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>{cmt.timestamp}</div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

const backBtnStyle = {
    backgroundColor: "#f0f0f0",
    padding: "8px 16px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px"
};

const commentStyle = {
    backgroundColor: "#f9f9f9",
    padding: "8px",
    borderRadius: "6px",
    marginBottom: "8px"
};

const textareaStyle = {
    width: "100%",
    minHeight: "80px",
    marginTop: "10px",
    padding: "8px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    resize: "vertical"
};

const submitBtnStyle = {
    marginTop: "8px",
    padding: "8px 16px",
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer"
};

export default NoteDetail;