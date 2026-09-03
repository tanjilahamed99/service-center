"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import PrivateRoutes from "@/components/PrivateRoutes/PrivateRoutes";

import {
  LayoutDashboard,
  Building2,
  Wrench,
  UserRound,
  Database,
  UserCircle,
  LogOut,
  Menu,
  Bell,
  Users,
  Cpu,
} from "lucide-react";

const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Companies",
    href: "/admin/companies",
    icon: Building2,
  },
  {
    label: "Service Centers",
    href: "/admin/service-centers",
    icon: Wrench,
  },
  {
    label: "Service Engineers",
    href: "/admin/service-engineers",
    icon: UserRound,
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    label: "Master Data",
    href: "/admin/masters",
    icon: Database,
  },
  {
    label: "Profile",
    href: "/admin/profile",
    icon: UserCircle,
  },
];

function NavLink({ item, pathname, onClick }) {
  const isActive =
    item.href === "/admin"
      ? pathname === "/admin"
      : pathname.startsWith(item.href);

  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition ${
        isActive
          ? "bg-electric-500/15 text-white ring-1 ring-electric-400/40"
          : "text-slate-400 hover:bg-white/5 hover:text-white"
      }`}>
      <Icon
        size={18}
        strokeWidth={1.75}
        className={isActive ? "text-electric-400" : "text-slate-500"}
      />

      {item.label}
    </Link>
  );
}

function SidebarContent({ pathname, onNavigate }) {
  return (
    <div className="flex h-full flex-col bg-navy-900">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-6">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-electric-500/15 ring-1 ring-electric-400/40">
          <Cpu size={18} strokeWidth={1.75} className="text-electric-400" />
        </span>

        <div>
          <p className="text-sm font-semibold text-white">ServicePoint</p>

          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-electric-400">
            Super Admin
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            pathname={pathname}
            onClick={onNavigate}
          />
        ))}
      </nav>

      {/* Logout */}
      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-white">
          <LogOut size={18} strokeWidth={1.75} className="text-slate-500" />
          Log out
        </button>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  const currentLabel =
    NAV_ITEMS.find((item) =>
      item.href === "/admin"
        ? pathname === "/admin"
        : pathname.startsWith(item.href),
    )?.label ?? "Dashboard";

  return (
    // <PrivateRoutes allowedRoles={["admin"]}>
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:block lg:w-64">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Mobile sidebar */}
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
            {/* Mobile menu */}
            <button
              type="button"
              onClick={() => setIsMobileOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden"
              aria-label="Open menu">
              <Menu size={20} strokeWidth={1.75} />
            </button>

            <h1 className="text-base font-semibold text-navy-900 sm:text-lg">
              {currentLabel}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button
              type="button"
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              aria-label="Notifications">
              <Bell size={20} strokeWidth={1.75} />

              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-amber-400" />
            </button>

            {/* Profile */}
            <div className="flex items-center gap-2.5 border-l border-slate-200 pl-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-900 text-xs font-semibold text-white">
                SA
              </span>

              <span className="hidden text-sm font-medium text-navy-900 sm:block">
                Super Admin
              </span>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:py-8">{children}</main>
      </div>
    </div>
    // </PrivateRoutes>
  );
}
