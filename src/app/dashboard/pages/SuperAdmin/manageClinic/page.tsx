"use client";
// app/dashboard/clinics/page.tsx
import Link from "next/link";
import {
  PlusCircle,
  Activity,
  Stethoscope,
  Clock,
  User,
  AlertOctagon,
  IndianRupee,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/app/dashboard/layout/DashboardLayout";

interface Clinic {
  id: string;
  name: string;
  location: string;
  status: "active" | "inactive" | "pending";
  lastUpdated: string;
  revenue: number;
  costs: number;
  staffCount: number;
}

interface AuditLog {
  timestamp: string;
  user: string;
  action: string;
  details: string;
}

const clinics: Clinic[] = [
  {
    id: "1",
    name: "City General Hospital",
    location: "New York, NY",
    status: "active",
    lastUpdated: "2023-08-20",
    revenue: 1250000,
    costs: 750000,
    staffCount: 45,
  },
  {
    id: "2",
    name: "Sunrise Clinic",
    location: "Los Angeles, CA",
    status: "pending",
    lastUpdated: "2023-08-19",
    revenue: 280000,
    costs: 200000,
    staffCount: 18,
  },
  {
    id: "3",
    name: "Metro Health Center",
    location: "Chicago, IL",
    status: "inactive",
    lastUpdated: "2023-08-18",
    revenue: 420000,
    costs: 380000,
    staffCount: 22,
  },
];

const auditLogs: AuditLog[] = [
  {
    timestamp: "2023-08-20 14:30",
    user: "SuperAdmin",
    action: "Updated Clinic Hours",
    details: "Changed closing time to 20:00",
  },
  {
    timestamp: "2023-08-19 09:15",
    user: "Admin",
    action: "Added New Service",
    details: "MRI Scanning",
  },
];

export default function ClinicsPage() {
  return (
    <DashboardLayout>
      <div className="p-6 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Clinics Management</h1>
          <Button asChild>
            <Link href="manageClinic/addClientAdmin" className="gap-2">
              <PlusCircle size={18} />
              Add Client Admin
            </Link>
          </Button>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 bg-white rounded-xl shadow-sm">
            <div className="flex items-center gap-4">
              <Activity className="text-blue-500" size={24} />
              <div>
                <h3 className="text-sm text-gray-500">Total Clinics</h3>
                <p className="text-2xl font-bold">3</p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-xl shadow-sm">
            <div className="flex items-center gap-4">
              <Stethoscope className="text-green-500" size={24} />
              <div>
                <h3 className="text-sm text-gray-500">Active Clinics</h3>
                <p className="text-2xl font-bold">1</p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-xl shadow-sm">
            <div className="flex items-center gap-4">
              <AlertOctagon className="text-yellow-500" size={24} />
              <div>
                <h3 className="text-sm text-gray-500">Pending Approvals</h3>
                <p className="text-2xl font-bold">1</p>
              </div>
            </div>
          </div>
        </div>

        {/* Clinics Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Clinic Name
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Location
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Last Updated
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {clinics.map((clinic) => (
                <tr key={clinic.id}>
                  <td className="px-6 py-4">{clinic.name}</td>
                  <td className="px-6 py-4">{clinic.location}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        clinic.status === "active"
                          ? "bg-green-100 text-green-800"
                          : clinic.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {clinic.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">{clinic.lastUpdated}</td>
                  <td className="px-6 py-4 space-x-2">
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                    <Button variant="outline" size="sm">
                      Deactivate
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 bg-white rounded-xl shadow-sm">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <IndianRupee className="text-purple-500" size={20} />
              Financial Overview
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Total Revenue:</span>
                <span className="font-semibold">$1,950,000</span>
              </div>
              <div className="flex justify-between">
                <span>Operational Costs:</span>
                <span className="font-semibold">$1,330,000</span>
              </div>
              <div className="flex justify-between">
                <span>Net Profit:</span>
                <span className="font-semibold text-green-600">$620,000</span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-xl shadow-sm">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <User className="text-blue-500" size={20} />
              Staff Overview
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Total Staff:</span>
                <span className="font-semibold">85</span>
              </div>
              <div className="flex justify-between">
                <span>Doctors:</span>
                <span className="font-semibold">32</span>
              </div>
              <div className="flex justify-between">
                <span>Support Staff:</span>
                <span className="font-semibold">53</span>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Logs */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <h2 className="text-xl font-semibold p-6 border-b flex items-center gap-2">
            <Clock className="text-gray-500" size={20} />
            Recent Activities
          </h2>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold">
                  User
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {auditLogs.map((log, index) => (
                <tr key={index}>
                  <td className="px-6 py-4">{log.timestamp}</td>
                  <td className="px-6 py-4">{log.user}</td>
                  <td className="px-6 py-4">{log.action}</td>
                  <td className="px-6 py-4">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
