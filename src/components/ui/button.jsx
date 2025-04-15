import React from "react";
import { cn } from "../../lib/utils";

export function Button({
  className = "",
  children,
  variant = "default",
  ...props
}) {
  const base =
    "inline-flex items-center justify-center rounded-md text-sm font-medium px-4 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50";

  const variants = {
    default: "bg-orange-500 text-white hover:bg-orange-600 focus:ring-orange-500",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-100",
    destructive: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500",
  };

  return (
    <button className={cn(base, variants[variant], className)} {...props}>
      {children}
    </button>
  );
}

