"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, LogOut, Menu, X } from "lucide-react";
import { useAuthStore } from "@/features/Useauthstore";
import { toast } from "sonner";

export default function DashboardLayout({
  children,
  navItems = [],
  brandName = "Service CRM",
  brandShortName = "AT",
}) {
  const pathname = usePathname();
  const user = useAuthStore((state) => state?.user);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const router = useRouter();

  const onLogout = () => {
    clearAuth();
    toast.success("Logged out.");
    router.push("/");
  };

  // --------------------------------------------------
  // Close mobile drawer
  // --------------------------------------------------
  const closeMobileMenu = () => {
    setIsMobileOpen(false);
  };

  // --------------------------------------------------
  // Lock body scroll when mobile drawer is open
  // --------------------------------------------------
  useEffect(() => {
    if (!isMobileOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileOpen]);

  // --------------------------------------------------
  // Close drawer when route changes
  // --------------------------------------------------
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // --------------------------------------------------
  // Escape key
  // --------------------------------------------------
  useEffect(() => {
    if (!isMobileOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileOpen]);

  // --------------------------------------------------
  // Current page label
  // --------------------------------------------------
  const currentLabel = useMemo(() => {
    for (const item of navItems) {
      if (item.href && isPathActive(item.href, pathname)) {
        return item.label;
      }

      if (item.children) {
        const child = item.children.find((child) =>
          isPathActive(child.href, pathname),
        );

        if (child) {
          return child.label;
        }
      }
    }

    return "Dashboard";
  }, [navItems, pathname]);

  // --------------------------------------------------
  // User initial
  // --------------------------------------------------
  const userInitial = (user?.name || user?.fullName || user?.email || "U")
    .charAt(0)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* =====================================================
          DESKTOP SIDEBAR
      ====================================================== */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
        <Sidebar
          navItems={navItems}
          pathname={pathname}
          brandName={brandName}
          brandShortName={brandShortName}
          user={user}
          onLogout={onLogout}
        />
      </aside>

      {/* =====================================================
          MOBILE DRAWER
      ====================================================== */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${
          isMobileOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
        aria-hidden={!isMobileOpen}>
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-navy-950/60 backdrop-blur-[2px] transition-opacity duration-300 ease-out ${
            isMobileOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={closeMobileMenu}
        />

        {/* Drawer */}
        <aside
          className={`absolute inset-y-0 left-0 w-[min(18rem,85vw)] transform-gpu shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform ${
            isMobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}>
          <Sidebar
            navItems={navItems}
            pathname={pathname}
            brandName={brandName}
            brandShortName={brandShortName}
            user={user}
            onLogout={onLogout}
            onNavigate={closeMobileMenu}
            onClose={closeMobileMenu}
            mobile
          />
        </aside>
      </div>

      {/* =====================================================
          MAIN AREA
      ====================================================== */}
      <div className="lg:pl-64">
        {/* ===================================================
            TOPBAR
        ==================================================== */}
        <header className="sticky top-0 z-20 xl:hidden border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between px-2 sm:px-6">
            {/* Left */}
            <div className="flex min-w-0 items-center gap-3">
              {/* Mobile menu button */}
              <button
                type="button"
                onClick={() => setIsMobileOpen(true)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 active:scale-95 lg:hidden"
                aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </button>

              {/* Page title */}
              <div className="min-w-0">
                <h1 className="truncate text-lg font-semibold text-navy-900">
                  {currentLabel}
                </h1>
              </div>
            </div>

            {/* Right */}
            <div className="flex shrink-0 items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-slate-800">
                  {user?.name || "User"}
                </p>

                {user?.email && (
                  <p className="max-w-[180px] truncate text-xs text-slate-500">
                    {user.email}
                  </p>
                )}
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-electric-500 text-sm font-semibold text-white">
                {userInitial}
              </div>
            </div>
          </div>
        </header>

        {/* ===================================================
            PAGE CONTENT
        ==================================================== */}
        <main className="min-h-[calc(100vh-4rem)] p-2 lg:p-5">{children}</main>
      </div>
    </div>
  );
}

function Sidebar({
  navItems,
  pathname,
  brandName,
  brandShortName,
  user,
  onLogout,
  onNavigate,
  onClose,
  mobile = false,
}) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-navy-900 text-white">
      {/* =====================================================
          BRAND
      ====================================================== */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-4">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex min-w-0 items-center gap-3">
          <img
            src={"./logo.png"}
            alt={brandName}
            className="h-9 w-9 shrink-0 rounded-lg object-contain"
          />
          <span className="truncate text-sm font-semibold">{brandName}</span>
        </Link>

        {/* Mobile close */}
        {mobile && (
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-white/10 hover:text-white active:scale-95"
            aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4">
        <div className="space-y-1">
          {navItems.map((item, index) => (
            <NavItem
              key={`${item.label}-${index}`}
              item={item}
              pathname={pathname}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </nav>

      <div className="shrink-0 border-t border-white/10 p-3">
        <div className="mb-2 flex items-center gap-3 rounded-xl bg-white/5 p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-electric-500 text-sm font-semibold">
            {(user?.name || user?.fullName || user?.email || "U")
              .charAt(0)
              .toUpperCase()}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">
              {user?.name || "User"}
            </p>

            {user?.email && (
              <p className="truncate text-xs text-slate-400">{user.email}</p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-slate-300 transition-colors hover:bg-red-500/10 hover:text-red-300 active:scale-[0.99]">
          <LogOut className="h-5 w-5 shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

function NavItem({ item, pathname, onNavigate }) {
  const hasChildren = Array.isArray(item.children) && item.children.length > 0;

  const isParentActive = hasChildren
    ? item.children.some((child) => isPathActive(child.href, pathname))
    : item.href
      ? isPathActive(item.href, pathname)
      : false;

  const [isOpen, setIsOpen] = useState(isParentActive);

  // Automatically open when current route belongs to group
  useEffect(() => {
    if (isParentActive) {
      setIsOpen(true);
    }
  }, [isParentActive]);

  // ==========================================================
  // NORMAL LINK
  // ==========================================================
  if (!hasChildren) {
    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        className={getNavClass(isParentActive)}>
        {item.icon && <item.icon className="h-5 w-5 shrink-0" />}

        <span className="truncate">{item.label}</span>

        {item.badge && (
          <span className="ml-auto rounded-full bg-electric-500 px-2 py-0.5 text-[10px] font-semibold text-white">
            {item.badge}
          </span>
        )}
      </Link>
    );
  }

  // ==========================================================
  // GROUP
  // ==========================================================
  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={getNavClass(isParentActive)}
        aria-expanded={isOpen}>
        {item.icon && <item.icon className="h-5 w-5 shrink-0" />}

        <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>

        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : "rotate-0"
          }`}
        />
      </button>

      {/* ========================================================
          SUBMENU ANIMATION
      ========================================================= */}
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}>
        <div className="min-h-0 overflow-hidden">
          <div className="ml-5 mt-1 space-y-1 border-l border-white/10 pl-3">
            {item.children.map((child, index) => {
              const active = isPathActive(child.href, pathname);

              return (
                <Link
                  key={`${child.label}-${index}`}
                  href={child.href}
                  onClick={onNavigate}
                  className={getSubNavClass(active)}>
                  {child.icon && <child.icon className="h-4 w-4 shrink-0" />}

                  <span className="truncate">{child.label}</span>

                  {child.badge && (
                    <span className="ml-auto rounded-full bg-electric-500 px-2 py-0.5 text-[10px] font-semibold">
                      {child.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function isPathActive(href, pathname) {
  if (!href || !pathname) return false;

  // Exact dashboard route
  if (href === "/company" || href === "/admin") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function getNavClass(active) {
  return `
    flex
    min-h-11
    w-full
    items-center
    gap-3
    rounded-xl
    px-3
    py-2.5
    text-sm
    font-medium
    transition-all
    duration-200
    ease-out
    ${
      active
        ? "bg-electric-500/15 text-white ring-1 ring-electric-400/40"
        : "text-slate-300 hover:bg-white/5 hover:text-white"
    }
  `;
}

function getSubNavClass(active) {
  return `
    flex
    min-h-10
    w-full
    items-center
    gap-2.5
    rounded-lg
    px-3
    py-2
    text-sm
    transition-all
    duration-200
    ease-out
    ${
      active
        ? "bg-electric-500/15 text-white"
        : "text-slate-400 hover:bg-white/5 hover:text-white"
    }
  `;
}
