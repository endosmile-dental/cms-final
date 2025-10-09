// src/schemas/zodBillingSchema.ts
import { z } from "zod";

export const zodBillingSchema = z.object({
  patientName: z
    .string()
    .nonempty("Patient Name is required")
    .max(100, "Patient Name cannot exceed 100 characters"),
  contactNumber: z
    .string()
    .max(10, "Contact Number should not exceed 10 digits")
    .optional(),
  patientId: z.string().nonempty("Patient ID is required"),
  hiddenPatientId: z.string(), // backend internal use
  invoiceId: z.string().nonempty("Invoice ID is required"),
  date: z.string().nonempty("Date is required"),
  gender: z.string().nonempty("Gender is required"),
  email: z.string().optional(),
  treatments: z.array(
    z.object({
      treatment: z.string().nonempty("Treatment is required"),
      price: z.coerce.number({ invalid_type_error: "Price must be a number" }),
      quantity: z.coerce.number({
        invalid_type_error: "Quantity must be a number",
      }),
    })
  ),
  discount: z.coerce
    .number({ invalid_type_error: "Discount must be a number" })
    .optional()
    .default(0),
  advance: z.coerce
    .number({ invalid_type_error: "Advance must be a number" })
    .optional()
    .default(0),
  // Note: If your API expects the field name "amountRecieved", you can keep it as is, but ideally, use "amountReceived"
  amountReceived: z.coerce.number({
    invalid_type_error: "Amount Received must be a number",
  }),
  modeOfPayment: z.string().nonempty("Mode of Payment is required"),
  address: z.string().optional(),
});
