"use client";

import React, { useState } from "react";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  BarChart3,
  MessageCircle,
  Bell,
  MessageSquare,
  ScrollText,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export type AdminView =
  | "overview"
  | "drives"
  | "students"
  | "analytics"
  | "help-chat"
  | "notifications"
  | "whatsapp"
  | "audit-logs"
  | "settings";

interface SidebarItem {
  key: AdminView;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface AdminSidebarProps {
  activeView: AdminView;
  onViewChange: (view: AdminView) => void;
  badges?: Partial<Record<AdminView, number>>;
}

export function AdminSidebar({ activeView, onViewChange, badges = {} }: AdminSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const items: SidebarItem[] = [
    { key: "overview", label: "Overview", icon: <LayoutDashboard className="h-5 w-5" /> },
    { key: "drives", label: "Drives", icon: <Briefcase className="h-5 w-5" />, badge: badges.drives },
    { key: "students", label: "Students", icon: <Users className="h-5 w-5" />, badge: badges.students },
    { key: "analytics", label: "Analytics", icon: <BarChart3 className="h-5 w-5" /> },
    { key: "help-chat", label: "Help Chat", icon: <MessageCircle className="h-5 w-5" />, badge: badges["help-chat"] },
    { key: "notifications", label: "Notifications", icon: <Bell className="h-5 w-5" /> },
    { key: "whatsapp", label: "WhatsApp Groups", icon: <MessageSquare className="h-5 w-5" />, badge: badges.whatsapp },
    { key: "audit-logs", label: "Audit & Logs", icon: <ScrollText className="h-5 w-5" /> },
    { key: "settings", label: "Settings", icon: <Settings className="h-5 w-5" /> },
  ];

  return (
    <aside
      className={`sticky top-0 h-screen flex flex-col bg-surface-900 border-r border-surface-700 transition-all duration-300 z-50 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-16 border-b border-surface-700 shrink-0">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700">
          <Briefcase className="h-4 w-4 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-sm font-bold text-white truncate">ApplyForge</h1>
            <p className="text-[10px] text-surface-400 -mt-0.5">Officer Portal</p>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {items.map((item) => {
          const isActive = activeView === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onViewChange(item.key)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-primary-600/20 text-primary-300 border border-primary-500/30"
                  : "text-surface-400 hover:bg-surface-800 hover:text-surface-200"
              }`}
            >
              <span className="shrink-0">{item.icon}</span>
              {!collapsed && (
                <>
                  <span className="flex-1 text-left truncate">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="ml-auto rounded-full bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 text-[10px] font-bold min-w-[20px] text-center">
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </>
              )}
              {collapsed && item.badge !== undefined && item.badge > 0 && (
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="border-t border-surface-700 p-2 shrink-0">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-surface-500 hover:bg-surface-800 hover:text-surface-300 transition-all"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

