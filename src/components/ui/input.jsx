import React from "react";

export function Input({ className = "", ...props }) {
  return (
    <input
      className={`border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 ${className}`}
      {...props}
    />
  );
}
