"use client";
import DataTable from "@/app/components/DataTable";
import PatientDetailView from "@/app/components/doctor/PatientDetailView";
import DashboardLayout from "@/app/dashboard/layout/DashboardLayout";
import { Patient, selectPatients } from "@/app/redux/slices/patientSlice";
import { useAppSelector } from "@/app/redux/store/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  FileText,
  Search,
  UserPlus,
  Calendar,
  Phone,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type ContactValue =
  | string
  | string[]
  | {
    fullName?: string;
    contactNumber?: string;
    relationship?: string;
  }
  | {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  }
  | undefined;

export default function PatientRecords() {
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState("");
  const [suggestions, setSuggestions] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const suggestionBoxRef = useRef<HTMLUListElement | null>(null);

  const patients = useAppSelector(selectPatients);

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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);

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
        {/* Updated Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <FileText className="text-blue-600" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Patient Records
              </h1>
              <p className="text-gray-600">
                Manage patient information and medical records
              </p>
            </div>
          </div>

          <Link href="/dashboard/pages/Doctor/patientRecords/patientRegistrationForm">
            <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
              <UserPlus size={18} />
              <span>Add Patient</span>
            </Button>
          </Link>
        </div>

        {/* Search Section in Card */}
        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              {selectedPatient && (
                <Button
                  variant="outline"
                  className="flex items-center gap-2 shrink-0"
                  onClick={() => {
                    setSelectedPatient(null);
                    setSearchInput("");
                  }}
                >
                  <ArrowLeft size={16} />
                  Back to List
                </Button>
              )}

              <div className="relative flex-1 w-full">
                <Search
                  className="absolute left-3 top-3 text-gray-400"
                  size={18}
                />
                <Input
                  placeholder="Search patients by name or ID..."
                  value={searchInput}
                  onChange={handleSearchChange}
                  className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />

                {/* Enhanced Suggestions */}
                {suggestions.length > 0 && (
                  <ul
                    ref={suggestionBoxRef}
                    className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg mt-2 shadow-lg max-h-60 overflow-auto"
                  >
                    {suggestions.map((patient, index) => (
                      <li
                        key={index}
                        className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                        onClick={() => handleSelectSuggestion(patient)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">
                              {patient.fullName}
                            </p>
                            <p className="text-sm text-gray-600">
                              ID: {patient.PatientId}
                            </p>
                          </div>
                          <Badge variant="secondary" className="bg-gray-100">
                            {patient.gender}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Phone size={12} />
                            <span>{patient.contactNumber}</span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {selectedPatient ? (
          <PatientDetailView
            patient={selectedPatient}
            onPatientUpdated={setSelectedPatient}
          />
        ) : (
          /* Updated Patient List in Card */
          <Card className="bg-white shadow-sm border-0">
            <CardContent className="p-0">
              <DataTable<Patient>
                data={patients}
                title=""
                itemsPerPage={15}
                searchFields={["fullName", "PatientId", "contactNumber"]}
                onRowClick={setSelectedPatient}
                columns={[
                  {
                    header: "Patient Name",
                    accessorKey: "fullName",
                    sortable: true,
                  },
                  {
                    header: "Patient ID",
                    accessorKey: "PatientId",
                    sortable: true,
                  },
                  {
                    header: "Contact",
                    accessorKey: "contactNumber",
                    render: (value: ContactValue) => {
                      let contactValue = "N/A";

                      if (typeof value === "string") {
                        contactValue = value;
                      } else if (Array.isArray(value)) {
                        contactValue = value.join(", ");
                      } else if (
                        value &&
                        typeof value === "object" &&
                        "contactNumber" in value &&
                        typeof value.contactNumber === "string"
                      ) {
                        contactValue = value.contactNumber;
                      }

                      return (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone size={14} className="text-gray-400" />
                          {contactValue}
                        </div>
                      );
                    },
                  },
                  {
                    header: "Gender",
                    accessorKey: "gender",
                    render: (value) => {
                      // Handle different possible types for gender
                      const genderValue =
                        typeof value === "string" ? value : "N/A";

                      return (
                        <Badge variant="outline" className="capitalize">
                          {genderValue}
                        </Badge>
                      );
                    },
                  },
                  {
                    header: "Date of Birth",
                    accessorKey: "dateOfBirth",
                    sortable: true,
                    render: (value) => {
                      // Handle different possible types for dateOfBirth
                      let dateValue = "N/A";

                      if (
                        typeof value === "string" ||
                        typeof value === "number" ||
                        value instanceof Date
                      ) {
                        try {
                          dateValue = new Date(value).toLocaleDateString();
                        } catch {
                          dateValue = "Invalid Date";
                        }
                      }

                      return (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar size={14} className="text-gray-400" />
                          {dateValue}
                        </div>
                      );
                    },
                  },
                  {
                    header: "Actions",
                    accessorKey: "_id",
                    render: (_, row) => (
                      <Button
                        size="sm"
                        variant="outline"
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
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
