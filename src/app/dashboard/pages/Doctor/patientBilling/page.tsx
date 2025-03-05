"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

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

// Define the Treatment type
export type Treatment = {
  treatment: string;
  price: string;
  quantity: string;
};

// Define the validation schema with Zod
const formSchema = z.object({
  patientName: z
    .string()
    .nonempty("Patient Name is required")
    .max(100, "Patient Name cannot exceed 100 characters"),
  contactNumber: z
    .string()
    .max(10, "Contact Number should not exceed 10 digits")
    .optional(),
  patientId: z.string().nonempty("Patient ID is required"),
  invoiceId: z.string().nonempty("Invoice ID is required"),
  date: z.string().nonempty("Date is required"),
  gender: z.string().nonempty("Gender is required"),
  email: z.string().optional(),
  treatments: z.array(
    z.object({
      treatment: z.string().nonempty("Treatment is required"),
      price: z.string().nonempty("Price is required"),
      quantity: z.string().nonempty("Quantity is required"),
    })
  ),
  discount: z.string().optional(),
  advance: z.string().optional(),
  amountRecieved: z.string().nonempty("Amount Received is required"),
  modeOfPayment: z.string().nonempty("Mode of Payment is required"),
  address: z.string().optional(),
});

// Infer the form values from the schema
type FormValues = z.infer<typeof formSchema>;

