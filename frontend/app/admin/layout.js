"use client";
import PrivateRoutes from "@/components/PrivateRoutes/PrivateRoutes";

import {
  LayoutDashboard,
  Building2,
  Wrench,
  UserRound,
  UserCircle,
  Users,
  Tags,
} from "lucide-react";

import DashboardLayout from "@/components/SideBar";

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
    label: "Job Categories",
    href: "/admin/job-categories",
    icon: Tags,
  },
  {
    label: "Profile",
    href: "/admin/profile",
    icon: UserCircle,
  },
];

export default function CompanyLayout({ children }) {
  return (
    <PrivateRoutes allowedRoles={["admin"]}>
      <DashboardLayout
        navItems={NAV_ITEMS}
        brandName="Service CRM"
        brandShortName="AT">
        {children}
      </DashboardLayout>
    </PrivateRoutes>
  );
}
