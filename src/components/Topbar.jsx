import React from "react";

export default function Topbar() {
  return (
    <header className="h-14 bg-white border-b flex items-center justify-between px-4 shadow-sm">
      <div className="text-lg font-semibold">歡迎使用逮救補</div>
      <div className="text-sm text-muted-foreground">📚 學習就是超能力！</div>
    </header>
  );
}