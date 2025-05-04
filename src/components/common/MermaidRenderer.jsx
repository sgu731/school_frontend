import React, { useEffect, useRef } from "react";
import mermaid from "mermaid";

export default function MermaidRenderer({ chart }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!chart) return;

    const trimmed = chart.trim();

    // ✅ 不是以 Mermaid 語法開頭，就不嘗試渲染
    if (!trimmed.startsWith("graph") && !trimmed.startsWith("flowchart") && !trimmed.startsWith("sequenceDiagram")) {
      if (containerRef.current) {
        containerRef.current.innerHTML = `<div class="text-gray-500 italic">⚠️ 無法識別的 Mermaid 圖表內容</div>`;
      }
      return;
    }

    try {
      mermaid.parse(trimmed); // 先語法檢查
    } catch (err) {
      console.error("❌ Mermaid 語法錯誤：", err);
      if (containerRef.current) {
        containerRef.current.innerHTML = `<div class="text-red-500">⚠️ Mermaid 語法錯誤，無法渲染圖表。</div>`;
      }
      return;
    }

    mermaid.initialize({ startOnLoad: false });
    mermaid.render("graphDiv", trimmed, (svgCode) => {
      if (containerRef.current) {
        containerRef.current.innerHTML = svgCode;
      }
    });
  }, [chart]);

  return <div ref={containerRef} className="my-4" />;
}