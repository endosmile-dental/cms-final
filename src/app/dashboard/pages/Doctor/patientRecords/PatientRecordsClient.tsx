"use client";
import DataTable from "@/app/components/DataTable";
import PatientDetailView from "@/app/components/doctor/PatientDetailView";
import DashboardLayout from "@/app/dashboard/layout/DashboardLayout";
import { Patient, selectPatients } from "@/app/redux/slices/patientSlice";
import { useAppDispatch, useAppSelector } from "@/app/redux/store/hooks";
import { fetchAppointments } from "@/app/redux/slices/appointmentSlice";
import { fetchBillings } from "@/app/redux/slices/billingSlice";
import { fetchLabWorks } from "@/app/redux/slices/labWorkSlice";
import { useSession } from "next-auth/react";
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

export default function PatientRecords({ 
  initialPatients 
}: { 
  initialPatients?: Patient[] 
}) {
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState("");
  const [suggestions, setSuggestions] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const suggestionBoxRef = useRef<HTMLUListElement | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const patients = useAppSelector(selectPatients);
  const dispatch = useAppDispatch();
  const { data: session } = useSession();
  
  // Use initialPatients if provided, otherwise fall back to Redux store
  const displayPatients = initialPatients && initialPatients.length > 0 ? initialPatients : patients;

  // Preload all appointments, billings and labworks when page mounts
  useEffect(() => {
    if (session?.user.id) {
      dispatch(fetchAppointments({ userId: session.user.id, role: "Doctor" }));
      dispatch(fetchBillings({ userId: session.user.id, role: "Doctor" }));
      dispatch(fetchLabWorks({ userId: session.user.id, role: "Doctor" }));
    }
  }, [session?.user.id, dispatch]);

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

    const filtered = displayPatients.filter((patient) =>
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
    const patientId = searchParams.get("patientId");if (patientId && displayPatients.length > 0) {
      const patientFromQuery = displayPatients.find((p) => p._id === patientId);      if (patientFromQuery) {
        setSelectedPatient(patientFromQuery);      }
    }
  }, [searchParams, displayPatients, selectedPatient]);

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Updated Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg border border-blue-200/50 dark:border-blue-800/30">
              <FileText className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Patient Records
              </h1>
              <p className="text-muted-foreground">
                Manage patient information and medical records
              </p>
            </div>
          </div>

          <Link href="/dashboard/pages/Doctor/patientRecords/patientRegistrationForm">
            <Button className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <UserPlus size={18} />
              <span>Add Patient</span>
            </Button>
          </Link>
        </div>

        {/* Search Section in Card */}
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              {selectedPatient && (
                <Button
                  variant="outline"
                  className="flex items-center gap-2 shrink-0 border-border hover:bg-muted/50 transition-colors duration-200"
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
                  className="absolute left-3 top-3 text-muted-foreground"
                  size={18}
                />
                <Input
                  placeholder="Search patients by name or ID..."
                  value={searchInput}
                  onChange={handleSearchChange}
                  className="pl-10 pr-4 py-2 w-full border-border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />

                {/* Enhanced Suggestions */}
                  {suggestions.length > 0 && (
                    <ul
                      ref={suggestionBoxRef}
                      className="absolute z-10 w-full bg-card border-border rounded-lg mt-2 shadow-lg max-h-60 overflow-auto"
                    >
                      {suggestions.map((patient, index) => (
                        <li
                          key={index}
                          className="px-4 py-3 hover:bg-muted/50 cursor-pointer border-b border-border last:border-b-0 transition-colors"
                          onClick={() => handleSelectSuggestion(patient)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-foreground">
                                {patient.fullName}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                ID: {patient.PatientId}
                              </p>
                            </div>
                            <Badge variant="secondary" className="bg-muted text-foreground">
                              {patient.gender}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Phone size={12} />
                              <span>{patient.contactNumber}</span>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Fallback UI for no search results */}
                  {!selectedPatient && searchInput.trim() !== "" && suggestions.length === 0 && (
                    <div className="absolute z-10 w-full mt-2 bg-card border border-dashed border-border rounded-lg shadow-lg p-4 text-center">
                      <div className="flex items-center justify-center w-8 h-8 mx-auto mb-2 bg-muted/50 rounded-full">
                        <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">Patient not found</p>
                      <Link href="/dashboard/pages/Doctor/patientRecords/patientRegistrationForm">
                        <Button
                          type="button"
                          className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
                          onClick={() => {
                            console.log("clicked")
                          }}
                        >
                          Register New Patient
                        </Button>
                      </Link>
                    </div>
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
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-0">
              <DataTable
                data={displayPatients}
                title=""
                itemsPerPage={15}
                searchFields={["fullName", "PatientId", "contactNumber"]}
                onRowClick={setSelectedPatient}
                enableDateFilter={true}
                dateField="createdAt"
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
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
                    render: (value: unknown) => {
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
                        <div className="flex items-center gap-2 text-sm text-foreground">
                          <Phone size={14} className="text-muted-foreground" />
                          {contactValue}
                        </div>
                      );
                    },
                  },
                  {
                    header: "Gender",
                    accessorKey: "gender",
                    render: (value: unknown) => {
                      // Handle different possible types for gender
                      const genderValue =
                        typeof value === "string" ? value : "N/A";

                      return (
                        <Badge variant="outline" className="capitalize border-border">
                          {genderValue}
                        </Badge>
                      );
                    },
                  },
                  {
                    header: "Date of Birth",
                    accessorKey: "dateOfBirth",
                    sortable: true,
                    render: (value: unknown) => {
                      // Handle different possible types for dateOfBirth
                      let dateValue = "N/A";

                      if (typeof value === "string") {
                        try {
                          // Use a consistent date format that works on both server and client
                          const date = new Date(value);
                          const day = String(date.getDate()).padStart(2, '0');
                          const month = String(date.getMonth() + 1).padStart(2, '0');
                          const year = date.getFullYear();
                          dateValue = `${day}/${month}/${year}`;
                        } catch {
                          dateValue = "Invalid Date";
                        }
                      }

                      return (
                        <div className="flex items-center gap-2 text-sm text-foreground">
                          <Calendar size={14} className="text-muted-foreground" />
                          <span>{dateValue}</span>
                        </div>
                      );
                    },
                  },
                  {
                    header: "Actions",
                    accessorKey: "_id",
                    render: (_value: unknown, row: Patient) => (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-border hover:bg-muted/50 transition-colors duration-200"
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
