"use client";

import React from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import DashboardLayout from "@/app/dashboard/layout/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Import shadcn/ui Form components
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Redux hooks and patient slice action
import { useAppDispatch } from "@/app/redux/store/hooks";
import { addPatient } from "@/app/redux/slices/patientSlice";
import { MultiSelect } from "@/components/ui/multi-select";
import { PreviewDialog } from "@/app/components/PreviewDialog";

const medicalHistoryOptions = [
  { label: "Fever/Cough/Cold", value: "Fever/Cough/Cold" },
  { label: "COVID-19 Positive", value: "COVID-19 Positive" },
  { label: "Recent Hospitalization", value: "Recent Hospitalization" },
  { label: "AIDS/Hepatitis/Herpes", value: "AIDS/Hepatitis/Herpes" },
  { label: "Drug Allergy", value: "Drug Allergy" },
  { label: "Diabetes", value: "Diabetes" },
  { label: "Hypertension", value: "Hypertension" },
  { label: "Asthma", value: "Asthma" },
  { label: "Heart Disease", value: "Heart Disease" },
  { label: "Recent Surgery", value: "Recent Surgery" },
  { label: "Epilepsy/Fits", value: "Epilepsy/Fits" },
  { label: "Thyroid Disorder", value: "Thyroid Disorder" },
  { label: "Lung Disease/TB", value: "Lung Disease/TB" },
  { label: "Bleeding Disorder", value: "Bleeding Disorder" },
  { label: "Cancer Treatment", value: "Cancer Treatment" },
  { label: "Pregnancy/Breastfeeding", value: "Pregnancy/Breastfeeding" },
];

const currentMedicationsOptions = [
  { label: "Antibiotics", value: "Antibiotics" },
  { label: "Antihypertensives", value: "Antihypertensives" },
  { label: "Antidiabetics", value: "Antidiabetics" },
  { label: "Asthma Inhalers", value: "Asthma Inhalers" },
  { label: "Thyroid Medications", value: "Thyroid Medications" },
  { label: "Heart Medications", value: "Heart Medications" },
  { label: "Blood Thinners", value: "Blood Thinners" },
  { label: "Cancer Medications", value: "Cancer Medications" },
  { label: "Steroids", value: "Steroids" },
  { label: "Pain Killers", value: "Pain Killers" },
  { label: "Vitamins/Supplements", value: "Vitamins/Supplements" },
  { label: "Anti-allergy Drugs", value: "Anti-allergy Drugs" },
  { label: "Anti-epileptic Drugs", value: "Anti-epileptic Drugs" },
  { label: "TB Medications", value: "TB Medications" },
];

// Define the Zod schema based on your Patient model
const patientSchema = z.object({
  fullName: z.string().min(1, { message: "Full name is required" }),
  contactNumber: z.string().min(1, { message: "Contact number is required" }),
  gender: z.enum(["Male", "Female", "Other"], {
    errorMap: () => ({ message: "Please select a valid gender" }),
  }),
  dateOfBirth: z.string().min(1, { message: "Date of birth is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
  // Address is optional
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postalCode: z.string().optional(),
    })
    .optional(),
  // For simplicity, medicalHistory and currentMedications are comma‐separated strings stored in array.
  medicalHistory: z.string().array().optional(),
  currentMedications: z.string().array().optional(),
  // Emergency contact is optional; if provided, each field is required.
  emergencyContact: z
    .object({
      fullName: z.string().optional(),
      contactNumber: z.string().optional(),
      relationship: z.string().optional(),
    })
    .optional(),
});

type PatientFormValues = z.infer<typeof patientSchema>;

