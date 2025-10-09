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

export type FormValues = z.infer<typeof zodBillingSchema>;

interface PatientBillingFormProps {
  patient: Patient | null;
  billings: BillingRecord[];
  onSubmit: (data: FormValues) => void;
  isLoading: boolean;
}

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
      patientId: "",  // visible Patient ID
      hiddenPatientId: "", // internal ID for backend
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

  useEffect(() => {
    if (patient) {
      form.setValue("patientName", patient.fullName);
      form.setValue("contactNumber", patient.contactNumber);
      form.setValue("patientId", patient.PatientId);
      form.setValue("hiddenPatientId", patient._id); // internal ID for backend
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

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="bg-white p-6 rounded-lg shadow-md w-full mx-auto"
      >
        <h2 className="text-2xl font-bold mb-4 text-gray-700 text-center">
          Billing Form
        </h2>

        {/* Form fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Patient Name */}
          <FormField
            control={form.control}
            name="patientName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Patient Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter patient name" {...field} />
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
              <FormItem>
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
              <FormItem>
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
              <FormItem>
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
              <FormItem>
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
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Enter email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Treatments Section */}
        <div className="mt-6 mb-4">
          <h3 className="text-lg font-semibold mb-3">Treatments</h3>
          {treatments.map((field, index) => (
            <div
              key={index}
              className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-4 items-end"
            >
              <div className="md:col-span-5">
                <FormLabel>Treatment</FormLabel>
                <input
                  list={`treatment-options-${index}`}
                  value={field.treatment}
                  onChange={(e) => handleTreatmentChange(index, e.target.value)}
                  placeholder="Select a treatment"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <datalist id={`treatment-options-${index}`}>
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

              <div className="md:col-span-3">
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
                <FormLabel>Price (₹)</FormLabel>
                <Input
                  type="number"
                  placeholder="Price"
                  value={field.price}
                  onChange={(e) => handlePriceChange(index, e)}
                  min="0"
                />
              </div>

              <div className="md:col-span-1 flex justify-end">
                {index === treatments.length - 1 && (
                  <Button
                    type="button"
                    onClick={handleAddField}
                    variant="outline"
                    className="h-10 w-10 p-0"
                  >
                    +
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Payment Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="hidden">
            <FormField
              control={form.control}
              name="advance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Advance (₹)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter advance"
                      {...field}
                      min="0"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="discount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Discount (₹)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Enter discount"
                    {...field}
                    min="0"
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
                <FormLabel>Amount Received (₹)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Enter amount received"
                    {...field}
                    min="0"
                  />
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

          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-8">
          <Button
            type="submit"
            className="w-full py-6 text-lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <Loading />
                Generating bill...
              </span>
            ) : (
              "Generate Bill"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default PatientBillingForm;
