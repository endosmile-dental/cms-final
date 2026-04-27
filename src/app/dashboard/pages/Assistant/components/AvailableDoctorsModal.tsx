"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader, Phone, Briefcase, Award } from "lucide-react";
import toast from "react-hot-toast";

interface Doctor {
  _id: string;
  fullName: string;
  specialization: string;
  contactNumber: string;
  gender?: string;
  qualifications?: string[];
  experienceYears: number;
  todayBookedSlots: number;
  todayTimeSlots: string[];
}

interface AvailableDoctorsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AvailableDoctorsModal({
  isOpen,
  onClose,
}: AvailableDoctorsModalProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchDoctorsWithSlots();
    }
  }, [isOpen]);

  const fetchDoctorsWithSlots = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/assistant/getDoctorsWithTodaySlots");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to fetch doctors with slots"
        );
      }

      const data = await response.json();
      setDoctors(data.doctors || []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch doctors";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Available Doctors</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        ) : doctors.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <p>No doctors available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {doctors.map((doctor) => (
              <Card key={doctor._id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{doctor.fullName}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {doctor.specialization}
                      </p>
                    </div>
                    <Badge variant="outline" className="ml-2">
                      {doctor.experienceYears}+ yrs
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Contact Information */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-700">{doctor.contactNumber}</span>
                    </div>
                  </div>

                  {/* Qualifications */}
                  {doctor.qualifications && doctor.qualifications.length > 0 && (
                    <div className="pt-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-semibold text-gray-700">
                          Qualifications
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {doctor.qualifications.map((qual, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="text-xs"
                          >
                            {qual}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Today's Booked Slots */}
                  <div className="pt-2 border-t space-y-3">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-semibold text-gray-700">
                        Today&#39;s Booked Slots:
                      </span>
                      <Badge
                        className={`ml-auto ${
                          doctor.todayBookedSlots > 0
                            ? "bg-orange-100 text-orange-800 hover:bg-orange-100"
                            : "bg-green-100 text-green-800 hover:bg-green-100"
                        }`}
                      >
                        {doctor.todayBookedSlots}
                      </Badge>
                    </div>

                    {/* Time Slots */}
                    {doctor.todayTimeSlots.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {doctor.todayTimeSlots.map((slot, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="bg-blue-50 text-blue-700 border-blue-200"
                          >
                            {slot}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
