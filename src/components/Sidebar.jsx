import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BookOpen,
  Camera,
  Mic,
  BarChart2,
  GraduationCap,
  Users,
  Share2,
  Calendar,
} from "lucide-react";

const navItems = [
  { path: "/", label: "筆記", icon: <BookOpen size={18} /> },
  { path: "/camera", label: "相機", icon: <Camera size={18} /> },
  { path: "/voice", label: "語音", icon: <Mic size={18} /> },
  { path: "/tracker", label: "追蹤器", icon: <BarChart2 size={18} /> },
  { path: "/knowledge", label: "知識庫", icon: <GraduationCap size={18} /> },
  { path: "/studyroom", label: "自習室", icon: <Users size={18} /> },
  { path: "/forum", label: "論壇", icon: <Users size={18} /> },
  { path: "/sharing", label: "分享區", icon: <Share2 size={18} /> },
  { path: "/plan", label: "學習計畫", icon: <Calendar size={18} /> },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-56 bg-white border-r h-full p-4 flex flex-col gap-4 items-center">
      <Link to="/" className="flex flex-col items-center gap-2 mb-6">
        <img
          src="/logo.png"
          alt="Logo"
          className="w-14 h-14 object-contain"
        />
        <span className="text-sm text-muted-foreground tracking-wide">
          逮救補
        </span>
      </Link>

      <nav className="w-full flex flex-col gap-2">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition ${
              location.pathname === item.path ? "bg-muted font-semibold" : ""
            }`}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}