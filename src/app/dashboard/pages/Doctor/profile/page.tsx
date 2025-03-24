"use client";

import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import DashboardLayout from "@/app/dashboard/layout/DashboardLayout";
import { useAppSelector, useAppDispatch } from "@/app/redux/store/hooks";
import { ProfileData } from "@/app/redux/slices/profileSlice";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Aperture } from "lucide-react";

export default function ProfileSettings() {
  const dispatch = useAppDispatch();
  const userProfile = useAppSelector((state) => {
    return state?.profile?.profile as ProfileData;
  });
  const [showSuccess, setShowSuccess] = useState(false);

  const [profile, setProfile] = useState({
    name: userProfile?.fullName || "",
    email: userProfile?.gender || "",
    phone: userProfile?.contactNumber || "",
    address: userProfile?.address || "",
  });

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // dispatch(updateProfile(profile));
    setShowSuccess(true);
  };

  return (
    <DashboardLayout>
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-3xl mx-auto">
          <div className="pb-6 border-b border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900">
              Profile Settings
            </h1>
            <p className="mt-2 text-gray-600">
              Manage your personal information
            </p>
          </div>

          {showSuccess && (
            <div className="mt-6 p-4 bg-green-50 rounded-lg flex items-center gap-2 transition-opacity duration-300">
              <Aperture className="h-5 w-5 text-green-600" />
              <span className="text-green-700 text-sm">
                Profile updated successfully!
              </span>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="mt-6 bg-white p-8 rounded-xl shadow-sm border border-gray-100"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative">
                <label className="text-sm font-medium text-gray-700">
                  Name
                </label>
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

              <div className="relative">
                <label className="text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="mt-1 relative">
                  <Aperture className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="email"
                    name="email"
                    value={profile.email}
                    onChange={handleChange}
                    className="pl-10 pr-4 py-3 w-full"
                    required
                  />
                </div>
              </div>

              <div className="relative">
                <label className="text-sm font-medium text-gray-700">
                  Phone
                </label>
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

              <div className="relative">
                <label className="text-sm font-medium text-gray-700">
                  Address
                </label>
                <div className="mt-1 relative">
                  <Aperture className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="text"
                    name="address"
                    // value={profile.address}
                    onChange={handleChange}
                    className="pl-10 pr-4 py-3 w-full"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="mt-8">
              <Button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-lg transition-colors duration-200 font-medium"
              >
                Update Profile
              </Button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