export default function PatientRegistrationForm() {
  const { data: session } = useSession();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [isLoading, setIsLoading] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const [showPreviewModal, setShowPreviewModal] = React.useState(false);
  const [previewData, setPreviewData] =
    React.useState<PatientFormValues | null>(null);
  const [modalError, setModalError] = React.useState<string | null>(null);

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      fullName: "",
      contactNumber: "",
      gender: "Male",
      dateOfBirth: "",
      email: "",
      password: "",
      address: {
        street: "",
        city: "",
        state: "",
        postalCode: "",
      },
      medicalHistory: [],
      currentMedications: [],
      emergencyContact: {
        fullName: "",
        contactNumber: "",
        relationship: "",
      },
    },
  });

  // Modified onSubmit handler - only shows preview modal
  const onSubmit: SubmitHandler<PatientFormValues> = (data) => {
    // Show preview modal with form data
    setPreviewData(data);
    setShowPreviewModal(true);
  };

  // New confirmation handler with the actual API call
  const handleConfirm = async () => {
    if (!previewData) return;

    setIsLoading(true);
    setFormError(null);

    try {
      // Format the data from preview state
      const formattedData = {
        ...previewData,
        medicalHistory: previewData.medicalHistory?.join(",") || "",
        currentMedications: previewData.currentMedications?.join(",") || "",
      };

      const res = await fetch("/api/doctor/addPatient", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-doctor-id": session?.user?.id || "",
        },
        body: JSON.stringify(formattedData),
      });

      const result = await res.json();

      if (!res.ok) {
        setFormError(result.error || "An error occurred during registration");
        console.error("Error registering patient:", result.error);
      } else {
        console.log("Patient registration successful", result);
        dispatch(addPatient(result.patient));
        router.push("/dashboard/pages/Doctor/patientRecords");
        setShowPreviewModal(false); // Close modal on success
      }
    } catch (error: unknown) {
      console.error("Error registering patient:", error);
      setFormError(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 w-full">
        <h1 className="text-3xl font-bold mb-6 text-center">
          Patient Registration
        </h1>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 bg-white p-6 rounded-lg w-full"
          >
            {/* Global Error Message */}
            {formError && (
              <div className="p-4 bg-red-100 text-red-700 rounded">
                {formError}
              </div>
            )}

            {/* Full Name */}
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter full name" {...field} />
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
                <FormItem>
                  <FormLabel>Contact Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter contact number" {...field} />
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
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date of Birth */}
            <FormField
              control={form.control}
              name="dateOfBirth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of Birth</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
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
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Enter email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Password */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Enter password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Address Section */}
            <div className="border-t pt-4">
              <h2 className="text-xl font-semibold mb-4">Address</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="address.street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>House no./Appartment</FormLabel>
                      <FormControl>
                        <Input placeholder="Street" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address.city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="City" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address.state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input placeholder="State" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address.postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postal Code</FormLabel>
                      <FormControl>
                        <Input placeholder="Postal Code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Medical History */}
            <div>
              <FormLabel>Medical History</FormLabel>
              <MultiSelect
                options={medicalHistoryOptions}
                onValueChange={(values) =>
                  form.setValue("medicalHistory", values)
                }
                defaultValue={form.watch("medicalHistory")}
                placeholder="Select medical conditions"
                variant="secondary"
              />
            </div>

            {/* Current Medications */}
            <div>
              <FormLabel>Current Medications</FormLabel>
              <MultiSelect
                options={currentMedicationsOptions}
                onValueChange={(values) =>
                  form.setValue("currentMedications", values)
                }
                defaultValue={form.watch("currentMedications")}
                placeholder="Select current medications"
                variant="secondary"
              />
            </div>

            {/* Emergency Contact Section */}
            <div className="border-t pt-4">
              <h2 className="text-xl font-semibold mb-4">Emergency Contact</h2>
              <FormField
                control={form.control}
                name="emergencyContact.fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter emergency contact name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="emergencyContact.contactNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter emergency contact number"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="emergencyContact.relationship"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Relationship</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Relationship (e.g., Parent, Spouse)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full text-white p-3 rounded-md"
              disabled={isLoading}
            >
              {isLoading ? "Registering..." : "Register Patient"}
            </Button>
          </form>
        </Form>
      </div>

      <PreviewDialog
        open={showPreviewModal}
        onOpenChange={(open) => {
          if (!open) setModalError(null);
          setShowPreviewModal(open);
        }}
        onConfirm={handleConfirm}
        isLoading={isLoading}
        error={modalError}
        title="Patient Registration Preview"
        description="Please review the patient information before confirming."
      >
        {/* Keep all the existing preview content */}
        <div className="space-y-4 p-2 md:p-5">
          {/* Personal Information */}
          <div className="space-y-2">
            <h3 className="font-semibold">Personal Information</h3>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-muted-foreground">Full Name</dt>
                <dd>{previewData?.fullName}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">
                  Contact Number
                </dt>
                <dd>{previewData?.contactNumber}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Gender</dt>
                <dd>{previewData?.gender}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Date of Birth</dt>
                <dd>{previewData?.dateOfBirth}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Email</dt>
                <dd>{previewData?.email}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Password</dt>
                <dd>••••••••</dd>
              </div>
            </dl>
          </div>

          {/* Address */}
          {previewData?.address && (
            <div className="space-y-2">
              <h3 className="font-semibold">Address</h3>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-muted-foreground">Street</dt>
                  <dd>{previewData.address.street || "-"}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">City</dt>
                  <dd>{previewData.address.city || "-"}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">State</dt>
                  <dd>{previewData.address.state || "-"}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Postal Code</dt>
                  <dd>{previewData.address.postalCode || "-"}</dd>
                </div>
              </dl>
            </div>
          )}

          {/* Medical History */}
          <div className="space-y-2">
            <h3 className="font-semibold">Medical History</h3>
            <div className="flex flex-wrap gap-2">
              {previewData?.medicalHistory?.map((item) => (
                <span
                  key={item}
                  className="bg-blue-100 text-blue-800 px-2 py-1 rounded"
                >
                  {item}
                </span>
              ))}
              {!previewData?.medicalHistory?.length && (
                <span className="text-muted-foreground">None</span>
              )}
            </div>
          </div>

          {/* Current Medications */}
          <div className="space-y-2">
            <h3 className="font-semibold">Current Medications</h3>
            <div className="flex flex-wrap gap-2">
              {previewData?.currentMedications?.map((item) => (
                <span
                  key={item}
                  className="bg-green-100 text-green-800 px-2 py-1 rounded"
                >
                  {item}
                </span>
              ))}
              {!previewData?.currentMedications?.length && (
                <span className="text-muted-foreground">None</span>
              )}
            </div>
          </div>

          {/* Emergency Contact */}
          {previewData?.emergencyContact && (
            <div className="space-y-2">
              <h3 className="font-semibold">Emergency Contact</h3>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-muted-foreground">Name</dt>
                  <dd>{previewData.emergencyContact.fullName || "-"}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">
                    Contact Number
                  </dt>
                  <dd>{previewData.emergencyContact.contactNumber || "-"}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">
                    Relationship
                  </dt>
                  <dd>{previewData.emergencyContact.relationship || "-"}</dd>
                </div>
              </dl>
            </div>
          )}
        </div>
      </PreviewDialog>
    </DashboardLayout>
  );
}
