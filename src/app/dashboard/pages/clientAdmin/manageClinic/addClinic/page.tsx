"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useSession } from "next-auth/react";

// Import shadcn UI form components (adjust import paths if needed)
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/app/dashboard/layout/DashboardLayout";

// Define a Zod schema based on your clinic schema
const addClinicSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Clinic name must be at least 2 characters." }),
  registrationNumber: z
    .string()
    .min(1, { message: "Registration Number is required." }),
  email: z.string().email({ message: "Invalid email address." }),
  contactNumber: z
    .string()
    .min(10, { message: "Contact number must be at least 10 digits." }),
  address: z.object({
    street: z.string().min(2, { message: "Street is required." }),
    city: z.string().min(2, { message: "City is required." }),
    state: z.string().min(2, { message: "State is required." }),
    postalCode: z.string().min(2, { message: "Postal Code is required." }),
  }),
  status: z
    .enum(["active", "inactive", "pending", "suspended"])
    .default("pending"),
});

// Infer the form's values type from the schema
type AddClinicFormValues = z.infer<typeof addClinicSchema>;

export default function AddClinicForm() {

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Initialize react-hook-form with the Zod resolver
  const form = useForm<AddClinicFormValues>({
    resolver: zodResolver(addClinicSchema),
    defaultValues: {
      name: "",
      registrationNumber: "",
      email: "",
      contactNumber: "",
      address: {
        street: "",
        city: "",
        state: "",
        postalCode: "",
      },
      status: "pending",
    },
  });

  const { data: session } = useSession();
  const userId = session?.user?.id;

  // Handle form submission with proper loading and error handling
  const onSubmit = async (data: AddClinicFormValues) => {
    setLoading(true);
    setError("");

    // Merge the form data with the clientAdmin ID.
    const payload = { ...data, userId };

    try {
      const response = await fetch("/api/clientAdmin/addClinic", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Something went wrong.");
      }

      // Handle success (e.g., show a success message or redirect)
      console.log("Clinic registered successfully");
      form.reset();
    } catch (err: any) {
      console.error("Error registering clinic:", err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <Form {...form}>
        <div className="p-6 space-y-6">
          <h1 className="text-3xl font-bold">Clinic Registration Form</h1>

          {/* Display error message if exists */}
          {error && (
            <div className="p-4 bg-red-100 text-red-700 rounded">{error}</div>
          )}

          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="p-5 space-y-6 bg-gray-50 outline outline-1 outline-gray-400 rounded-lg"
          >
            {/* Clinic Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Clinic Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter clinic name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Registration Number */}
            <FormField
              control={form.control}
              name="registrationNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Registration Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter registration number" {...field} />
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
                    <Input placeholder="Enter email" {...field} />
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

            {/* Address Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="address.street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter street" {...field} />
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
                      <Input placeholder="Enter city" {...field} />
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
                      <Input placeholder="Enter state" {...field} />
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
                      <Input placeholder="Enter postal code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Adding..." : "Add Clinic"}
            </Button>
          </form>
        </div>
      </Form>
    </DashboardLayout>
  );
}
