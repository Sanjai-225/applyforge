"use client";

import React from "react";
import {
  LayoutDashboard,
  Briefcase,
  Crosshair,
  Users,
  AlertTriangle,
  MessageSquare,
  Bell,
  Share2,
  BarChart3,
  History,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export type AdminTab =
  | "overview"
  | "jobs"
  | "tracker"
  | "students"
  | "trouble"
  | "chat"
  | "reminders"
  | "whatsapp"
  | "analytics"
  | "audit"
  | "settings";

interface AdminSidebarProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  unreadChatCount?: number;
  troubleCount?: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onLogout: () => void;
}

export function AdminSidebar({
  currentTab,
  onSelectTab,
  unreadChatCount = 0,
  troubleCount = 0,
  collapsed,
  onToggleCollapse,
  onLogout,
}: AdminSidebarProps) {
  const navItems = [
    {
      tab: "overview" as AdminTab,
      label: "Overview",
      icon: <LayoutDashboard className="h-5 w-5" />,
      color: "text-violet-400",
    },
    {
      tab: "jobs" as AdminTab,
      label: "Placement Drives",
      icon: <Briefcase className="h-5 w-5" />,
      color: "text-sky-400",
    },
    {
      tab: "tracker" as AdminTab,
      label: "Drive Tracker",
      icon: <Crosshair className="h-5 w-5" />,
      color: "text-cyan-400",
    },
    {
      tab: "students" as AdminTab,
      label: "Student Directory",
      icon: <Users className="h-5 w-5" />,
      color: "text-emerald-400",
    },
    {
      tab: "trouble" as AdminTab,
      label: "Trouble Reports",
      icon: <AlertTriangle className="h-5 w-5" />,
      color: "text-rose-400",
      badge: troubleCount > 0 ? troubleCount : undefined,
      badgeColor: "bg-rose-500 text-white",
    },
    {
      tab: "chat" as AdminTab,
      label: "Help Chat",
      icon: <MessageSquare className="h-5 w-5" />,
      color: "text-emerald-400",
      badge: unreadChatCount > 0 ? unreadChatCount : undefined,
      badgeColor: "bg-emerald-500 text-white animate-pulse",
    },
    {
      tab: "reminders" as AdminTab,
      label: "Reminders & Alerts",
      icon: <Bell className="h-5 w-5" />,
      color: "text-amber-400",
    },
    {
      tab: "whatsapp" as AdminTab,
      label: "WhatsApp Groups",
      icon: <Share2 className="h-5 w-5" />,
      color: "text-teal-400",
    },
    {
      tab: "analytics" as AdminTab,
      label: "Analytics",
      icon: <BarChart3 className="h-5 w-5" />,
      color: "text-purple-400",
    },
    {
      tab: "audit" as AdminTab,
      label: "Audit & Logs",
      icon: <History className="h-5 w-5" />,
      color: "text-slate-400",
    },
    {
      tab: "settings" as AdminTab,
      label: "Settings",
      icon: <Settings className="h-5 w-5" />,
      color: "text-surface-400",
    },
  ];

  return (
    <aside
      className={`relative flex flex-col justify-between glass-sidebar transition-all duration-300 z-30 shrink-0 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Top Branding */}
      <div>
        <div className="flex h-20 items-center justify-between px-5 border-b border-white/10">
          {!collapsed ? (
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary-600 via-primary-500 to-pink-500 shadow-lg shadow-primary-900/40 shrink-0">
                <Briefcase className="h-5 w-5 text-white" />
              </div>
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-white tracking-wide text-base">ApplyForge</span>
                  <span className="rounded-full bg-primary-500/30 border border-primary-500/40 px-1.5 py-0.5 text-[9px] font-bold text-primary-300">
                    v2.0
                  </span>
                </div>
                <p className="text-[11px] text-surface-400 font-medium truncate">Placement Officer Cell</p>
              </div>
            </div>
          ) : (
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary-600 to-pink-500 shadow-md">
              <Briefcase className="h-5 w-5 text-white" />
            </div>
          )}

          <button
            onClick={onToggleCollapse}
            className="hidden md:flex h-7 w-7 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-surface-400 hover:text-white hover:bg-white/10 transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation list */}
        <nav className="p-3 space-y-1.5 overflow-y-auto max-h-[calc(100vh-170px)] custom-scroll">
          {navItems.map((item) => {
            const isActive = currentTab === item.tab;
            return (
              <button
                key={item.tab}
                onClick={() => onSelectTab(item.tab)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all group ${
                  isActive
                    ? "bg-gradient-to-r from-primary-600/30 via-primary-500/20 to-transparent border border-primary-500/40 text-white shadow-lg shadow-primary-950/40"
                    : "text-surface-400 hover:text-surface-200 hover:bg-white/5 border border-transparent"
                } ${collapsed ? "justify-center px-0" : ""}`}
              >
                <span className={`shrink-0 transition-transform group-hover:scale-110 ${item.color}`}>
                  {item.icon}
                </span>

                {!collapsed && (
                  <span className="truncate flex-1 text-left">{item.label}</span>
                )}

                {item.badge !== undefined && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0 ${item.badgeColor} ${
                      collapsed ? "absolute top-2 right-2 px-1.5 py-0" : ""
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Profile & Logout */}
      <div className="p-3 border-t border-white/10">
        {!collapsed ? (
          <div className="flex items-center justify-between rounded-2xl bg-surface-900/60 border border-white/5 p-3">
            <div className="flex items-center gap-2.5 truncate">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shrink-0 shadow">
                PO
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate">Placement Officer</p>
                <p className="text-[10px] text-surface-400 truncate">Administrator</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              title="Log out"
              className="rounded-xl p-2 text-surface-400 hover:bg-rose-500/20 hover:text-rose-400 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onLogout}
            title="Log out"
            className="w-full flex items-center justify-center p-3 rounded-2xl text-surface-400 hover:bg-rose-500/20 hover:text-rose-400 transition-colors"
          >
            <LogOut className="h-5 w-5" />
          </button>
        )}
      </div>
    </aside>
  );
}
