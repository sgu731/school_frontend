import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Italic, Underline as UnderlineIcon, Highlighter, Eraser } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import "./NoteEditor.css"; 

export default function NoteEditor({ value, onChange }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Highlight.configure({ multicolor: true }),
      Placeholder.configure({
        placeholder: "請輸入筆記內容...",
        emptyEditorClass: "is-editor-empty",
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
  });

  return (
    <div className="space-y-2">
      <TooltipProvider>
        <ToggleGroup type="multiple" className="flex gap-1 flex-wrap">
          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem asChild value="bold" aria-label="粗體" pressed={editor?.isActive("bold")}>
                <button onClick={() => editor?.chain().focus().toggleBold().run()} className="note-editor-btn">
                  <Bold className="w-4 h-4" />
                </button>
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent>粗體</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem asChild value="italic" aria-label="斜體" pressed={editor?.isActive("italic")}>
                <button onClick={() => editor?.chain().focus().toggleItalic().run()} className="note-editor-btn">
                  <Italic className="w-4 h-4" />
                </button>
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent>斜體</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem asChild value="underline" aria-label="底線" pressed={editor?.isActive("underline")}>
                <button onClick={() => editor?.chain().focus().toggleUnderline().run()} className="note-editor-btn">
                  <UnderlineIcon className="w-4 h-4" />
                </button>
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent>底線</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem asChild value="highlight-yellow" aria-label="黃螢光" pressed={editor?.isActive("highlight", { color: "yellow" })}>
                <button onClick={() => editor?.chain().focus().toggleHighlight({ color: "yellow" }).run()} className="note-editor-btn">
                  <Highlighter className="w-4 h-4" style={{ stroke: '#facc15' }} />
                </button>
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent>黃螢光</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem asChild value="highlight-green" aria-label="綠螢光" pressed={editor?.isActive("highlight", { color: "lightgreen" })}>
                <button onClick={() => editor?.chain().focus().toggleHighlight({ color: "lightgreen" }).run()} className="note-editor-btn">
                  <Highlighter className="w-4 h-4" style={{ stroke: '#4ade80' }} />
                </button>
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent>綠螢光</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem asChild value="highlight-blue" aria-label="藍螢光" pressed={editor?.isActive("highlight", { color: "skyblue" })}>
                <button onClick={() => editor?.chain().focus().toggleHighlight({ color: "skyblue" }).run()} className="note-editor-btn">
                  <Highlighter className="w-4 h-4" style={{ stroke: '#38bdf8' }} />
                </button>
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent>藍螢光</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem asChild value="highlight-clear" aria-label="清除螢光">
                <button onClick={() => editor?.chain().focus().unsetHighlight().run()} className="note-editor-btn">
                  <Eraser className="w-4 h-4" />
                </button>
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent>清除螢光</TooltipContent>
          </Tooltip>
        </ToggleGroup>
      </TooltipProvider>

      <div className="border border-gray-300 rounded-md bg-white p-2 focus-within:ring-2 focus-within:ring-gray-300">
        <EditorContent
          editor={editor}
          className="min-h-[200px] p-2 outline-none"
        />
      </div>
    </div>
  );
}