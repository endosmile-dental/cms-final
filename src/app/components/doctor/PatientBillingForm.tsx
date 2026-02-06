"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { zodBillingSchema } from "@/schemas/zodBillingSchema";
import { BillingRecord } from "@/app/redux/slices/billingSlice";
import Loading from "@/app/components/loading/Loading";
import { Patient } from "@/app/redux/slices/patientSlice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  FileText,
  Calendar,
  CreditCard,
  Stethoscope,
  Plus,
  Trash2,
  DollarSign,
  Percent,
  MapPin,
  Mail,
  Phone,
} from "lucide-react";

export type FormValues = z.infer<typeof zodBillingSchema>;

interface PatientBillingFormProps {
  patient: Patient | null;
  billings: BillingRecord[];
  onSubmit: (data: FormValues) => void;
  isLoading: boolean;
}

const treatmentOptions = [
  "Consultation",
  "Follow-up",
  "RVG/Digital X-ray",
  "Multi-Visit Root Canal Treatment",
  "Single-Visit Root Canal Treatment",
  "Complex Anatomy and Calcified Canals",
  "Re-Treatment / Re-RCT",
  "Veneers (Porcelain/Lithium Disilicate)",
  "Composite Restoration",
  "Denture (Indian)",
  "Denture (German)",
  "Zirconia (Basic)",
  "Zirconia (Vita)",
  "Zirconia (3M Lava)",
  "PFM (Normal)",
  "PFM (Warranty)",
  "Metal Crown (Normal)",
  "Metal Crown (DMLS)",
  "E-Max",
  "Neodent (Basic)",
  "Ostem",
  "Strauman (Brazilian)",
  "Novel Bio",
  "Metal Braces",
  "Ceramic Braces",
  "Aligners (Toothsi)",
  "Aligners (Invisalign)",
  "Normal Extraction",
  "Grossly Decayed Extraction",
  "Impaction",
  "GIC",
  "Composite",
  "Scaling with Polishing",
  "Scaling with Chair-side Teeth Whitening",
  "Air Prophylaxis",
  "Professional Teeth Whitening with Kit",
];

