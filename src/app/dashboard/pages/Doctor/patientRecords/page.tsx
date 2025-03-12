"use client";

import DashboardLayout from "@/app/dashboard/layout/DashboardLayout";
import DashboardCards, { Stat } from "@/app/dashboard/ui/DashboardCards";
import DashboardChart from "@/app/dashboard/ui/DashboardChart";
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
  MapPin,
  Mail,
  Edit,
} from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { selectPatients, Patient } from "@/app/redux/slices/patientSlice";
import { useAppSelector, useAppDispatch } from "@/app/redux/store/hooks";
import SelectPatientMessage from "@/app/components/SelectPatientMessage";
import EditPatientModal from "../../../../components/EditPatientModal";
import { useSession } from "next-auth/react";
import { fetchPatients } from "@/app/redux/slices/patientSlice";

export default function PatientRecords() {
  const [searchInput, setSearchInput] = useState("");
  const [suggestions, setSuggestions] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isEditModalOpen, setEditModalOpen] = useState(false);

  const patients = useAppSelector(selectPatients);
  const dispatch = useAppDispatch();
  const { data: session } = useSession();

  const stats: Stat[] = [
    {
      title: "Upcoming Appointments",
      value: "2",
      icon: <Stethoscope size={24} />,
      color: "bg-blue-500",
      LinkURL: "",
    },
    {
      title: "Active Medications",
      value: "5",
      icon: <Pill size={24} />,
      color: "bg-purple-500",
      LinkURL: "",
    },
    {
      title: "Known Allergies",
      value: "3",
      icon: <FlaskConical size={24} />,
      color: "bg-red-500",
      LinkURL: "",
    },
    {
      title: "Last BMI",
      value: "24.3",
      icon: <ClipboardList size={24} />,
      color: "bg-green-500",
      LinkURL: "",
    },
  ];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    if (value.length < 3) {
      setSuggestions([]);
      return;
    }
    let filteredPatients: Patient[] = [];
    if (
      (value.slice(0, 2).toUpperCase() === "ES" &&
        /\d/.test(value.charAt(2))) ||
      /\d/.test(value.charAt(0))
    ) {
      filteredPatients = patients.filter((patient) =>
        patient.PatientId.toLowerCase().includes(value.toLowerCase())
      );
    } else {
      filteredPatients = patients.filter((patient) =>
        patient.fullName.toLowerCase().includes(value.toLowerCase())
      );
    }
    setSuggestions(filteredPatients);
  };

  const handleSelectSuggestion = (patient: Patient) => {
    console.log("patient", patient);
    setSelectedPatient(patient);
    setSearchInput(patient.fullName);
    setSuggestions([]);
  };

  const openEditModal = () => setEditModalOpen(true);
  const closeEditModal = () => setEditModalOpen(false);

  // Update selectedPatient when the Redux patients list changes
  useEffect(() => {
    if (selectedPatient) {
      const updated = patients.find((p) => p._id === selectedPatient._id);
      if (updated) {
        setSelectedPatient(updated);
      }
    }
  }, [patients, selectedPatient]);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-end gap-x-2 bg-white p-4 rounded-lg shadow-sm">
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
              <span className="hidden md:block">Add Patient</span>
            </Button>
          </Link>
        </div>

        {selectedPatient ? (
          <>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex justify-between items-start">
                <h1 className="text-2xl font-bold text-gray-800">
                  {selectedPatient.fullName || "NA"}
                </h1>
                <Button variant="ghost" size="sm" onClick={openEditModal}>
                  <Edit size={16} />
                </Button>
                {selectedPatient && (
                  <EditPatientModal
                    isOpen={isEditModalOpen}
                    onClose={closeEditModal}
                    patient={selectedPatient}
                    onPatientUpdated={(updatedPatient: Patient) => {
                      setSelectedPatient(updatedPatient);
                      if (session?.user.id) {
                        dispatch(fetchPatients(session.user.id));
                      }
                    }}
                  />
                )}
              </div>

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

            <DashboardCards stats={stats} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DashboardChart />
              <div className="bg-white p-6 rounded-lg shadow-sm flex flex-col gap-y-5">
                <div>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Mail className="text-blue-500" size={20} />
                    Email
                  </h2>
                  <ul className="space-y-3">
                    <li className="flex justify-between items-center p-2 bg-blue-50 rounded">
                      <span>{selectedPatient?.email || "NA"}</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <MapPin className="text-green-500" size={20} />
                    Address
                  </h2>
                  <ul className="space-y-3">
                    <li className="flex justify-between items-center p-2 bg-green-50 rounded">
                      {selectedPatient?.address?.street},{" "}
                      {selectedPatient?.address?.city},{" "}
                      {selectedPatient?.address?.state} -{" "}
                      {selectedPatient?.address?.postalCode}
                    </li>
                  </ul>
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <AlertOctagon className="text-red-500" size={20} />
                    Emergency Contacts
                  </h2>
                  <ul className="space-y-3">
                    <li className="flex justify-between items-center p-2 text-red-600 bg-red-50 rounded">
                      <span>
                        {selectedPatient?.emergencyContact?.fullName || "NA"}
                      </span>
                      <span>
                        {selectedPatient?.emergencyContact?.contactNumber ||
                          "NA"}
                      </span>
                      <span>
                        {selectedPatient?.emergencyContact?.relationship ||
                          "NA"}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

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
