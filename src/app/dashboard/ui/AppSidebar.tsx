"use client";
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
  LineChart,
  Calendar,
  Hospital,
  ClipboardList,
  UserCog,
  BadgePercent,
  User,
  FlaskConical,
  IndianRupee,
} from "lucide-react";
import { SignOut } from "@/app/components/auth/signout-button";
import { useSession } from "next-auth/react";

// Define all possible menu items
const allMenuItems = [
  {
    name: "Dashboard",
    icon: <Home size={20} />,
    path: (role: string) => `/dashboard/pages/${role}`,
    roles: [
      "SuperAdmin",
      "Admin",
      "clientAdmin",
      "Doctor",
      "Receptionist",
      "Patient",
    ],
  },
  {
    name: "Manage Users",
    icon: <Users size={20} />,
    path: (role: string) => `/dashboard/pages/${role}/manageUsers`,
    roles: ["SuperAdmin", "Admin", "clientAdmin"],
  },
  {
    name: "Manage Clinics",
    icon: <Hospital size={20} />,
    path: (role: string) => `/dashboard/pages/${role}/manageClinic`,
    roles: ["SuperAdmin", "clientAdmin"],
  },
  {
    name: "Analytics",
    icon: <LineChart size={20} />,
    path: "/dashboard/analytics",
    roles: ["SuperAdmin", "clientAdmin", "Admin"],
  },
  {
    name: "Appointments",
    icon: <Calendar size={20} />,
    path: (role: string) => `/dashboard/pages/${role}/appointments`,
    roles: ["Doctor", "Receptionist", "Admin", "Patient"],
  },
  {
    name: "Medical Records",
    icon: <ClipboardList size={20} />,
    path: (role: string) => `/dashboard/pages/${role}/patientRecords`,
    roles: ["Doctor", "Receptionist", "Patient"],
  },
  {
    name: "Billing",
    icon: <IndianRupee size={20} />,
    path: (role: string) => `/dashboard/pages/${role}/patientBilling`,
    roles: ["Doctor", "Patient"],
  },
  {
    name: "Revenue",
    icon: <BadgePercent size={20} />,
    path: (role: string) => `/dashboard/pages/${role}/revenue`,
    roles: ["SuperAdmin", "Admin", "clientAdmin", "Doctor"],
  },
  {
    name: "Lab Work",
    icon: <FlaskConical size={20} />,
    path: (role: string) => `/dashboard/pages/${role}/labWork`,
    roles: ["SuperAdmin", "Admin", "clientAdmin", "Doctor"],
  },
  {
    name: "Settings",
    icon: <Settings size={20} />,
    path: "/dashboard/settings",
    roles: ["SuperAdmin", "Admin", "clientAdmin"],
  },
  {
    name: "Profile Setting",
    icon: <User size={20} />,
    path: (role: string) => `/dashboard/pages/${role}/profile`,
    roles: ["Doctor", "Patient"],
  },
  {
    name: "Admin Console",
    icon: <UserCog size={20} />,
    path: "/dashboard/admin",
    roles: ["Admin"],
  },
];

export function AppSidebar() {
  const { data: session, status } = useSession();
  // When session is loading or undefined, show a simple loading text
  if (status === "loading" || !session) {
    return null;
  }

  const userRole = session?.user?.role || "Patient";

  // Filter menu items based on user role
  const filteredMenuItems = allMenuItems.filter((item) =>
    item.roles.includes(userRole)
  );

  return (
    <>
      <Sidebar className="min-h-screen bg-white border-r border-gray-200">
        <SidebarHeader className="p-4">
          <h2 className="text-sm font-semibold capitalize text-gray-700">
            {userRole}
          </h2>
          <h3 className="text-xl font-semibold text-gray-900">
            {session?.user?.name || "Guest"}
          </h3>
        </SidebarHeader>

        <SidebarContent className="p-2">
          {filteredMenuItems.map((item, index) => {
            // Compute the URL if the path is a function
            const path =
              typeof item.path === "function" ? item.path(userRole) : item.path;

            return (
              <SidebarGroup key={index} className="mb-1">
                <Link
                  href={path}
                  className="flex items-center gap-3 p-2 text-gray-800 hover:bg-gray-200 rounded"
                >
                  {item.icon}
                  {item.name}
                </Link>
              </SidebarGroup>
            );
          })}
        </SidebarContent>

        <SidebarFooter className="p-4">
          <SignOut />
        </SidebarFooter>
      </Sidebar>
    </>
  );
}
