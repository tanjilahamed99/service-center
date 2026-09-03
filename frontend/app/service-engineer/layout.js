"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  ListChecks,
  UserCircle,
  LogOut,
  Menu,
  Bell,
} from "lucide-react";
import PrivateRoutes from "@/components/PrivateRoutes/PrivateRoutes";
import { toast } from "sonner";
import { useAuthStore } from "@/features/Useauthstore";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/service-engineer", icon: LayoutGrid },
  { label: "Jobs", href: "/service-engineer/jobs", icon: ListChecks },
  { label: "Profile", href: "/service-engineer/profile", icon: UserCircle },
];

function isActive(href, pathname) {
  return href === "/service-engineer"
    ? pathname === "/service-engineer"
    : pathname.startsWith(href);
}

function SidebarContent({ pathname, onNavigate }) {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const handleLogout = () => {
    clearAuth();
    toast.success("Logged out.");
  };
  return (
    <div className="flex h-full flex-col bg-navy-900">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-6">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-electric-500/15 ring-1 ring-electric-400/40">
          <svg
            viewBox="0 0 24 24"
            className="h-4.5 w-4.5 text-electric-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75">
            <rect x="7" y="7" width="10" height="10" rx="1.5" />
            <path
              strokeLinecap="round"
              d="M9 3v2M15 3v2M9 19v2M15 19v2M3 9h2M3 15h2M19 9h2M19 15h2"
            />
          </svg>
        </span>
        <div>
          <p className="text-sm font-semibold text-white">ServicePoint</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-electric-400">
            Service Center
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href, pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-electric-500/15 text-white ring-1 ring-electric-400/40"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}>
              <Icon
                className={`h-4.5 w-4.5 ${active ? "text-electric-400" : "text-slate-500"}`}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-white/10 p-3">
        <button
          onClick={handleLogout}
          type="button"
          className="flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-white">
          <LogOut className="h-4.5 w-4.5 text-slate-500" />
          Log out
        </button>
      </div>
    </div>
  );
}

export default function ServiceCenterLayout({ children }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  const currentLabel =
    NAV_ITEMS.find((item) => isActive(item.href, pathname))?.label ??
    "Dashboard";

  return (
    <PrivateRoutes allowedRoles={["service-engineer"]}>
      <div className="min-h-screen bg-slate-50">
        {/* Desktop sidebar */}
        <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:block lg:w-64">
          <SidebarContent pathname={pathname} />
        </aside>

        {/* Mobile sidebar (drawer) */}
        {isMobileOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div
              className="absolute inset-0 bg-navy-950/60 backdrop-blur-sm"
              onClick={() => setIsMobileOpen(false)}
              aria-hidden="true"
            />
            <div className="absolute inset-y-0 left-0 w-64 shadow-xl">
              <SidebarContent
                pathname={pathname}
                onNavigate={() => setIsMobileOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Content column */}
        <div className="lg:pl-64">
          {/* Topbar */}
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-3.5 backdrop-blur sm:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsMobileOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden"
                aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </button>
              <h1 className="text-base font-semibold text-navy-900 sm:text-lg">
                {currentLabel}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                aria-label="Notifications">
                <Bell className="h-5 w-5" />
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-amber-400" />
              </button>
              <div className="flex items-center gap-2.5 border-l border-slate-200 pl-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-900 text-xs font-semibold text-white">
                  SC
                </span>
                <span className="hidden text-sm font-medium text-navy-900 sm:block">
                  Vertex Service Point
                </span>
              </div>
            </div>
          </header>

          <main className="px-4 py-6 sm:px-6 lg:py-8">{children}</main>
        </div>
      </div>
    </PrivateRoutes>
  );
}
