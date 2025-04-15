import React from "react";

export function Avatar({ src, alt = "avatar", className = "" }) {
  return src ? (
    <img
      src={src}
      alt={alt}
      className={`w-9 h-9 rounded-full object-cover ${className}`}
    />
  ) : (
    <div
      className={`w-9 h-9 rounded-full bg-gray-400 flex items-center justify-center text-white text-sm font-bold ${className}`}
    >
      U
    </div>
  );
}
