"use client";
import DataTable from "@/app/components/DataTable";
import PatientDetailView from "@/app/components/doctor/PatientDetailView";
import DashboardLayout from "@/app/dashboard/layout/DashboardLayout";
import { Patient, selectPatients } from "@/app/redux/slices/patientSlice";
import { useAppSelector } from "@/app/redux/store/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, UserPlus } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Main component remains with search and list view
export default function PatientRecords() {
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState("");
  const [suggestions, setSuggestions] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const suggestionBoxRef = useRef<HTMLUListElement | null>(null);

  const patients = useAppSelector(selectPatients);

  // ... useEffect for closing suggestions ...
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionBoxRef.current &&
        !suggestionBoxRef.current.contains(event.target as Node)
      ) {
        setSuggestions([]);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search Handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);

    // Filter patients based on ID or name
    const filtered = patients.filter((patient) =>
      value.startsWith("ES") || /\d/.test(value[0])
        ? patient.PatientId.toLowerCase().includes(value.toLowerCase())
        : patient.fullName.toLowerCase().includes(value.toLowerCase())
    );

    setSuggestions(filtered);
  };

  const handleSelectSuggestion = (patient: Patient) => {
    setSelectedPatient(patient);
    setSearchInput(patient.fullName);
    setSuggestions([]);
  };

  // Initialize from URL param
  useEffect(() => {
    const patientId = searchParams.get("patientId");
    if (patientId && patients.length > 0) {
      const patientFromQuery = patients.find((p) => p._id === patientId);
      if (patientFromQuery) setSelectedPatient(patientFromQuery);
    }
  }, [searchParams, patients]);

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6">
        <h1 className="text-3xl font-bold">Medical Records</h1>
        {/* Search Section */}
        <div className="flex justify-between items-center gap-x-2 bg-white p-2 md:p-4 rounded-lg shadow-sm">
          <Button
            variant="ghost"
            className="flex items-center gap-0 md:gap-2 text-sm"
            onClick={() => setSelectedPatient(null)}
          >
            <ArrowLeft size={20} />
          </Button>
          <div className="relative w-full">
            <Search
              className="absolute left-3 top-2.5 text-gray-400"
              size={18}
            />
            <Input
              placeholder="Search patients..."
              value={searchInput}
              onChange={handleSearchChange}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />

            {/* Search Suggestions */}
            {suggestions.length > 0 && (
              <ul
                ref={suggestionBoxRef}
                className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 shadow-lg max-h-60 overflow-auto"
              >
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
            <Button className="md:ml-4 flex items-center gap-2">
              <UserPlus size={18} />
              <span className="hidden md:block">Add Patient</span>
            </Button>
          </Link>
        </div>

        {selectedPatient ? (
          <PatientDetailView
            patient={selectedPatient}
            onPatientUpdated={setSelectedPatient}
          />
        ) : (
          /* Patient List View */
          <DataTable<Patient>
            data={patients}
            title="Patient Records"
            itemsPerPage={20}
            searchFields={["fullName", "PatientId"]}
            onRowClick={setSelectedPatient}
            columns={[
              { header: "Full Name", accessorKey: "fullName", sortable: true },
              {
                header: "Patient ID",
                accessorKey: "PatientId",
                sortable: true,
              },
              {
                header: "Contact",
                accessorKey: "contactNumber",
              },
              {
                header: "Gender",
                accessorKey: "gender",
              },
              {
                header: "Actions",
                accessorKey: "_id",
                render: (_, row) => (
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPatient(row);
                    }}
                  >
                    View
                  </Button>
                ),
              },
            ]}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
