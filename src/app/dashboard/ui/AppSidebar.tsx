import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  Home,
  Users,
  Settings,
  LogOut,
  LineChart,
  Calendar,
  Hospital,
} from "lucide-react";
import { SignOut } from "@/app/components/auth/signout-button";

const menuItems = [
  { name: "Dashboard", icon: <Home size={20} />, path: "/dashboard" },
  { name: "Manage Users", icon: <Users size={20} />, path: "/dashboard/users" },
  {
    name: "Manage Clinic",
    icon: <Hospital size={20} />,
    path: "/dashboard/manage-clinic",
  },
  {
    name: "Analytics",
    icon: <LineChart size={20} />,
    path: "/dashboard/analytics",
  },
  {
    name: "Appointments",
    icon: <Calendar size={20} />,
    path: "/dashboard/appointments",
  },
  {
    name: "Settings",
    icon: <Settings size={20} />,
    path: "/dashboard/settings",
  },
];

export function AppSidebar() {
  return (
    <Sidebar className="min-h-screen">
      <SidebarHeader>
        <h2 className="text-xl font-semibold">SuperAdmin</h2>
      </SidebarHeader>

      <SidebarContent>
        {menuItems.map((item, index) => (
          <SidebarGroup key={index}>
            <Link
              href={item.path}
              className="flex items-center gap-3 p-2 hover:bg-gray-200 rounded"
            >
              {item.icon}
              {item.name}
            </Link>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SignOut />
      </SidebarFooter>
    </Sidebar>
  );
}
