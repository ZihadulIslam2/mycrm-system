"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/leads", label: "Leads", icon: "👥" },
  { href: "/email", label: "Email Center", icon: "📧" },
  { href: "/sequences", label: "Sequences", icon: "🔄" },
  { href: "/analytics", label: "Analytics", icon: "📈" },
  { href: "/daily-logs", label: "Daily Logs", icon: "📝" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 flex flex-col z-50">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">CRM System</h1>
        <p className="text-sm text-gray-500 mt-1">Lead Management</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
              pathname === item.href
                ? "bg-blue-50 text-blue-700 border border-blue-100"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-400">CRM v1.0</div>
      </div>
    </aside>
  );
}
