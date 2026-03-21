"use client";

import { useRouter } from "next/navigation";
import { useState, useCallback, useMemo, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/app/redux/store/hooks";
import { selectPatients, Patient } from "@/app/redux/slices/patientSlice";
import { useSession } from "next-auth/react";
import { BillingRecord, createBilling, selectBillings } from "@/app/redux/slices/billingSlice";
import Loading from "@/app/components/loading/Loading";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import DashboardLayout from "@/app/dashboard/layout/DashboardLayout";
import PatientBillingForm, {
  FormValues,
} from "@/app/components/doctor/PatientBillingForm";
import BillingAnalytics from "@/app/components/doctor/BillingAnalytics";
import BillingNote from "@/app/components/doctor/BillingNote";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface PatientBillingClientProps {
  initialPatients?: Patient[];
  initialBillings?: BillingRecord[];
}

export default function PatientRecords({ initialPatients = [], initialBillings = [] }: PatientBillingClientProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const billings = useAppSelector(selectBillings);
  const patients = useAppSelector(selectPatients);

  const { data: session } = useSession();

  // State for search input and suggestions
  const [searchInput, setSearchInput] = useState("");
  const [suggestions, setSuggestions] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const handleBillingSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true);

      if (!selectedPatient) {
        throw new Error("No patient selected");
      }

      const dataWithUserId = {
        ...data,
        patientModelId: selectedPatient._id,
      };

      const resultAction = await dispatch(
        createBilling({
          billingData: dataWithUserId,
          doctorId: session?.user?.id || "",
        })
      );

      if (createBilling.fulfilled.match(resultAction)) {
        const sanitize = <T extends Record<string, unknown>>(
          data: T
        ): Partial<T> =>
          Object.fromEntries(
            Object.entries(data).filter(
              ([, value]) => value !== null && value !== undefined
            )
          ) as Partial<T>;

        const sanitizedData = sanitize(data);

        sessionStorage.setItem("formData", JSON.stringify(sanitizedData));
        router.push("/dashboard/pages/Doctor/patientBilling/invoice");
      }
    } catch (error: unknown) {
      console.error("Error creating billing:", error);
    } finally {
      setIsLoading(false);
      setSelectedPatient(null);
      setSearchInput("");
      // Clear search state
      setSuggestions([]);
      setHasSearched(false);
    }
  };

  // Enhanced search function with server-side filtering
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      setHasSearched(false);
      return;
    }

    setSearchLoading(true);
    setHasSearched(true);

    try {
      const response = await fetch(`/api/doctor/searchPatients?query=${encodeURIComponent(query)}`);
      const data = await response.json();
      setSuggestions(data.patients || []);
    } catch (error) {
      console.error('Patient search failed:', error);
      setSuggestions([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // Debounce patient query for performance
  useEffect(() => {
    const timer = setTimeout(() => {
      // Only perform search if patient is not selected
      if (!selectedPatient) {
        performSearch(searchInput);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, performSearch, selectedPatient]);

  // Get suggestions - use search results if available, otherwise use Redux patients
  const filteredSuggestions = useMemo(() => {
    if (!hasSearched) {
      // If no search performed, show all patients from Redux store
      return patients;
    }
    return suggestions;
  }, [hasSearched, suggestions, patients]);

  // Handle patient search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);

    // Clear selection when typing
    if (selectedPatient) {
      setSelectedPatient(null);
    }
  };

  // When a patient is selected
  const handleSelectSuggestion = (patient: Patient) => {
    setSelectedPatient(patient);
    setSearchInput(`${patient.fullName} (${patient.PatientId})`);
    setSuggestions([]);
    setHasSearched(false);
  };

  return (
    <DashboardLayout>
      <div className="w-full p-6 space-y-6">
        {isLoading ? (
          <Loading loadingMessage={true} />
        ) : (
          <>
            {/* Search Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Search Patient</span>
                  {selectedPatient && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      Selected: {selectedPatient.fullName}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Search
                    className="absolute left-3 top-3 text-muted-foreground"
                    size={18}
                  />
                  <Input
                    type="text"
                    placeholder="Search patients by name, ID, or phone..."
                    value={searchInput}
                    onChange={handleSearchChange}
                    className="pl-10 pr-4 py-2 w-full border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  {searchLoading && (
                    <div className="absolute right-10 top-3">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    </div>
                  )}

                  {hasSearched && (
                    <ul className="absolute z-10 w-full bg-background border-border rounded-md mt-1 shadow-lg max-h-60 overflow-auto">
                      <li className="px-4 py-2 border-b border-border bg-muted/50 text-sm text-muted-foreground">
                        {searchLoading ? (
                          'Searching...'
                        ) : filteredSuggestions.length === 0 ? (
                          'No patients found'
                        ) : (
                          `Showing ${filteredSuggestions.length} result${filteredSuggestions.length !== 1 ? 's' : ''}`
                        )}
                      </li>
                      {filteredSuggestions.map((patient, index) => (
                        <li
                          key={index}
                          className="px-4 py-3 hover:bg-accent hover:text-accent-foreground border-b border-border last:border-b-0 cursor-pointer transition-colors"
                          onClick={() => handleSelectSuggestion(patient)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{patient.fullName}</div>
                              <div className="text-sm text-muted-foreground">
                                ID: {patient.PatientId} • {patient.gender}
                              </div>
                            </div>
                            <div className="text-right">
                              {patient.contactNumber && (
                                <div className="text-sm text-muted-foreground">📞 {patient.contactNumber}</div>
                              )}
                              {patient.email && (
                                <div className="text-xs text-muted-foreground truncate">{patient.email}</div>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Fallback UI for no search results */}
                  {!selectedPatient &&
                    hasSearched &&
                    filteredSuggestions.length === 0 &&
                    !searchLoading &&
                    searchInput.trim() !== "" && (
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
              </CardContent>
            </Card>

            {selectedPatient ? (
              <PatientBillingForm
                patient={selectedPatient}
                billings={billings}
                onSubmit={handleBillingSubmit}
                isLoading={isLoading}
              />
            ) : (
              <div className="grid grid-cols-1 gap-6">
                <BillingNote />
                <BillingAnalytics
                  initialPatients={initialPatients}
                  initialBillings={initialBillings}
                />
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}