export default function PatientRecords() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const billings = useAppSelector(selectBillings);
  const patients = useAppSelector(selectPatients);

  // State for search input text and suggestion list
  const [searchInput, setSearchInput] = useState("");
  const [suggestions, setSuggestions] = useState<Patient[]>([]);

  const [isLoading, setIsLoading] = useState(false);

  const [patientModelId, setPatientModelId] = useState("");
  const [isPatientSelected, setIsPatientSelected] = useState(false);

  // Initialize treatments state (for dynamic fields)
  const [treatments, setTreatments] = useState<Treatment[]>([
    { treatment: "", price: "", quantity: "" },
  ]);

  // Initialize react-hook-form with the zod resolver
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientName: "",
      contactNumber: "",
      patientId: "",
      invoiceId: "",
      date: "",
      gender: "",
      email: "",
      treatments: treatments,
      discount: "",
      advance: "",
      amountRecieved: "",
      modeOfPayment: "",
      address: "",
    },
  });

  const { data: session } = useSession();

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    try {
      setIsLoading(true);
      sessionStorage.setItem("formData", JSON.stringify(data));
      // Optionally, set a loading state here if using a state variable.
      const dataWithUserId = { ...data, patientModelId: patientModelId };
      // Make the API call to your billing endpoint
      console.log("Submitting billing data:", dataWithUserId);

      // Dispatch the createBilling thunk.
      // We pass an object containing the billing data and the doctor ID.
      const resultAction = await dispatch(
        createBilling({
          billingData: dataWithUserId,
          doctorId: session?.user?.id || "",
        })
      );

      if (createBilling.fulfilled.match(resultAction)) {
        console.log("Billing created successfully", resultAction.payload);

        // Redirect to the invoice page on success.
        router.push("/dashboard/pages/Doctor/patientBilling/invoice");
      } else {
        console.error("Error creating billing:", resultAction.payload);
      }
    } catch (error: unknown) {
      console.error("Error creating billing:", error);

      if (error instanceof Error) {
        console.error("Error creating billing:", error.message);
        // Optionally set a form error
        // setFormError(error.message || "An unexpected error occurred");
      } else {
        console.error("An unexpected error occurred");
        // setFormError("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
      setIsPatientSelected(false);

      // Optionally, clear the loading state here.
    }
  };

  // Add new treatment field
  const handleAddField = () => {
    const newTreatments = [
      ...treatments,
      { treatment: "", price: "", quantity: "" },
    ];
    setTreatments(newTreatments);
    form.setValue("treatments", newTreatments);
  };

  // Update treatment field
  const handleTreatmentChange = (index: number, value: string) => {
    const newTreatments = [...treatments];
    newTreatments[index].treatment = value;
    setTreatments(newTreatments);
    form.setValue(`treatments.${index}.treatment` as const, value);
  };

  // Update price field
  const handlePriceChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newTreatments = [...treatments];
    newTreatments[index].price = e.target.value;
    setTreatments(newTreatments);
    form.setValue(`treatments.${index}.price` as const, e.target.value);
  };

  // Update quantity field
  const handleQuantityChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newTreatments = [...treatments];
    newTreatments[index].quantity = e.target.value;
    setTreatments(newTreatments);
    form.setValue(`treatments.${index}.quantity` as const, e.target.value);
  };

  // If the first two characters are "ES" followed by a digit,
  // search by patientId; otherwise, search by patientName.
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
      // Search by patientId (case-insensitive)
      filteredPatients = patients.filter((patient) =>
        patient.PatientId.toLowerCase().includes(value.toLowerCase())
      );
    } else {
      // Search by patientName (case-insensitive)
      filteredPatients = patients.filter((patient) =>
        patient.fullName.toLowerCase().includes(value.toLowerCase())
      );
    }

    setSuggestions(filteredPatients);
  };

  // When a suggestion is clicked, set the form values accordingly
  const handleSelectSuggestion = (patient: (typeof patients)[0]) => {
    setIsPatientSelected(true);
    // Set the search input to the selected patient's name or id
    setSearchInput(patient.fullName);
    console.log("patient", patient);
    // console.log("billings", billings);

    setPatientModelId(patient._id);

    // Get all the previous treatments for the invoice

    // Clear suggestions
    setSuggestions([]);
    // Enable the form and set the patient fields
    form.setValue("patientName", patient.fullName);
    form.setValue("contactNumber", patient.contactNumber);
    form.setValue("patientId", patient.PatientId);
    form.setValue("gender", patient.gender);
    form.setValue("email", patient.email);
    // Convert the address object to a string and set it in the form
    if (patient.address) {
      const { street, city, state, postalCode } = patient.address;
      const formattedAddress = `${street}, ${city}, ${state} - ${postalCode}`;
      form.setValue("address", formattedAddress);
    }
    // Generate a random 6-digit number (from 100000 to 999999)
    const randomNumber = Math.floor(Math.random() * 900000) + 100000;
    const generatedInvoiceId = `${patient.PatientId}-${randomNumber}`;
    form.setValue("invoiceId", generatedInvoiceId);
    // return `${patientId} - ${randomNumber}`;

    // Now, filter the Redux billings array to get the bills for this patient.
    // We assume that billing.patientId (a string) matches patient._id (also as a string)
    // and optionally that billing.invoiceId starts with patient.PatientId.

    const filteredBillings = billings.filter(
      (bill) =>
        bill.patientId === patient._id &&
        bill.invoiceId.startsWith(patient.PatientId)
    );

    // console.log("filteredBillings", filteredBillings);

    // Sort by createdAt descending (most recent first) and take the first three records.
    const latestThreeBillings = filteredBillings
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 3);

    console.log("Latest 3 billings for patient:", latestThreeBillings);

    // Store the latest three billing records in sessionStorage so the invoice page can access them
    sessionStorage.setItem(
      "lastThreeBillings",
      JSON.stringify(latestThreeBillings)
    );
  };

  useEffect(() => {
    // Generate a random 6-digit number (from 100000 to 999999)
    const randomNumber = Math.floor(Math.random() * 900000) + 100000;
    const generatedInvoiceId = `ES${randomNumber}-${randomNumber}`;
    form.setValue("invoiceId", generatedInvoiceId);
    // return `${patientId} - ${randomNumber}`;
  }, [form]);

  return (
    <DashboardLayout>
      <div className="w-full p-6 space-y-6">
        {isLoading ? (
          <Loading />
        ) : (
          <>
            {/* Top Section: Search & New Bill Button */}
            <div className="w-full flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-lg shadow-sm">
              <div className="relative w-full">
                <Search
                  className="absolute left-3 top-2.5 text-gray-400"
                  size={18}
                />
                <Input
                  type="text"
                  placeholder="Search patients..."
                  onChange={handleSearchChange} // (simulate selection)
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
              {/* <Button
                onClick={() => {
                  // Optionally clear suggestions if needed
                  setSuggestions([]);
                }}
                className="mt-3 md:mt-0 md:ml-4 flex items-center gap-2"
              >
                <UserPlus size={18} />
                New Bill
              </Button> */}
            </div>

            {isPatientSelected ? (
              <div>
                {/* Registration Form */}
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
                              placeholder="Enter your first name"
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

                    {/* Patient ID & Generate Button */}
                    <div className="mb-4 flex flex-col sm:flex-row sm:items-end gap-2">
                      <FormField
                        control={form.control}
                        name="patientId"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>Patient ID</FormLabel>
                            <FormControl>
                              <Input placeholder="Patient ID" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="mb-4 flex flex-col sm:flex-row sm:items-end gap-2">
                      <FormField
                        control={form.control}
                        name="invoiceId"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>Invoice ID</FormLabel>
                            <FormControl>
                              <Input placeholder="Invoice ID" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

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
                              <option value="">Select your gender</option>
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
                              placeholder="Enter your email"
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
                          {/* Treatment Input with Datalist */}
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
                          {/* Quantity Input */}
                          <div className="w-full sm:w-1/4">
                            <input
                              type="number"
                              placeholder="Qty"
                              value={field.quantity}
                              onChange={(e) => handleQuantityChange(index, e)}
                              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                          </div>
                          {/* Price Input */}
                          <div className="w-full sm:w-1/4">
                            <input
                              type="number"
                              placeholder="Price"
                              value={field.price}
                              onChange={(e) => handlePriceChange(index, e)}
                              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                          </div>
                          {/* Add New Field Button */}
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

                    {/* Amount Recieved */}
                    <FormField
                      control={form.control}
                      name="amountRecieved"
                      render={({ field }) => (
                        <FormItem className="mb-4">
                          <FormLabel>Amount Recieved (in Rs.)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter amount recieved"
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
