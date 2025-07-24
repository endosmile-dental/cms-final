"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/app/redux/store/hooks";
import { selectPatients, Patient } from "@/app/redux/slices/patientSlice";
import { useSession } from "next-auth/react";
import { createBilling, selectBillings } from "@/app/redux/slices/billingSlice";
import Loading from "@/app/components/loading/Loading";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import DashboardLayout from "@/app/dashboard/layout/DashboardLayout";
import PatientBillingForm, {
  FormValues,
} from "@/app/components/doctor/PatientBillingForm";
import { selectAppointments } from "@/app/redux/slices/appointmentSlice";
import BillingAnalytics from "@/app/components/doctor/BillingAnalytics";
import BillingNote from "@/app/components/doctor/BillingNote";

export default function PatientRecords() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const billings = useAppSelector(selectBillings);
  const patients = useAppSelector(selectPatients);
  const appointments = useAppSelector(selectAppointments);

  useEffect(() => {
    if (appointments || patients || billings) {
      console.log("appointments", appointments);
      console.log("patients", patients);
      console.log("billings", billings);
    }
  }, [appointments, billings, patients]);

  const { data: session } = useSession();

  // State for search input and suggestions
  const [searchInput, setSearchInput] = useState("");
  const [suggestions, setSuggestions] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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
    }
  };

  // Handle patient search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);

    if (value.length < 1) {
      setSuggestions([]);
      return;
    }

    let filteredPatients;
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

  // When a patient is selected
  const handleSelectSuggestion = (patient: Patient) => {
    setSelectedPatient(patient);
    setSearchInput(patient.fullName);
    setSuggestions([]);
  };

  return (
    <DashboardLayout>
      <div className="w-full p-6 space-y-6">
        {isLoading ? (
          <Loading loadingMessage={true} />
        ) : (
          <>
            {/* Search Section */}
            <div className="w-full flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-lg shadow-sm">
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
            </div>

            {selectedPatient ? (
              <PatientBillingForm
                patient={selectedPatient}
                billings={billings}
                onSubmit={handleBillingSubmit}
                isLoading={isLoading}
              />
            ) : (
              <>
                <BillingNote />
                <BillingAnalytics />
              </>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
