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
  Edit,
  PlusCircle,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { TREATMENTS_QUERY_KEY, useTreatmentsQuery } from "@/app/react-query/queries/useTreatmentsQuery";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import TreatmentManagementForm from "./TreatmentManagementForm";

// Define treatment interface for local use
interface ITreatment {
  _id: string;
  name: string;
  category: string;
  description?: string;
  defaultPrice?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type FormValues = z.infer<typeof zodBillingSchema>;

interface PatientBillingFormProps {
  patient: Patient | null;
  billings: BillingRecord[];
  onSubmit: (data: FormValues) => void;
  isLoading: boolean;
  initialTreatments?: ITreatment[];
}


const PatientBillingForm: React.FC<PatientBillingFormProps> = ({
  patient,
  billings,
  onSubmit,
  isLoading,
  initialTreatments = [],
}) => {
  const queryClient = useQueryClient();
  const {
    data: treatmentsQueryData = [],
  } = useTreatmentsQuery(true);
  const activeTreatments = Array.isArray(treatmentsQueryData)
    ? treatmentsQueryData.filter((treatment) => treatment.isActive)
    : [];
  const [treatments, setTreatments] = useState([
    { treatment: "", price: 0, quantity: 1 },
  ]);
  const [isTreatmentModalOpen, setIsTreatmentModalOpen] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState<ITreatment | null>(null);
  const [isInEditMode, setIsInEditMode] = useState(false);

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
      // Ensure gender is properly set, default to empty string if undefined
      const genderValue = patient.gender || "";
      form.setValue("gender", genderValue);
      form.setValue("email", patient.email || "");

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

  useEffect(() => {
    if (!Array.isArray(initialTreatments) || initialTreatments.length === 0) {
      return;
    }

    const cached = queryClient.getQueryData<ITreatment[]>(TREATMENTS_QUERY_KEY);

    if (!Array.isArray(cached) || cached.length === 0) {
      queryClient.setQueryData(TREATMENTS_QUERY_KEY, initialTreatments);
    }
  }, [initialTreatments, queryClient]);

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
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Billing Form</h1>
          <p className="text-muted-foreground">
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
                  <User className="w-5 h-5 mr-2 text-foreground" />
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
                        <User className="w-4 h-4 mr-2 text-foreground" />
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
                          <Phone className="w-4 h-4 mr-2 text-foreground" />
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
                          value={field.value || ""}
                          onValueChange={(value) => {
                            // Only update if value is not empty or if it's a valid selection
                            if (value !== "" || field.value === "") {
                              field.onChange(value);
                            }
                          }}
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
                        <Mail className="w-4 h-4 mr-2 text-foreground" />
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
                        <MapPin className="w-4 h-4 mr-2 text-foreground" />
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
                  <FileText className="w-5 h-5 mr-2 text-foreground" />
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
                          <Calendar className="w-4 h-4 mr-2 text-foreground" />
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
                <Stethoscope className="w-5 h-5 mr-2 text-foreground" />
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
                      className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-4 p-4 border border-border rounded-lg"
                    >
                      <div className="md:col-span-5">
                        <div className="flex items-center justify-between mb-2">
                          <FormLabel>Treatment</FormLabel>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingTreatment(null);
                                setIsInEditMode(false);
                                setIsTreatmentModalOpen(true);
                              }}
                              className="text-xs"
                            >
                              <PlusCircle className="w-3 h-3 mr-1 text-foreground" />
                              Add
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                console.log("DEBUG: Edit treatments button clicked");
                                setEditingTreatment(null);
                                setIsInEditMode(true);
                                setIsTreatmentModalOpen(true);
                              }}
                              className="text-xs"
                            >
                              <Edit className="w-3 h-3 mr-1 text-foreground" />
                              Edit
                            </Button>
                          </div>
                        </div>
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
                            {(() => {
                              console.log("DEBUG: Rendering SelectContent, activeTreatments:", activeTreatments);
                              return null;
                            })()}
                            {Array.isArray(activeTreatments) && activeTreatments.length > 0 ? (
                              activeTreatments.map((treatment) => (
                                <SelectItem
                                  key={treatment._id}
                                  value={treatment.name}
                                >
                                  {treatment.name}
                                </SelectItem>
                              ))
                            ) : (
                              <div className="p-2 text-sm text-muted-foreground">
                                No treatments available
                              </div>
                            )}
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
                            <Trash2 className="w-4 h-4 text-foreground" />
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
                            <Plus className="w-4 h-4 text-foreground" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="summary" className="space-y-4 pt-4">
                  <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span className="font-semibold">
                        ₹{subtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground flex items-center">
                        <Percent className="w-4 h-4 mr-1 text-foreground" />
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
                <CreditCard className="w-5 h-5 mr-2 text-foreground" />
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
                        <Percent className="w-4 h-4 mr-2 text-foreground" />
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
                        <DollarSign className="w-4 h-4 mr-2 text-foreground" />
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
                  <div className="text-center p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg w-full border border-border">
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
                  <FileText className="w-4 h-4 mr-2 text-foreground" />
                  Generate Bill
                </span>
              )}
            </Button>
          </div>

          {/* Treatment Management Modal */}
          <Dialog open={isTreatmentModalOpen} onOpenChange={setIsTreatmentModalOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingTreatment ? "Edit Treatment" : "Manage Treatments"}
                </DialogTitle>
                <DialogDescription>
                  {editingTreatment
                    ? "Update the details of the selected treatment"
                    : "Select a treatment to edit or add a new treatment"
                  }
                </DialogDescription>
              </DialogHeader>
              <TreatmentManagementForm
                treatment={editingTreatment}
                isEditing={isInEditMode}
                onSuccess={() => {
                  setIsTreatmentModalOpen(false);
                  setEditingTreatment(null);
                  setIsInEditMode(false);
                  queryClient.invalidateQueries({ queryKey: TREATMENTS_QUERY_KEY });
                }}
                onCancel={() => {
                  setIsTreatmentModalOpen(false);
                  setEditingTreatment(null);
                  setIsInEditMode(false);
                }}
              />
            </DialogContent>
          </Dialog>
        </form>
      </Form>
    </div>
  );
};

export default PatientBillingForm;
