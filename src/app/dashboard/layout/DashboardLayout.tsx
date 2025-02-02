import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "../ui/AppSidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <SidebarProvider>
      <div className="flex w-full min-h-screen bg-gray-100">
        {/* Sidebar */}
        <AppSidebar />

        {/* Main Content */}
        <main className="flex-1 p-6 w-full overflow-auto">{children}</main>
      </div>
    </SidebarProvider>
  );
}
