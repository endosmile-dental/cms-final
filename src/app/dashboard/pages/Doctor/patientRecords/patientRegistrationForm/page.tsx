"use client";

import React, { ComponentType } from "react";
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

// New UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  User,
  Phone,
  Calendar,
  Mail,
  Lock,
  MapPin,
  Stethoscope,
  Pill,
  Contact,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

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
  age: z.string().min(1, { message: "Age is required" }),
  dateOfBirth: z.string(),
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

const FormStep = ({
  currentStep,
  step,
  title,
  icon: Icon,
}: {
  currentStep: number;
  step: number;
  title: string;
  icon: ComponentType<{ className?: string }>;
}) => (
  <div className="flex items-center space-x-3">
    <div
      className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${currentStep >= step
        ? "bg-blue-600 border-blue-600 text-white"
        : "border-gray-300 text-gray-500"
        }`}
    >
      {currentStep > step ? (
        <CheckCircle2 className="w-5 h-5" />
      ) : (
        <Icon className="w-4 h-4" />
      )}
    </div>
    <span
      className={`font-medium ${currentStep >= step ? "text-blue-600" : "text-gray-500"
        }`}
    >
      {title}
    </span>
  </div>
);


export default function PatientRegistrationForm() {
  const { data: session } = useSession();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [currentStep, setCurrentStep] = React.useState(1);
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
      age: "",
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

  const progressValue = React.useMemo(() => {
    switch (currentStep) {
      case 1:
        return 10;
      case 2:
        return 30;
      case 3:
        return 50;
      case 4:
        return 70;
      case 5:
        return 100;
      default:
        return 0;
    }
  }, [currentStep]);

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
      <div className="max-w-6xl mx-auto space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                router.push("/dashboard/pages/Doctor/patientRecords")
              }
              className="rounded-full"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Patient Registration
              </h1>
              <p className="text-gray-600">
                Register a new patient in the system
              </p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <FormStep
                currentStep={currentStep}
                step={1}
                title="Personal Info"
                icon={User}
              />
              <div className="flex-1 h-1 bg-gray-200 mx-4">
                <div
                  className="h-1 bg-blue-600 transition-all duration-300"
                  style={{ width: `${Math.max(0, (currentStep - 1) * 25)}%` }}
                />
              </div>
              <FormStep
                currentStep={currentStep}
                step={2}
                title="Address"
                icon={MapPin}
              />
              <div className="flex-1 h-1 bg-gray-200 mx-4">
                <div
                  className="h-1 bg-blue-600 transition-all duration-300"
                  style={{ width: `${Math.max(0, (currentStep - 2) * 25)}%` }}
                />
              </div>
              <FormStep
                currentStep={currentStep}
                step={3}
                title="Medical Info"
                icon={Stethoscope}
              />
              <div className="flex-1 h-1 bg-gray-200 mx-4">
                <div
                  className="h-1 bg-blue-600 transition-all duration-300"
                  style={{ width: `${Math.max(0, (currentStep - 3) * 25)}%` }}
                />
              </div>
              <FormStep
                currentStep={currentStep}
                step={4}
                title="Emergency Contact"
                icon={Contact}
              />
              <div className="flex-1 h-1 bg-gray-200 mx-4">
                <div
                  className="h-1 bg-blue-600 transition-all duration-300"
                  style={{ width: `${Math.max(0, (currentStep - 4) * 25)}%` }}
                />
              </div>
              <FormStep
                currentStep={currentStep}
                step={5}
                title="Review"
                icon={CheckCircle2}
              />
            </div>
            <Progress value={progressValue} className="w-full" />
          </CardContent>
        </Card>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Step 1: Personal Information */}
            <Card
              onFocusCapture={() => setCurrentStep(1)}
              className={`transition-all duration-300 ${currentStep >= 1 ? "opacity-100" : "opacity-60"
                }`}
            >
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-lg">
                  <User className="w-5 h-5 mr-2 text-blue-600" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          <User className="w-4 h-4 mr-2" />
                          Full Name
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Enter full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contactNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          <Phone className="w-4 h-4 mr-2" />
                          Contact Number
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter contact number"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
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

                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          <User className="w-4 h-4 mr-2" />
                          Age
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter age"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          Date of Birth
                        </FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          <Mail className="w-4 h-4 mr-2" />
                          Email
                        </FormLabel>
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

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          <Lock className="w-4 h-4 mr-2" />
                          Password
                        </FormLabel>
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
                </div>
              </CardContent>
            </Card>

            {/* Step 2: Address Information */}
            <Card
              onFocusCapture={() => setCurrentStep(2)}
              className={`transition-all duration-300 ${currentStep >= 2 ? "opacity-100" : "opacity-60"
                }`}
            >
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-lg">
                  <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                  Address Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="address.street"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Street Address</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="House no./Apartment/Street"
                            {...field}
                          />
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
              </CardContent>
            </Card>

            {/* Step 3: Medical Information */}
            <Card
              onFocusCapture={() => setCurrentStep(3)}
              className={`transition-all duration-300 ${currentStep >= 3 ? "opacity-100" : "opacity-60"
                }`}
            >
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-lg">
                  <Stethoscope className="w-5 h-5 mr-2 text-blue-600" />
                  Medical Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <Tabs defaultValue="medicalHistory" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger
                      value="medicalHistory"
                      className="flex items-center"
                    >
                      <Stethoscope className="w-4 h-4 mr-2" />
                      Medical History
                    </TabsTrigger>
                    <TabsTrigger
                      value="medications"
                      className="flex items-center"
                    >
                      <Pill className="w-4 h-4 mr-2" />
                      Current Medications
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent
                    value="medicalHistory"
                    className="space-y-4 pt-4"
                  >
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
                      {(form.watch("medicalHistory") || [])?.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {form.watch("medicalHistory")?.map((item) => (
                            <Badge
                              key={item}
                              variant="secondary"
                              className="bg-blue-100 text-blue-800"
                            >
                              {item}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="medications" className="space-y-4 pt-4">
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
                      {(form.watch("currentMedications") || [])?.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {form.watch("currentMedications")?.map((item) => (
                            <Badge
                              key={item}
                              variant="secondary"
                              className="bg-green-100 text-green-800"
                            >
                              {item}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Step 4: Emergency Contact */}
            <Card
              onFocusCapture={() => setCurrentStep(4)}
              className={`transition-all duration-300 ${currentStep >= 4 ? "opacity-100" : "opacity-60"
                }`}
            >
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-lg">
                  <Contact className="w-5 h-5 mr-2 text-blue-600" />
                  Emergency Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <FormItem className="md:col-span-2">
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
              </CardContent>
            </Card>

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              <div className="space-x-3">
                <Button
                  variant="outline"
                  onClick={() =>
                    router.push("/dashboard/pages/Doctor/patientRecords")
                  }
                >
                  Cancel
                </Button>
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setCurrentStep((prev) => Math.max(1, prev - 1))
                    }
                  >
                    Previous
                  </Button>
                )}
              </div>

              <div className="space-x-3">
                {currentStep < 5 && (
                  <Button
                    type="button"
                    onClick={() =>
                      setCurrentStep((prev) => Math.min(5, prev + 1))
                    }
                  >
                    Continue
                  </Button>
                )}
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => setCurrentStep(5)}
                >
                  Review & Register Patient
                </Button>
              </div>
            </div>
          </form>
        </Form>

        {/* Global Error Message */}
        {formError && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center text-red-700">
                <AlertCircle className="w-5 h-5 mr-2" />
                <span>{formError}</span>
              </div>
            </CardContent>
          </Card>
        )}

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
          description="Please review all patient information before confirming registration"
          confirmButtonText="Confirm Registration"
        >
          <div className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                Personal Information
              </h3>
              <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
                <div>
                  <dt className="text-sm text-muted-foreground">Full Name</dt>
                  <dd className="font-medium">{previewData?.fullName}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">
                    Contact Number
                  </dt>
                  <dd>{previewData?.contactNumber}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Gender</dt>
                  <dd>
                    <Badge variant="secondary">{previewData?.gender}</Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Age</dt>
                  <dd>{previewData?.age}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">
                    Date of Birth
                  </dt>
                  <dd>{previewData?.dateOfBirth}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Email</dt>
                  <dd>{previewData?.email}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Password</dt>
                  <dd className="flex items-center">
                    <Lock className="w-4 h-4 mr-1" />
                    ••••••••
                  </dd>
                </div>
              </div>
            </div>

            {/* Address */}
            {previewData?.address && (
              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                  Address Information
                </h3>
                <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="md:col-span-2">
                    <dt className="text-sm text-muted-foreground">
                      Street Address
                    </dt>
                    <dd>{previewData.address.street || "Not provided"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">City</dt>
                    <dd>{previewData.address.city || "Not provided"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">State</dt>
                    <dd>{previewData.address.state || "Not provided"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">
                      Postal Code
                    </dt>
                    <dd>{previewData.address.postalCode || "Not provided"}</dd>
                  </div>
                </div>
              </div>
            )}

            {/* Medical History */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center">
                <Stethoscope className="w-5 h-5 mr-2 text-blue-600" />
                Medical History
              </h3>
              <div className="flex flex-wrap gap-2 p-3 bg-blue-50 rounded-lg">
                {previewData?.medicalHistory?.map((item) => (
                  <Badge
                    key={item}
                    variant="secondary"
                    className="bg-blue-100 text-blue-800 px-3 py-1"
                  >
                    {item}
                  </Badge>
                ))}
                {!previewData?.medicalHistory?.length && (
                  <span className="text-muted-foreground">
                    No medical history recorded
                  </span>
                )}
              </div>
            </div>

            {/* Current Medications */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center">
                <Pill className="w-5 h-5 mr-2 text-blue-600" />
                Current Medications
              </h3>
              <div className="flex flex-wrap gap-2 p-3 bg-green-50 rounded-lg">
                {previewData?.currentMedications?.map((item) => (
                  <Badge
                    key={item}
                    variant="secondary"
                    className="bg-green-100 text-green-800 px-3 py-1"
                  >
                    {item}
                  </Badge>
                ))}
                {!previewData?.currentMedications?.length && (
                  <span className="text-muted-foreground">
                    No current medications
                  </span>
                )}
              </div>
            </div>

            {/* Emergency Contact */}
            {previewData?.emergencyContact && (
              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center">
                  <Contact className="w-5 h-5 mr-2 text-blue-600" />
                  Emergency Contact
                </h3>
                <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
                  <div>
                    <dt className="text-sm text-muted-foreground">Name</dt>
                    <dd>
                      {previewData.emergencyContact.fullName || "Not provided"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">
                      Contact Number
                    </dt>
                    <dd>
                      {previewData.emergencyContact.contactNumber ||
                        "Not provided"}
                    </dd>
                  </div>
                  <div className="md:col-span-2">
                    <dt className="text-sm text-muted-foreground">
                      Relationship
                    </dt>
                    <dd>
                      {previewData.emergencyContact.relationship ||
                        "Not provided"}
                    </dd>
                  </div>
                </div>
              </div>
            )}
          </div>
        </PreviewDialog>
      </div>
    </DashboardLayout>
  );
}
