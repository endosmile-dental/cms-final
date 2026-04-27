import { z } from "zod";

export const sendSmsSchema = z.object({
  phoneNumber: z.string().min(1, "phoneNumber is required"),
  message: z.string().min(1, "message is required"),
});

export const aiQuerySchema = z.object({
  message: z.string().min(1, "message is required"),
});

export const updatePasswordSchema = z.object({
  patientId: z.string().min(1, "patientId is required"),
  newPassword: z.string().min(6, "newPassword must be at least 6 characters"),
});

export const addDoctorSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  fullName: z.string().min(1, "fullName is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "password must be at least 6 characters"),
  specialization: z.string().min(1, "specialization is required"),
  specializationDetails: z.string().optional(),
  contactNumber: z.string().min(1, "contactNumber is required"),
  experienceYears: z.coerce.number().nonnegative(),
  gender: z.enum(["Male", "Female", "Other"]),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postalCode: z.string().optional(),
    })
    .optional(),
  qualifications: z.string().optional(),
});

export const addClinicSchema = z.object({
  name: z.string().min(1, "name is required"),
  registrationNumber: z.string().min(1, "registrationNumber is required"),
  email: z.string().email("Invalid email"),
  contactNumber: z.string().min(1, "contactNumber is required"),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postalCode: z.string().optional(),
    })
    .optional(),
  status: z.string().optional(),
  userId: z.string().min(1, "userId is required"),
});

export const clientAdminSignupSchema = z.object({
  fullName: z.string().min(1, "fullName is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "password must be at least 6 characters"),
  contactNumber: z.string().min(1, "contactNumber is required"),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postalCode: z.string().optional(),
    })
    .optional(),
});

export const superAdminSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "password must be at least 6 characters"),
  role: z.string().min(1, "role is required"),
  fullName: z.string().optional(),
  contactNumber: z.string().optional(),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postalCode: z.string().optional(),
    })
    .optional(),
});

export const addAppointmentSchema = z.object({
  doctor: z.string().min(1, "doctor is required"),
  patient: z.string().min(1, "patient is required"),
  appointmentDate: z.string().min(1, "appointmentDate is required"),
  consultationType: z.enum(["New", "Follow-up"]),
  createdBy: z.string().min(1, "createdBy is required"),
  notes: z.string().optional(),
  timeSlot: z.string().min(1, "timeSlot is required"),
  treatments: z.array(z.string()).optional(),
  teeth: z.array(z.string()).optional(),
});

export const updateAppointmentSchema = z.object({
  _id: z.string().min(1, "appointment _id is required"),
  doctor: z.string().optional(),
  appointmentDate: z.string().min(1, "appointmentDate is required"),
  status: z.enum(["Scheduled", "Completed", "Cancelled"]),
  consultationType: z.enum(["New", "Follow-up"]),
  timeSlot: z.string().optional(),
  treatments: z.array(z.string()).optional(),
  teeth: z.array(z.string()).optional(),
  notes: z.string().optional(),
  paymentStatus: z.enum(["Pending", "Paid", "Partial", "Refunded"]).optional(),
  amount: z.number().optional(),
});

export const updateBillingSchema = z.object({
  _id: z.string().min(1, "billing _id is required"),
  invoiceId: z.string().optional(),
  patientId: z.string().optional(),
  doctorId: z.string().optional(),
  clinicId: z.string().optional(),
  date: z.string().optional(),
  treatments: z.array(z.object({
    treatment: z.string(),
    price: z.number(),
    quantity: z.number()
  })).optional(),
  amountBeforeDiscount: z.number().optional(),
  discount: z.number().optional(),
  totalAmount: z.number().optional(),
  advance: z.number().optional(),
  amountReceived: z.number().optional(),
  amountDue: z.number().optional(),
  modeOfPayment: z.string().optional(),
  address: z.string().optional(),
  status: z.enum(["Pending", "Paid", "Partial", "Refunded"]).optional(),
});

export const deleteAttachmentSchema = z.object({
  labWorkId: z.string().min(1, "labWorkId is required"),
  publicId: z.string().min(1, "publicId is required"),
  format: z.string().min(1, "format is required"),
});
