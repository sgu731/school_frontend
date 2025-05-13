// NoteEditor.jsx
import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Italic, Underline as UnderlineIcon, Highlighter, Eraser } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

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
        <ToggleGroup type="multiple" className="flex gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem
                value="bold"
                aria-label="粗體"
                onClick={() => editor?.chain().focus().toggleBold().run()}
                pressed={editor?.isActive("bold")}
              >
                <Bold className="w-4 h-4" />
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent>粗體</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem
                value="italic"
                aria-label="斜體"
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                pressed={editor?.isActive("italic")}
              >
                <Italic className="w-4 h-4" />
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent>斜體</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem
                value="underline"
                aria-label="底線"
                onClick={() => editor?.chain().focus().toggleUnderline().run()}
                pressed={editor?.isActive("underline")}
              >
                <UnderlineIcon className="w-4 h-4" />
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent>底線</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem
                value="highlight-yellow"
                aria-label="黃螢光"
                className="text-yellow-500"
                onClick={() => editor?.chain().focus().toggleHighlight({ color: "yellow" }).run()}
                pressed={editor?.isActive("highlight", { color: "yellow" })}
              >
                <Highlighter className="w-4 h-4" style={{ stroke: '#facc15' }} /> 
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent>黃螢光</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem
                value="highlight-green"
                aria-label="綠螢光"
                className="text-green-500" 
                onClick={() => editor?.chain().focus().toggleHighlight({ color: "lightgreen" }).run()}
                pressed={editor?.isActive("highlight", { color: "lightgreen" })}
              >
                <Highlighter className="w-4 h-4" style={{ stroke: '#4ade80' }} /> 
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent>綠螢光</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem
                value="highlight-blue"
                aria-label="藍螢光"
                className="text-sky-500"
                onClick={() => editor?.chain().focus().toggleHighlight({ color: "skyblue" }).run()}
                pressed={editor?.isActive("highlight", { color: "skyblue" })}
              >
                <Highlighter className="w-4 h-4" style={{ stroke: '#38bdf8' }} /> 
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent>藍螢光</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem
                value="highlight-clear"
                aria-label="清除螢光"
                onClick={() => editor?.chain().focus().unsetHighlight().run()}
              >
                <Eraser className="w-4 h-4" />
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
