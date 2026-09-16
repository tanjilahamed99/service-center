"use client";
import { LayoutGrid, ListChecks, UserCircle, Wrench } from "lucide-react";
import PrivateRoutes from "@/components/PrivateRoutes/PrivateRoutes";

import DashboardLayout from "@/components/SideBar";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/service-engineer", icon: LayoutGrid },
  {
    label: "Jobs",
    href: "/service-engineer/jobs",
    icon: ListChecks,
    children: [
      {
        label: "Jobs",
        href: "/service-engineer/jobs",
      },
      {
        label: "Pending Jobs",
        href: "/service-engineer/pending-job",
      },
      {
        label: "Completed Jobs",
        href: "/service-engineer/complete-job",
      },
    ],
  },
  {
    label: "Spare Parts",
    href: "/service-engineer/spare-parts",
    icon: Wrench,
  },
  { label: "Profile", href: "/service-engineer/profile", icon: UserCircle },
];

export default function ServiceCenterLayout({ children }) {
  return (
    <PrivateRoutes allowedRoles={["service-engineer"]}>
      <DashboardLayout
        navItems={NAV_ITEMS}
        brandName="Aceit Technologies"
        brandShortName="AT">
        {children}
      </DashboardLayout>
    </PrivateRoutes>
  );
}
