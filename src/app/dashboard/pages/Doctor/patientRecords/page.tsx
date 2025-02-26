"use client";

import DashboardLayout from "@/app/dashboard/layout/DashboardLayout";
import DashboardCards, { Stat } from "@/app/dashboard/ui/DashboardCards";
import DashboardChart from "@/app/dashboard/ui/DashboardChart";
// import DashboardTable from "@/app/dashboard/ui/DashboardTable";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  HeartPulse,
  Stethoscope,
  Pill,
  ClipboardList,
  FlaskConical,
  AlertOctagon,
  Search,
  UserPlus,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import {
  selectPatients,
  Patient,
} from "@/app/redux/slices/patientSlice";
import { useAppDispatch, useAppSelector } from "@/app/redux/store/hooks";
import SelectPatientMessage from "@/app/components/SelectPatientMessage";

export default function PatientRecords() {
  // Local state for search input and suggestions
  const [searchInput, setSearchInput] = useState("");
  const [suggestions, setSuggestions] = useState<Patient[]>([]);
  // State to track the selected patient (if any)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Redux: get patients from store (ensure this returns an array of Patient)
  const patients = useAppSelector(selectPatients);
  // const dispatch = useAppDispatch();

  // Example health metrics cards (static demo values)
  const stats: Stat[] = [
    {
      title: "Upcoming Appointments",
      value: "2",
      icon: <Stethoscope size={24} />,
      color: "bg-blue-500",
    },
    {
      title: "Active Medications",
      value: "5",
      icon: <Pill size={24} />,
      color: "bg-purple-500",
    },
    {
      title: "Known Allergies",
      value: "3",
      icon: <FlaskConical size={24} />,
      color: "bg-red-500",
    },
    {
      title: "Last BMI",
      value: "24.3",
      icon: <ClipboardList size={24} />,
      color: "bg-green-500",
    },
  ];

  // Search handler: Filter the Redux patients array (using all available patients)
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);

    if (value.length < 3) {
      setSuggestions([]);
      return;
    }

    // Always use the Redux patients for filtering.
    let filteredPatients: Patient[] = [];
    // If the input starts with "ES" followed by a digit or begins with a digit, search by PatientId.
    if (
      (value.slice(0, 2).toUpperCase() === "ES" &&
        /\d/.test(value.charAt(2))) ||
      /\d/.test(value.charAt(0))
    ) {
      filteredPatients = patients.filter((patient) =>
        patient.PatientId.toLowerCase().includes(value.toLowerCase())
      );
    } else {
      // Otherwise, search by fullName.
      filteredPatients = patients.filter((patient) =>
        patient.fullName.toLowerCase().includes(value.toLowerCase())
      );
    }

    setSuggestions(filteredPatients);
  };

  // When a patient suggestion is selected, store the entire patient object.
  const handleSelectSuggestion = (patient: Patient) => {
    setSelectedPatient(patient);
    setSearchInput(patient.fullName);
    setSuggestions([]);
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Top Section: Search & Add Patient Button */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-lg shadow-sm">
          <div className="relative w-full">
            <Search
              className="absolute left-3 top-2.5 text-gray-400"
              size={18}
            />
            <Input
              type="text"
              placeholder="Search patients..."
              value={searchInput}
              onChange={handleSearchChange}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {/* Dropdown suggestions */}
            {suggestions.length > 0 && (
              <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 shadow-lg max-h-60 overflow-auto">
                {suggestions.map((patient, index) => (
                  <li
                    key={index}
                    className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                    onClick={() => handleSelectSuggestion(patient)}
                  >
                    {patient.fullName} ({patient.PatientId})
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Link href="/dashboard/pages/Doctor/patientRecords/patientRegistrationForm">
            <Button className="mt-3 md:mt-0 md:ml-4 flex items-center gap-2">
              <UserPlus size={18} />
              Add Patient
            </Button>
          </Link>
        </div>

        {selectedPatient ? (
          <>
            {/* Patient Info Section */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h1 className="text-2xl font-bold text-gray-800">
                {selectedPatient.fullName || "NA"}
              </h1>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                <div>
                  <span className="text-gray-500">Contact:</span>{" "}
                  {selectedPatient.contactNumber || "NA"}
                </div>
                <div>
                  <span className="text-gray-500">Gender:</span>{" "}
                  {selectedPatient.gender || "NA"}
                </div>
                <div>
                  <span className="text-gray-500">DOB:</span>{" "}
                  {selectedPatient.dateOfBirth
                    ? new Date(selectedPatient.dateOfBirth).toLocaleDateString()
                    : "NA"}
                </div>
                <div>
                  <span className="text-gray-500">Patient ID:</span>{" "}
                  {selectedPatient.PatientId || "NA"}
                </div>
              </div>
            </div>

            {/* Health Metrics Cards */}
            <DashboardCards stats={stats} />

            {/* Vital Signs & Medical Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DashboardChart />
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <AlertOctagon className="text-red-500" size={20} />
                  Emergency Contacts
                </h2>
                <ul className="space-y-3">
                  <li className="flex justify-between items-center p-2 bg-red-50 rounded">
                    <span>Mary Johnson (Spouse)</span>
                    <span className="text-red-600">+1 (555) 123-4567</span>
                  </li>
                  <li className="flex justify-between items-center p-2 bg-red-50 rounded">
                    <span>David Smith (Brother)</span>
                    <span className="text-red-600">+1 (555) 987-6543</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Additional Sections */}
            <h2>TODO: Medical History Table</h2>
            <h2>TODO: Prescription Table</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <FlaskConical className="text-red-500" size={20} />
                  Allergies & Reactions
                </h2>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Penicillin - Hives, Anaphylaxis</li>
                  <li>Shellfish - Swelling, Difficulty breathing</li>
                  <li>Ibuprofen - Stomach irritation</li>
                </ul>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <HeartPulse className="text-blue-500" size={20} />
                  Recent Test Results
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Cholesterol (LDL):</span>
                    <span className="font-medium">110 mg/dL (Normal)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>HbA1c:</span>
                    <span className="font-medium">5.8% (Prediabetic)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Vitamin D:</span>
                    <span className="font-medium">22 ng/mL (Low)</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <SelectPatientMessage />
        )}
      </div>
    </DashboardLayout>
  );
}
