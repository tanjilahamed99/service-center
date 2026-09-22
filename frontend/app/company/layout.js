"use client";

import {
  LayoutDashboard,
  Briefcase,
  Package,
  Wrench,
  Building2,
  UserCircle,
  PersonStanding
} from "lucide-react";
import DashboardLayout from "@/components/SideBar";
import PrivateRoutes from "@/components/PrivateRoutes/PrivateRoutes";

const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/company",
    icon: LayoutDashboard,
  },

  {
    label: "Jobs",
    icon: Briefcase,
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
    label: "Customers",
    href: "/company/customers",
    icon: PersonStanding,
  },

  {
    label: "Profile",
    href: "/company/profile",
    icon: UserCircle,
  },
];

export default function CompanyLayout({ children }) {
  return (
    <PrivateRoutes allowedRoles={["company"]}>
      <DashboardLayout
        navItems={NAV_ITEMS}
        brandName="Service CRM"
        brandShortName="AT">
        {children}
      </DashboardLayout>
    </PrivateRoutes>
  );
}