const PatientBillingForm: React.FC<PatientBillingFormProps> = ({
  patient,
  billings,
  onSubmit,
  isLoading,
}) => {
  const [treatments, setTreatments] = useState([
    { treatment: "", price: 0, quantity: 1 },
  ]);

  const form = useForm<FormValues>({
    resolver: zodResolver(zodBillingSchema),
    defaultValues: {
      patientName: "",
      contactNumber: "",
      patientId: "",
      hiddenPatientId: "",
      invoiceId: "",
      date: new Date().toISOString().split("T")[0],
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

  useEffect(() => {
    if (patient) {
      form.setValue("patientName", patient.fullName);
      form.setValue("contactNumber", patient.contactNumber);
      form.setValue("patientId", patient.PatientId);
      form.setValue("hiddenPatientId", patient._id);
      form.setValue("gender", patient.gender);
      form.setValue("email", patient.email);

      if (patient.address) {
        const { street, city, state, postalCode } = patient.address;
        const formattedAddress = `${street}, ${city}, ${state} - ${postalCode}`;
        form.setValue("address", formattedAddress);
      }

      const randomNumber = Math.floor(Math.random() * 900000) + 100000;
      const generatedInvoiceId = `${patient.PatientId}-${randomNumber}`;
      form.setValue("invoiceId", generatedInvoiceId);

      // Store latest billings in sessionStorage
      const filteredBillings = billings.filter(
        (bill) => bill.patientId === patient._id
      );

      const latestThreeBillings = filteredBillings
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 3);

      const sanitize = (data: BillingRecord): Partial<BillingRecord> =>
        Object.fromEntries(
          Object.entries(data).filter(
            ([, value]) => value !== null && value !== undefined
          )
        ) as Partial<BillingRecord>;

      const sanitized = latestThreeBillings.map(sanitize);
      sessionStorage.setItem("lastThreeBillings", JSON.stringify(sanitized));
    }
  }, [patient, billings, form]);

  const handleAddField = () => {
    const newTreatments = [
      ...treatments,
      { treatment: "", price: 0, quantity: 1 },
    ];
    setTreatments(newTreatments);
    form.setValue("treatments", newTreatments);
  };

  const handleRemoveField = (index: number) => {
    if (treatments.length > 1) {
      const newTreatments = treatments.filter((_, i) => i !== index);
      setTreatments(newTreatments);
      form.setValue("treatments", newTreatments);
    }
  };

  const handleTreatmentChange = (index: number, value: string) => {
    const newTreatments = [...treatments];
    newTreatments[index].treatment = value;
    setTreatments(newTreatments);
    form.setValue(`treatments.${index}.treatment`, value);
  };

  const handlePriceChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = Number(e.target.value);
    const newTreatments = [...treatments];
    newTreatments[index].price = value;
    setTreatments(newTreatments);
    form.setValue(`treatments.${index}.price`, value);
  };

  const handleQuantityChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = Number(e.target.value);
    const newTreatments = [...treatments];
    newTreatments[index].quantity = value;
    setTreatments(newTreatments);
    form.setValue(`treatments.${index}.quantity`, value);
  };

  // Calculate totals
  const subtotal = treatments.reduce(
    (sum, treatment) => sum + treatment.price * treatment.quantity,
    0
  );
  const discount = form.watch("discount") || 0;
  const total = subtotal - discount;

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Billing Form</h1>
          <p className="text-gray-600">
            Generate invoice and process patient billing
          </p>
        </div>
        {patient && (
          <Badge variant="secondary" className="text-sm">
            Patient: {patient.fullName}
          </Badge>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Patient & Invoice Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Patient Information Card */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-lg">
                  <User className="w-5 h-5 mr-2 text-blue-600" />
                  Patient Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="patientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        Patient Name
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Enter patient name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contactNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          <Phone className="w-4 h-4 mr-2" />
                          Contact
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="Contact number"
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
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2" />
                        Address
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Enter address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Invoice Information Card */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-lg">
                  <FileText className="w-5 h-5 mr-2 text-blue-600" />
                  Invoice Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="patientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Patient ID</FormLabel>
                        <FormControl>
                          <Input placeholder="Patient ID" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="invoiceId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invoice ID</FormLabel>
                        <FormControl>
                          <Input placeholder="Invoice ID" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          Date
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
                    name="modeOfPayment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Mode</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select mode" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Debit/Credit">
                              Debit/Credit
                            </SelectItem>
                            <SelectItem value="Cash">Cash</SelectItem>
                            <SelectItem value="UPI">UPI</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Treatments Section */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg">
                <Stethoscope className="w-5 h-5 mr-2 text-blue-600" />
                Treatments & Services
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="treatments" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="treatments">Treatments</TabsTrigger>
                  <TabsTrigger value="summary">Cost Summary</TabsTrigger>
                </TabsList>

                <TabsContent value="treatments" className="space-y-4 pt-4">
                  {treatments.map((field, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-4 p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="md:col-span-5">
                        <FormLabel>Treatment</FormLabel>
                        <Select
                          value={field.treatment}
                          onValueChange={(value) =>
                            handleTreatmentChange(index, value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select treatment" />
                          </SelectTrigger>
                          <SelectContent>
                            {treatmentOptions.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="md:col-span-2">
                        <FormLabel>Quantity</FormLabel>
                        <Input
                          type="number"
                          placeholder="Qty"
                          value={field.quantity}
                          onChange={(e) => handleQuantityChange(index, e)}
                          min="1"
                        />
                      </div>

                      <div className="md:col-span-3">
                        <FormLabel className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-1" />
                          Price (₹)
                        </FormLabel>
                        <Input
                          type="number"
                          placeholder="Price"
                          value={field.price}
                          onChange={(e) => handlePriceChange(index, e)}
                          min="0"
                        />
                      </div>

                      <div className="md:col-span-2 flex items-end space-x-2">
                        {treatments.length > 1 && (
                          <Button
                            type="button"
                            onClick={() => handleRemoveField(index)}
                            variant="outline"
                            size="icon"
                            className="h-10 text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                        {index === treatments.length - 1 && (
                          <Button
                            type="button"
                            onClick={handleAddField}
                            variant="outline"
                            size="icon"
                            className="h-10"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="summary" className="space-y-4 pt-4">
                  <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-semibold">
                        ₹{subtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 flex items-center">
                        <Percent className="w-4 h-4 mr-1" />
                        Discount:
                      </span>
                      <span className="font-semibold text-red-600">
                        -₹{discount.toFixed(2)}
                      </span>
                    </div>
                    <div className="border-t pt-2 flex justify-between items-center text-lg font-bold">
                      <span>Total Amount:</span>
                      <span className="text-blue-600">₹{total.toFixed(2)}</span>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Payment Section */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg">
                <CreditCard className="w-5 h-5 mr-2 text-blue-600" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="discount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        <Percent className="w-4 h-4 mr-2" />
                        Discount (₹)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amountReceived"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-2" />
                        Amount Received (₹)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter amount received"
                          min="0"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />


                <div className="flex items-end">
                  <div className="text-center p-4 bg-blue-50 rounded-lg w-full">
                    <div className="text-sm text-blue-600 font-medium">
                      Balance Due
                    </div>
                    <div className="text-2xl font-bold text-blue-700">
                      ₹
                      {(total - (form.watch("amountReceived") || 0)).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end pt-6">
            <Button
              type="submit"
              size="lg"
              className="min-w-[200px] bg-blue-600 hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <Loading />
                  Generating Bill...
                </span>
              ) : (
                <span className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Generate Bill
                </span>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default PatientBillingForm;
