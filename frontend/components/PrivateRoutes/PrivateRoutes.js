"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/features/Useauthstore";

const PrivateRoutes = ({ children, allowedRoles = [] }) => {
  const router = useRouter();
  const pathname = usePathname();

  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Wait until Zustand has actually finished reading localStorage
    if (!hasHydrated) return;

    // No authentication
    if (!token || !user) {
      router.replace("/");
      return;
    }

    // Check role
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      switch (user.role) {
        case "admin":
          router.replace("/admin");
          break;

        case "company":
          router.replace("/company");
          break;

        case "service-center":
          router.replace("/service-center");
          break;

        case "service-engineer":
          router.replace("/service-engineer");
          break;

        default:
          localStorage.removeItem("service-center-auth");
          router.replace("/");
          break;
      }

      return;
    }

    setChecking(false);
  }, [token, user, hasHydrated, allowedRoles, router, pathname]);

  // Don't show protected page while hydrating or checking authentication
  if (!hasHydrated || checking) {
    return null;
  }

  return children;
};

export default PrivateRoutes;