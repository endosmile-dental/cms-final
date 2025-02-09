"use client";

import * as React from "react";
import { useState } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSession } from "next-auth/react";
import DashboardLayout from "@/app/dashboard/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Form components from shadcn UI
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

// Create a Zod schema for the "Add Doctor" form (including email and password)
const addDoctorSchema = z.object({
  fullName: z.string().min(1, { message: "Full name is required." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters." }),
  specialization: z.string().min(1, { message: "Specialization is required." }),
  specializationDetails: z.string().optional(),
  contactNumber: z
    .string()
    .min(10, { message: "Contact number must be at least 10 digits." }),
  experienceYears: z.coerce
    .number()
    .min(0, { message: "Experience must be a non-negative number." }),
  gender: z.enum(["Male", "Female", "Other"]).optional(),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postalCode: z.string().optional(),
    })
    .optional(),
  qualifications: z.string().optional(), // comma-separated list
});

// Infer form values type from schema
type AddDoctorFormValues = z.infer<typeof addDoctorSchema>;

export default function AddDoctorForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Retrieve session (and hence the client admin's user ID)
  const { data: session } = useSession();
  const userId = session?.user?.id; // Ensure your session object provides an "id" field

  // Initialize react-hook-form with the Zod resolver
  const form: UseFormReturn<AddDoctorFormValues> = useForm<AddDoctorFormValues>(
    {
      resolver: zodResolver(addDoctorSchema),
      defaultValues: {
        fullName: "",
        email: "",
        password: "",
        specialization: "",
        specializationDetails: "",
        contactNumber: "",
        experienceYears: 0,
        gender: undefined,
        address: {
          street: "",
          city: "",
          state: "",
          postalCode: "",
        },
        qualifications: "",
      },
    }
  );

  // Handle form submission: include clientAdminId and send to the API route
  const onSubmit = async (data: AddDoctorFormValues) => {
    setLoading(true);
    setError("");
    try {
      const payload = { ...data, userId };
      const response = await fetch("/api/clientAdmin/addDoctor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const resData = await response.json();
        throw new Error(resData.message || "Something went wrong.");
      }
      console.log("Doctor added successfully");
      form.reset();
    } catch (err: any) {
      console.error("Error adding doctor:", err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold">Add Doctor</h1>

        {/* Display error message if one exists */}
        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded">{error}</div>
        )}

        {/* Wrap the form in your custom Form component */}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 bg-gray-50 p-5 rounded-lg outline outline-1 outline-gray-400"
          >
            {/* Full Name Field */}
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter doctor's full name" {...field} />
                  </FormControl>
                  <FormMessage>
                    {form.formState.errors.fullName?.message}
                  </FormMessage>
                </FormItem>
              )}
            />

            {/* Email Field */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter email" {...field} />
                  </FormControl>
                  <FormMessage>
                    {form.formState.errors.email?.message}
                  </FormMessage>
                </FormItem>
              )}
            />

            {/* Password Field */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password *</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Enter password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage>
                    {form.formState.errors.password?.message}
                  </FormMessage>
                </FormItem>
              )}
            />

            {/* Specialization Field */}
            <FormField
              control={form.control}
              name="specialization"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Specialization *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter specialization" {...field} />
                  </FormControl>
                  <FormMessage>
                    {form.formState.errors.specialization?.message}
                  </FormMessage>
                </FormItem>
              )}
            />

            {/* Specialization Details Field (Optional) */}
            <FormField
              control={form.control}
              name="specializationDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Specialization Details (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter additional details"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage>
                    {form.formState.errors.specializationDetails?.message}
                  </FormMessage>
                </FormItem>
              )}
            />

            {/* Contact Number Field */}
            <FormField
              control={form.control}
              name="contactNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Number *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter contact number" {...field} />
                  </FormControl>
                  <FormMessage>
                    {form.formState.errors.contactNumber?.message}
                  </FormMessage>
                </FormItem>
              )}
            />

            {/* Experience Years Field */}
            <FormField
              control={form.control}
              name="experienceYears"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Experience (Years) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter experience in years"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage>
                    {form.formState.errors.experienceYears?.message}
                  </FormMessage>
                </FormItem>
              )}
            />

            {/* Gender Field (Optional) */}
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="mb-2">Gender (optional)</FormLabel>
                  <FormControl>
                    <select {...field} className="border rounded p-2">
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </FormControl>
                  <FormMessage>
                    {form.formState.errors.gender?.message}
                  </FormMessage>
                </FormItem>
              )}
            />

            {/* Address Fields (Optional) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="address.street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter street" {...field} />
                    </FormControl>
                    <FormMessage>
                      {form.formState.errors.address?.street?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address.city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter city" {...field} />
                    </FormControl>
                    <FormMessage>
                      {form.formState.errors.address?.city?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address.state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter state" {...field} />
                    </FormControl>
                    <FormMessage>
                      {form.formState.errors.address?.state?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address.postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postal Code (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter postal code" {...field} />
                    </FormControl>
                    <FormMessage>
                      {form.formState.errors.address?.postalCode?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />
            </div>

            {/* Qualifications Field (Optional) */}
            <FormField
              control={form.control}
              name="qualifications"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Qualifications (optional, comma separated)
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., MBBS, MD" {...field} />
                  </FormControl>
                  <FormMessage>
                    {form.formState.errors.qualifications?.message}
                  </FormMessage>
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Adding Doctor..." : "Add Doctor"}
            </Button>
          </form>
        </Form>
      </div>
    </DashboardLayout>
  );
}
