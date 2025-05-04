// src/components/ui/card.jsx
import React from "react";

export const Card = React.forwardRef(({ className = "", children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={`rounded-md border border-gray-300 bg-white shadow-sm hover:shadow-md transition ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = "Card";
