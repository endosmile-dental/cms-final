"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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
import { Patient } from "@/app/redux/slices/patientSlice";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  FileText,
  CreditCard,
  Stethoscope,
  Plus,
  Trash2,
  DollarSign,
  Percent,
  AlertCircle,
  X,
  Receipt,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { TREATMENTS_QUERY_KEY, useTreatmentsQuery } from "@/app/react-query/queries/useTreatmentsQuery";
import { formatDateForServer, getLocalDate } from "@/app/utils/dateUtils";

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

interface TreatmentField {
  treatment: string;
  price: number;
  quantity: number;
}

interface CreateBillingModalFormProps {
  patient: Patient;
  onClose: () => void;
  onSuccess: () => void;
}

export type FormValues = z.infer<typeof zodBillingSchema>;

const CreateBillingModalForm: React.FC<CreateBillingModalFormProps> = ({
  patient,
  onClose,
  onSuccess,
}) => {
  const router = useRouter();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const {
    data: treatmentsQueryData = [],
    isLoading: treatmentsLoading,
  } = useTreatmentsQuery(true);
  
  const activeTreatments = useMemo(() => 
    Array.isArray(treatmentsQueryData)
      ? treatmentsQueryData.filter((treatment) => treatment.isActive)
      : [],
    [treatmentsQueryData]
  );

  const [treatments, setTreatments] = useState<TreatmentField[]>([
    { treatment: "", price: 0, quantity: 1 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const formRef = React.useRef<HTMLFormElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(zodBillingSchema),
    defaultValues: {
      patientName: patient?.fullName || "",
      contactNumber: patient?.contactNumber || "",
      patientId: patient?.PatientId || "",
      hiddenPatientId: patient?._id || "",
      invoiceId: "",
      date: formatDateForServer(getLocalDate()),
      gender: patient?.gender || "",
      email: patient?.email || "",
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
      
      // Trim leading "0" from contact number if present
      let contactNumber = patient.contactNumber || "";
      if (contactNumber.startsWith("0")) {
        contactNumber = contactNumber.substring(1);
      }
      form.setValue("contactNumber", contactNumber);
      
      form.setValue("patientId", patient.PatientId);
      form.setValue("hiddenPatientId", patient._id);
      form.setValue("gender", patient.gender || "");
      form.setValue("email", patient.email || "");

      if (patient.address) {
        const { street, city, state, postalCode } = patient.address;
        const formattedAddress = `${street}, ${city}, ${state} - ${postalCode}`;
        form.setValue("address", formattedAddress);
      }

      const randomNumber = Math.floor(Math.random() * 900000) + 100000;
      const generatedInvoiceId = `${patient.PatientId}-${randomNumber}`;
      form.setValue("invoiceId", generatedInvoiceId);
    }
  }, [patient, form]);

  useEffect(() => {
    if (!Array.isArray(activeTreatments) || activeTreatments.length === 0) {
      return;
    }

    const cached = queryClient.getQueryData<ITreatment[]>(TREATMENTS_QUERY_KEY);

    if (!Array.isArray(cached) || cached.length === 0) {
      queryClient.setQueryData(TREATMENTS_QUERY_KEY, activeTreatments);
    }
  }, [activeTreatments, queryClient]);

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

  const handlePriceChange = (index: number, value: number) => {
    const newTreatments = [...treatments];
    newTreatments[index].price = value;
    setTreatments(newTreatments);
    form.setValue(`treatments.${index}.price`, value);
  };

  const handleQuantityChange = (index: number, value: number) => {
    const newTreatments = [...treatments];
    newTreatments[index].quantity = value;
    setTreatments(newTreatments);
    form.setValue(`treatments.${index}.quantity`, value);
  };

  const handleTreatmentChange = (index: number, value: string) => {
    const newTreatments = [...treatments];
    newTreatments[index].treatment = value;
    
    // Find the selected treatment and set its default price
    const selectedTreatment = activeTreatments.find(t => t.name === value);
    if (selectedTreatment && selectedTreatment.defaultPrice !== undefined) {
      newTreatments[index].price = selectedTreatment.defaultPrice;
    } else {
      newTreatments[index].price = 0;
    }
    
    setTreatments(newTreatments);
    form.setValue(`treatments.${index}.treatment`, value);
    form.setValue(`treatments.${index}.price`, newTreatments[index].price);
  };

  // Calculate totals
  const subtotal = treatments.reduce(
    (sum, t) => sum + t.price * t.quantity,
    0
  );
  const discount = form.watch("discount") || 0;
  const total = subtotal - discount;
  const amountReceived = form.watch("amountReceived") || 0;
  const balance = total - amountReceived;

  const handleSubmit = async (data: FormValues) => {
    if (treatments.some(t => !t.treatment)) {
      setErrorMessage("Please select treatments for all rows");
      return;
    }

    if (!data.modeOfPayment) {
      setErrorMessage("Please select a payment mode");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        ...data,
        treatments: treatments.map(t => ({
          treatment: t.treatment,
          price: t.price,
          quantity: t.quantity,
        })),
        totalAmount: total,
        balanceDue: balance,
      };

      const doctorId = session?.user?.id;
      
      const response = await fetch("/api/doctor/billing/add", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-doctor-id": doctorId || "",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await response.json();
        
        // Store billing data in sessionStorage for invoice page
        const invoiceData = {
          ...data,
          treatments: treatments.map(t => ({
            treatment: t.treatment,
            price: t.price,
            quantity: t.quantity,
          })),
          discount: discount,
          totalAmount: total,
          balanceDue: balance,
        };
        
        sessionStorage.setItem("formData", JSON.stringify(invoiceData));
        
        // Redirect to invoice page
        router.push("/dashboard/pages/Doctor/patientBilling/invoice");
        
        onSuccess();
        onClose();
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.message || "Failed to create billing");
      }
    } catch (error) {
      setErrorMessage("Error creating billing. Please try again.");
      console.error("Billing creation error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Disable background scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <div
      role="dialog"
      aria-labelledby="create-billing-title"
      className="fixed z-50 inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm transition-all duration-300"
    >
      <div className="relative bg-card border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-100">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-green-500/10 to-transparent border-b border-border p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-500/10 rounded-full">
                <Receipt className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <h2 id="create-billing-title" className="text-2xl font-bold text-foreground">
                  Create Billing Invoice
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Generate invoice and process payment
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-muted transition-colors duration-200"
              aria-label="Close modal"
            >
              <X className="h-6 w-6 text-foreground" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <Form {...form}>
            <form id="billing-form" ref={formRef} onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Patient Info Display */}
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3">
                <User className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800 dark:text-green-200">{patient.fullName}</p>
                  <p className="text-sm text-green-600 dark:text-green-300">ID: {patient.PatientId}</p>
                </div>
              </div>

              {/* Invoice & Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="invoiceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-2 text-sm font-medium text-foreground">
                        <FileText className="h-4 w-4" />
                        <span>Invoice ID</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} className="w-full" readOnly />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-2 text-sm font-medium text-foreground">
                        <span>Date</span>
                      </FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="w-full" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Payment Mode */}
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="modeOfPayment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-2 text-sm font-medium text-foreground">
                        <CreditCard className="h-4 w-4" />
                        <span>Payment Mode</span>
                      </FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select mode" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Cash">Cash</SelectItem>
                          <SelectItem value="Debit/Credit">Debit/Credit</SelectItem>
                          <SelectItem value="UPI">UPI</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Treatments Section */}
              <div className="border-t border-border pt-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Stethoscope className="h-5 w-5 text-green-500" />
                  <h3 className="text-lg font-semibold text-foreground">Treatments</h3>
                </div>
                <Card>
                  <CardContent className="p-4">
                    <Tabs defaultValue="treatments" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="treatments" className="text-xs">Treatments</TabsTrigger>
                        <TabsTrigger value="summary" className="text-xs">Summary</TabsTrigger>
                      </TabsList>

                      <TabsContent value="treatments" className="space-y-3 pt-3">
                        {treatments.map((field, index) => (
                          <div
                            key={index}
                            className="grid grid-cols-12 gap-2 p-2 border border-border rounded-md"
                          >
                            <div className="col-span-6">
                              <Select
                                value={field.treatment}
                                onValueChange={(value) => handleTreatmentChange(index, value)}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue placeholder={treatmentsLoading ? "Loading..." : "Treatment"} />
                                </SelectTrigger>
                                <SelectContent>
                                  {treatmentsLoading ? (
                                    <div className="p-2 text-xs text-muted-foreground">Loading...</div>
                                  ) : (
                                    activeTreatments.map((treatment) => (
                                      <SelectItem key={treatment._id} value={treatment.name}>
                                        {treatment.name}
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="col-span-2">
                              <Input
                                type="number"
                                placeholder="Qty"
                                value={field.quantity}
                                onChange={(e) => handleQuantityChange(index, Number(e.target.value))}
                                min="1"
                                className="h-8 text-xs"
                              />
                            </div>
                            <div className="col-span-3">
                              <Input
                                type="number"
                                placeholder="Price"
                                value={field.price}
                                onChange={(e) => handlePriceChange(index, Number(e.target.value))}
                                min="0"
                                className="h-8 text-xs"
                              />
                            </div>
                            <div className="col-span-1 flex items-center">
                              {treatments.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveField(index)}
                                  className="h-6 w-6 text-red-500 hover:bg-red-50"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAddField}
                          className="w-full h-7 text-xs"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add Treatment
                        </Button>
                      </TabsContent>

                      <TabsContent value="summary" className="space-y-2 pt-3">
                        <div className="space-y-2 p-3 bg-muted/50 rounded-lg text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Subtotal:</span>
                            <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Discount:</span>
                            <span className="font-medium text-red-600">-₹{discount.toFixed(2)}</span>
                          </div>
                          <div className="border-t pt-2 flex justify-between font-bold">
                            <span>Total:</span>
                            <span className="text-green-600">₹{total.toFixed(2)}</span>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>

              {/* Payment Details */}
              <div className="border-t border-border pt-6">
                <div className="flex items-center space-x-3 mb-4">
                  <CreditCard className="h-5 w-5 text-green-500" />
                  <h3 className="text-lg font-semibold text-foreground">Payment Details</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="discount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2 text-sm font-medium text-foreground">
                          <Percent className="h-4 w-4" />
                          <span>Discount (₹)</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            className="w-full"
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
                        <FormLabel className="flex items-center space-x-2 text-sm font-medium text-foreground">
                          <DollarSign className="h-4 w-4" />
                          <span>Amount Received (₹)</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            {...field}
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Balance Display */}
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-border">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Balance Due:</span>
                  <span className={`text-lg font-bold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ₹{balance.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {errorMessage}
                </div>
              )}
            </form>
          </Form>
        </div>

        {/* Modal Footer */}
        <div className="bg-muted/50 border-t border-border p-6">
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-3 text-foreground bg-muted rounded-lg hover:bg-muted/80 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={form.handleSubmit(handleSubmit)}
              disabled={isSubmitting}
              className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>Generate Bill</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateBillingModalForm;