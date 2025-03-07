"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import DashboardLayout from "@/app/dashboard/layout/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

// Import shadcn/ui Form components
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useAppDispatch, useAppSelector } from "@/app/redux/store/hooks";
import { selectPatients, Patient } from "@/app/redux/slices/patientSlice";
import { useSession } from "next-auth/react";
import { createBilling, selectBillings } from "@/app/redux/slices/billingSlice";
import Loading from "@/app/components/loading/Loading";
import SelectPatientMessage from "@/app/components/SelectPatientMessage";
import { zodBillingSchema } from "@/schemas/zodBillingSchema";

// Import the centralized Zod schema for billing form validation.

// Infer form values from the imported schema.
type FormValues = z.infer<typeof zodBillingSchema>;

export default function PatientRecords() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const billings = useAppSelector(selectBillings);
  const patients = useAppSelector(selectPatients);

  // State for search input and suggestions.
  const [searchInput, setSearchInput] = useState("");
  const [suggestions, setSuggestions] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [patientModelId, setPatientModelId] = useState("");
  const [isPatientSelected, setIsPatientSelected] = useState(false);

  // Manage dynamic treatments array state.
  // Note: Use number for price and quantity
  const [treatments, setTreatments] = useState([
    { treatment: "", price: 0, quantity: 0 },
  ]);

  // Initialize react-hook-form using the centralized Zod schema.
  const form = useForm<FormValues>({
    resolver: zodResolver(zodBillingSchema),
    defaultValues: {
      patientName: "",
      contactNumber: "",
      patientId: "",
      invoiceId: "",
      date: "",
      gender: "",
      email: "",
      treatments: treatments,
      discount: 0,
      advance: 0,
      amountReceived: 0,
      modeOfPayment: "",
      address: "",
    },
  });

  const { data: session } = useSession();

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    try {
      setIsLoading(true);
      // Store form data in sessionStorage if needed.
      sessionStorage.setItem("formData", JSON.stringify(data));

      // Append patientModelId from state into form data.
      const dataWithUserId = { ...data, patientModelId: patientModelId };

      console.log("Submitting billing data:", dataWithUserId);

      // Dispatch the createBilling thunk with the billing data and doctor ID.
      const resultAction = await dispatch(
        createBilling({
          billingData: dataWithUserId,
          doctorId: session?.user?.id || "",
        })
      );

      if (createBilling.fulfilled.match(resultAction)) {
        console.log("Billing created successfully", resultAction.payload);
        router.push("/dashboard/pages/Doctor/patientBilling/invoice");
      } else {
        console.error("Error creating billing:", resultAction.payload);
      }
    } catch (error: unknown) {
      console.error("Error creating billing:", error);
    } finally {
      setIsLoading(false);
      setIsPatientSelected(false);
    }
  };

  // Add a new treatment field.
  const handleAddField = () => {
    const newTreatments = [
      ...treatments,
      { treatment: "", price: 0, quantity: 0 },
    ];
    setTreatments(newTreatments);
    form.setValue("treatments", newTreatments);
  };

  // Update treatment field.
  const handleTreatmentChange = (index: number, value: string) => {
    const newTreatments = [...treatments];
    newTreatments[index].treatment = value;
    setTreatments(newTreatments);
    form.setValue(`treatments.${index}.treatment` as const, value);
  };

  // Update price field. Convert the input to a number.
  const handlePriceChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = Number(e.target.value);
    const newTreatments = [...treatments];
    newTreatments[index].price = value;
    setTreatments(newTreatments);
    form.setValue(`treatments.${index}.price` as const, value);
  };

  // Update quantity field. Convert the input to a number.
  const handleQuantityChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = Number(e.target.value);
    const newTreatments = [...treatments];
    newTreatments[index].quantity = value;
    setTreatments(newTreatments);
    form.setValue(`treatments.${index}.quantity` as const, value);
  };

  // Handle patient search.
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);

    if (value.length < 3) {
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

  // When a patient is selected, populate the form fields.
  const handleSelectSuggestion = (patient: Patient) => {
    setIsPatientSelected(true);
    setSearchInput(patient.fullName);
    setPatientModelId(patient._id);
    setSuggestions([]);

    form.setValue("patientName", patient.fullName);
    form.setValue("contactNumber", patient.contactNumber);
    form.setValue("patientId", patient.PatientId);
    form.setValue("gender", patient.gender);
    form.setValue("email", patient.email);

    if (patient.address) {
      const { street, city, state, postalCode } = patient.address;
      const formattedAddress = `${street}, ${city}, ${state} - ${postalCode}`;
      form.setValue("address", formattedAddress);
    }
    // Generate invoice ID using patient ID and random number.
    const randomNumber = Math.floor(Math.random() * 900000) + 100000;
    const generatedInvoiceId = `${patient.PatientId}-${randomNumber}`;
    form.setValue("invoiceId", generatedInvoiceId);

    // Retrieve the latest three billing records for this patient.
    const filteredBillings = billings.filter(
      (bill) =>
        bill.patientId === patient._id &&
        bill.invoiceId.startsWith(patient.PatientId)
    );
    const latestThreeBillings = filteredBillings
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 3);
    console.log("Latest 3 billings for patient:", latestThreeBillings);
    sessionStorage.setItem(
      "lastThreeBillings",
      JSON.stringify(latestThreeBillings)
    );
  };

  useEffect(() => {
    // Generate a random invoice ID on mount.
    const randomNumber = Math.floor(Math.random() * 900000) + 100000;
    const generatedInvoiceId = `ES${randomNumber}-${randomNumber}`;
    form.setValue("invoiceId", generatedInvoiceId);
  }, [form]);

  return (
    <DashboardLayout>
      <div className="w-full p-6 space-y-6">
        {isLoading ? (
          <Loading />
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

            {isPatientSelected ? (
              <div>
                {/* Billing Form */}
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="bg-white p-6 rounded-lg shadow-md w-full mx-auto"
                  >
                    <h2 className="text-2xl font-bold mb-4 text-gray-700 text-center">
                      Billing Form
                    </h2>

                    {/* Patient Name */}
                    <FormField
                      control={form.control}
                      name="patientName"
                      render={({ field }) => (
                        <FormItem className="mb-4">
                          <FormLabel>Patient Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter patient name"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Contact Number */}
                    <FormField
                      control={form.control}
                      name="contactNumber"
                      render={({ field }) => (
                        <FormItem className="mb-4">
                          <FormLabel>Contact Number</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="Enter contact number"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Patient ID */}
                    <FormField
                      control={form.control}
                      name="patientId"
                      render={({ field }) => (
                        <FormItem className="mb-4">
                          <FormLabel>Patient ID</FormLabel>
                          <FormControl>
                            <Input placeholder="Patient ID" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Invoice ID */}
                    <FormField
                      control={form.control}
                      name="invoiceId"
                      render={({ field }) => (
                        <FormItem className="mb-4">
                          <FormLabel>Invoice ID</FormLabel>
                          <FormControl>
                            <Input placeholder="Invoice ID" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Date */}
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem className="mb-4">
                          <FormLabel>Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Gender */}
                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem className="mb-4">
                          <FormLabel>Gender</FormLabel>
                          <FormControl>
                            <select
                              {...field}
                              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                            >
                              <option value="">Select gender</option>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Email */}
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem className="mb-4">
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="Enter email"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Treatments */}
                    <div className="mb-4">
                      <FormLabel className="mb-2 block text-sm font-medium text-gray-600">
                        Treatments
                      </FormLabel>
                      {treatments.map((field, index) => (
                        <div
                          key={index}
                          className="flex flex-col sm:flex-row items-center gap-2 mb-4"
                        >
                          <div className="flex-1">
                            <input
                              list="treatment-options"
                              value={field.treatment}
                              onChange={(e) =>
                                handleTreatmentChange(index, e.target.value)
                              }
                              placeholder="Select a treatment"
                              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                            <datalist id="treatment-options">
                              <option value="Consultation" />
                              <option value="Follow-up" />
                              <option value="RVG/Digital X-ray" />
                              <option value="Multi-Visit Root Canal Treatment" />
                              <option value="Single-Visit Root Canal Treatment" />
                              <option value="Complex Anatomy and Calcified Canals" />
                              <option value="Re-Treatment / Re-RCT" />
                              <option value="Veneers (Porcelain/Lithium Disilicate)" />
                              <option value="Composite" />
                              <option value="Restoration" />
                              <option value="Denture (Indian)" />
                              <option value="Denture (German)" />
                              <option value="Zirconia (Basic)" />
                              <option value="Zirconia (Vita)" />
                              <option value="Zirconia (3M Lava)" />
                              <option value="PFM (Normal)" />
                              <option value="PFM (Warranty)" />
                              <option value="Metal Crown (Normal)" />
                              <option value="Metal Crown (DMLS)" />
                              <option value="E-Max" />
                              <option value="Neodent (Basic)" />
                              <option value="Ostem" />
                              <option value="Strauman (Brazilian)" />
                              <option value="Novel Bio" />
                              <option value="Metal Braces" />
                              <option value="Ceramic Braces" />
                              <option value="Aligners (Toothsi)" />
                              <option value="Aligners (Invisalign)" />
                              <option value="Normal Extraction" />
                              <option value="Grossly Decayed Extraction" />
                              <option value="Impaction" />
                              <option value="GIC" />
                              <option value="Composite" />
                              <option value="Scaling with Polishing" />
                              <option value="Scaling with Chair-side Teeth Whitening" />
                              <option value="Air Prophylaxis" />
                              <option value="Professional Teeth Whitening with Kit" />
                            </datalist>
                          </div>
                          <div className="w-full sm:w-1/4">
                            <input
                              type="number"
                              placeholder="Qty"
                              value={field.quantity}
                              onChange={(e) => handleQuantityChange(index, e)}
                              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                          </div>
                          <div className="w-full sm:w-1/4">
                            <input
                              type="text"
                              placeholder="Price"
                              value={field.price}
                              onChange={(e) => handlePriceChange(index, e)}
                              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                          </div>
                          {index === treatments.length - 1 && (
                            <Button
                              type="button"
                              onClick={handleAddField}
                              className="bg-blue-500 text-white p-2 rounded"
                            >
                              +
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Advance */}
                    <FormField
                      control={form.control}
                      name="advance"
                      render={({ field }) => (
                        <FormItem className="mb-4">
                          <FormLabel>Advance (in Rs.)</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter advance" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Discount */}
                    <FormField
                      control={form.control}
                      name="discount"
                      render={({ field }) => (
                        <FormItem className="mb-4">
                          <FormLabel>Discount (in Rs.)</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter discount" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Amount Received */}
                    <FormField
                      control={form.control}
                      name="amountReceived"
                      render={({ field }) => (
                        <FormItem className="mb-4">
                          <FormLabel>Amount Received (in Rs.)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter amount received"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Mode of Payment */}
                    <FormField
                      control={form.control}
                      name="modeOfPayment"
                      render={({ field }) => (
                        <FormItem className="mb-4">
                          <FormLabel>Mode of Payment</FormLabel>
                          <FormControl>
                            <select
                              {...field}
                              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                            >
                              <option value="">Select Mode</option>
                              <option value="Debit/Credit">Debit/Credit</option>
                              <option value="Cash">Cash</option>
                              <option value="UPI">UPI</option>
                              <option value="Other">Other</option>
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Address */}
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem className="mb-4">
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter your address"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      className="w-full text-white p-3 rounded-md"
                      disabled={isLoading}
                    >
                      {isLoading
                        ? "Generating bill. Please wait.."
                        : "Generate bill"}
                    </Button>
                  </form>
                </Form>
              </div>
            ) : (
              <SelectPatientMessage />
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
