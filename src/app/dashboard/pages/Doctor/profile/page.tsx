"use client";

import React, {
  useState,
  useEffect,
  ChangeEvent,
  FormEvent,
} from "react";
import DashboardLayout from "@/app/dashboard/layout/DashboardLayout";
import { useAppSelector } from "@/app/redux/store/hooks";
import { ProfileData } from "@/app/redux/slices/profileSlice";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Aperture, Database } from "lucide-react";

export default function ProfileSettings() {

  const userProfile = useAppSelector(
    (state) => state?.profile?.profile as ProfileData
  );

  /* ---------------- Profile State ---------------- */
  const [profile, setProfile] = useState({
    name: userProfile?.fullName || "",
    phone: userProfile?.contactNumber || "",
    address: {
      street: userProfile?.address?.street || "",
      city: userProfile?.address?.city || "",
      state: userProfile?.address?.state || "",
      postalCode: userProfile?.address?.postalCode || "",
    },
  });


  const [showSuccess, setShowSuccess] = useState(false);

  /* ---------------- Backup State ---------------- */
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupStatus, setBackupStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [backupMessage, setBackupMessage] = useState<string | null>(null);

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name.startsWith("address.")) {
      const key = name.split(".")[1];
      setProfile((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [key]: value,
        },
      }));
    } else {
      setProfile((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };


  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // dispatch(updateProfile(profile));
    setShowSuccess(true);
  };

  /* ---------------- Manual Backup ---------------- */
  const handleManualBackup = async () => {
    try {
      setIsBackingUp(true);
      setBackupStatus("idle");
      setBackupMessage(null);

      const res = await fetch("/api/manualBackup", {
        method: "POST", // ✅ IMPORTANT
      });

      if (!res.ok) {
        throw new Error("Backup failed");
      }

      const blob = await res.blob();

      // ✅ extract filename from header
      const contentDisposition = res.headers.get("Content-Disposition");
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] ?? "backup.zip";

      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = filename; // ✅ real filename with date
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);

      setBackupStatus("success");
      setBackupMessage("Backup created and downloaded successfully.");
    } catch {
      setBackupStatus("error");
      setBackupMessage("Backup failed. Please try again.");
    } finally {
      setIsBackingUp(false);
    }
  };


  return (
    <DashboardLayout>
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto space-y-10">

          {/* ---------------- Header ---------------- */}
          <div className="pb-6 border-b border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900">
              Settings
            </h1>
            <p className="mt-2 text-gray-600">
              Manage your account and system preferences
            </p>
          </div>

          {/* ---------------- Profile Section ---------------- */}
          <section className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900">
              Profile Information
            </h2>

            {showSuccess && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg flex items-center gap-2">
                <Aperture className="h-5 w-5 text-green-600" />
                <span className="text-green-700 text-sm">
                  Profile updated successfully!
                </span>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {/* Name */}
              <div>
                <label className="text-sm font-medium text-gray-700">Name</label>
                <div className="mt-1 relative">
                  <Aperture className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="text"
                    name="name"
                    value={profile.name}
                    onChange={handleChange}
                    className="pl-10 pr-4 py-3 w-full"
                    required
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="text-sm font-medium text-gray-700">Phone</label>
                <div className="mt-1 relative">
                  <Aperture className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="text"
                    name="phone"
                    value={profile.phone}
                    onChange={handleChange}
                    className="pl-10 pr-4 py-3 w-full"
                    required
                  />
                </div>
              </div>

              {/* Street */}
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Street</label>
                <Input
                  type="text"
                  name="address.street"
                  value={profile.address.street}
                  onChange={handleChange}
                  className="mt-1 py-3 w-full"
                  required
                />
              </div>

              {/* City */}
              <div>
                <label className="text-sm font-medium text-gray-700">City</label>
                <Input
                  type="text"
                  name="address.city"
                  value={profile.address.city}
                  onChange={handleChange}
                  className="mt-1 py-3 w-full"
                  required
                />
              </div>

              {/* State */}
              <div>
                <label className="text-sm font-medium text-gray-700">State</label>
                <Input
                  type="text"
                  name="address.state"
                  value={profile.address.state}
                  onChange={handleChange}
                  className="mt-1 py-3 w-full"
                  required
                />
              </div>

              {/* Postal Code */}
              <div>
                <label className="text-sm font-medium text-gray-700">Postal Code</label>
                <Input
                  type="text"
                  name="address.postalCode"
                  value={profile.address.postalCode}
                  onChange={handleChange}
                  className="mt-1 py-3 w-full"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <Button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3"
                >
                  Update Profile
                </Button>
              </div>
            </form>

          </section>

          {/* ---------------- Backup Section ---------------- */}
          <section className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Database className="h-5 w-5" />
              Backup & Data Management
            </h2>

            <p className="mt-2 text-sm text-gray-600">
              Create a manual backup of all clinic data. This action is
              restricted to administrators.
            </p>

            {backupMessage && (
              <div
                className={`mt-4 text-sm ${backupStatus === "success"
                  ? "text-green-600"
                  : "text-red-600"
                  }`}
              >
                {backupMessage}
              </div>
            )}

            <div className="mt-6">
              <Button
                onClick={handleManualBackup}
                disabled={isBackingUp}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3"
              >
                {isBackingUp
                  ? "Creating Backup..."
                  : "Create Manual Backup"}
              </Button>
            </div>
          </section>


        </div>
      </div>
    </DashboardLayout>
  );
}
