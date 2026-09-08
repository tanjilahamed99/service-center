"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import PrivateRoutes from "@/components/PrivateRoutes/PrivateRoutes";
import { useAuthStore } from "@/features/Useauthstore";
import { toast } from "sonner";
import {
  LayoutDashboard,
  ClipboardList,
  Package,
  Wrench,
  Building2,
  UserCircle,
} from "lucide-react";

const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/company",
    icon: LayoutDashboard,
  },
  {
    label: "Jobs",
    icon: ClipboardList,
    children: [
      {
        label: "Create Job",
        href: "/company/jobs/new",
      },
      {
        label: "All Jobs",
        href: "/company/jobs",
      },
    ],
  },
  {
    label: "Product Master",
    href: "/company/products",
    icon: Package,
  },
  {
    label: "Spare Parts",
    href: "/company/spare-parts",
    icon: Wrench,
  },
  {
    label: "Service Centers",
    icon: Building2,
    children: [
      {
        label: "All Service Centers",
        href: "/company/service-centers",
      },
      {
        label: "All Service Engineers",
        href: "/company/service-engineers",
      },
    ],
  },
  {
    label: "Profile",
    href: "/company/profile",
    icon: UserCircle,
  },
];

function isItemActive(item, pathname) {
  if (item.href) {
    return item.href === "/company"
      ? pathname === "/company"
      : pathname.startsWith(item.href);
  }
  return item.children?.some((child) => pathname.startsWith(child.href));
}

function NavLink({ item, pathname, onClick }) {
  const isActive = isItemActive(item, pathname);
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
        className={`h-4.5 w-4.5 ${isActive ? "text-electric-400" : "text-slate-500"}`}
      />
      {item.label}
    </Link>
  );
}

function NavGroup({ item, pathname, onNavigate }) {
  const isActive = isItemActive(item, pathname);
  const [isOpen, setIsOpen] = useState(isActive);
  const Icon = item.icon;

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={`flex w-full items-center justify-between rounded-lg px-3.5 py-2.5 text-sm font-medium transition ${
          isActive
            ? "text-white"
            : "text-slate-400 hover:bg-white/5 hover:text-white"
        }`}>
        <span className="flex items-center gap-3">
          <Icon
            className={`h-4.5 w-4.5 ${isActive ? "text-electric-400" : "text-slate-500"}`}
          />
          {item.label}
        </span>
        <svg
          viewBox="0 0 24 24"
          className={`h-3.5 w-3.5 text-slate-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div className="mt-1 space-y-0.5 border-l border-white/10 pl-4">
          {item.children.map((child) => {
            const childActive =
              child.href === "/company/jobs"
                ? pathname === "/company/jobs"
                : pathname.startsWith(child.href);
            return (
              <Link
                key={child.href}
                href={child.href}
                onClick={onNavigate}
                className={`block rounded-lg px-3 py-2 text-sm transition ${
                  childActive
                    ? "font-medium text-electric-400"
                    : "text-slate-400 hover:text-white"
                }`}>
                {child.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
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
          <p className="text-sm font-semibold text-white">
            Aceit Technologies (P)ltd
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-electric-400">
            Company
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {NAV_ITEMS.map((item) =>
          item.children ? (
            <NavGroup
              key={item.label}
              item={item}
              pathname={pathname}
              onNavigate={onNavigate}
            />
          ) : (
            <NavLink
              key={item.href}
              item={item}
              pathname={pathname}
              onClick={onNavigate}
            />
          ),
        )}
      </nav>

      {/* Logout */}
      <div className="border-t border-white/10 p-3">
        <button
          onClick={handleLogout}
          type="button"
          className="flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-white">
          <svg
            viewBox="0 0 24 24"
            className="h-4.5 w-4.5 text-slate-500"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
            />
          </svg>
          Log out
        </button>
      </div>
    </div>
  );
}

export default function CompanyLayout({ children }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  const user = useAuthStore((s) => s.user);

  const currentLabel =
    NAV_ITEMS.flatMap((item) => (item.children ? item.children : [item])).find(
      (item) =>
        item.href === "/company"
          ? pathname === "/company"
          : pathname.startsWith(item.href),
    )?.label ?? "Dashboard";

  return (
    <PrivateRoutes allowedRoles={["company"]}>
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
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75">
                  <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
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
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 8a6 6 0 1112 0c0 4 1.5 5.5 2 6H4c.5-.5 2-2 2-6z"
                  />
                  <path strokeLinecap="round" d="M10 20a2 2 0 004 0" />
                </svg>
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-amber-400" />
              </button>
              <div className="flex items-center gap-2.5 border-l border-slate-200 pl-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-900 text-xs font-semibold text-white">
                  C
                </span>
                <span className="hidden text-sm font-medium text-navy-900 sm:block">
                  {user?.name || "Orion Electronics"}
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
