"use client";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutGrid,
  ListChecks,
  Users,
  UserCircle,
  Wrench,
} from "lucide-react";
import PrivateRoutes from "@/components/PrivateRoutes/PrivateRoutes";
import DashboardLayout from "@/components/SideBar";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/service-center", icon: LayoutGrid },
  {
    label: "Jobs",
    href: "/service-engineer/jobs",
    icon: ListChecks,
    children: [
      {
        label: "Jobs",
        href: "/service-center/jobs",
      },
      {
        label: "Pending Jobs",
        href: "/service-center/pending-job",
      },
      {
        label: "Completed Jobs",
        href: "/service-center/complete-job",
      },
    ],
  },
  {
    label: "Service Engineers",
    href: "/service-center/engineers",
    icon: Users,
  },
  {
    label: "Spare Parts",
    href: "/service-center/spare-parts",
    icon: Wrench,
  },
  { label: "Profile", href: "/service-center/profile", icon: UserCircle },
];

export default function ServiceCenterLayout({ children }) {
  return (
    <PrivateRoutes allowedRoles={["service-center"]}>
      <DashboardLayout
        navItems={NAV_ITEMS}
        brandName="Aceit Technologies"
        brandShortName="AT">
        {children}
      </DashboardLayout>
    </PrivateRoutes>
  );
}
