import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { RootState } from "../store/store";
import type { ApiResponse } from "@/app/types/api";
import { unwrapApiResponse } from "@/app/utils/apiClient";

export type ConsultationType = "New" | "Follow-up";
export type AppointmentStatus = "Scheduled" | "Completed" | "Cancelled";
export type PaymentStatus = "Pending" | "Paid" | "Partial" | "Refunded";

export interface Appointment {
  _id: string;
  doctor: string | undefined;
  patient: string | undefined;
  clinic?: string;
  appointmentDate: string;
  status: AppointmentStatus;
  consultationType: ConsultationType;
  timeSlot: string;
  treatments?: string[];
  teeth?: string[];
  notes?: string;
  createdBy: string | undefined;
  rescheduledAt?: string;
  cancelledAt?: string;
  paymentStatus?: "Pending" | "Paid" | "Refunded";
  amount?: number;
  createdAt: string;
  updatedAt: string;
}

interface AppointmentState {
  appointments: Appointment[];
  bookedSlots: string[]; // holds booked time slots strings for quick reference
  loading: boolean;
  error: string | null;
}

const normalizeDate = (value: unknown): string | undefined => {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object" && "toISOString" in value) {
    try {
      return (value as Date).toISOString();
    } catch {
      return undefined;
    }
  }
  return undefined;
};

const normalizeAppointment = (appointment: Appointment): Appointment => ({
  ...appointment,
  appointmentDate:
    normalizeDate(appointment.appointmentDate) ?? "",
  createdAt: normalizeDate(appointment.createdAt) ?? "",
  updatedAt: normalizeDate(appointment.updatedAt) ?? "",
  rescheduledAt:
    normalizeDate(appointment.rescheduledAt) ?? undefined,
  cancelledAt:
    normalizeDate(appointment.cancelledAt) ?? undefined,
});

const normalizeAppointments = (appointments: Appointment[]) =>
  appointments.map(normalizeAppointment);

const initialState: AppointmentState = {
  appointments: [],
  bookedSlots: [],
  loading: false,
  error: null,
};

// Async thunk for fetching appointments based on userId and role
export const fetchAppointments = createAsyncThunk(
  "appointment/fetchAppointments",
  async (
    { userId, role }: { userId: string; role: "Doctor" | "Patient" },
    { rejectWithValue }
  ) => {
    let url = "";
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (role === "Doctor") {
      url = "/api/doctor/appointments/fetchAppointments";
      headers["x-doctor-user-id"] = userId;
    } else if (role === "Patient") {
      url = "/api/patient/appointments/fetchAppointments";
      headers["x-patient-user-id"] = userId;
    } else {
      return rejectWithValue("Invalid role");
    }

    try {
      const response = await fetch(url, { method: "GET", headers });

      const payload = (await response.json()) as ApiResponse<{
        appointments: Appointment[];
      }>;
      const data = unwrapApiResponse(payload);
      return Array.isArray(data.appointments) ? data.appointments : [];
    } catch {
      return rejectWithValue("An error occurred while fetching appointments");
    }
  }
);

// Async thunk to create an appointment
export const createAppointment = createAsyncThunk(
  "appointment/createAppointment",
  async (
    appointmentData: Omit<Appointment, "_id" | "createdAt" | "updatedAt">
  ) => {
    const response = await fetch("/api/doctor/appointments/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(appointmentData),
    });
    const payload = (await response.json()) as ApiResponse<{
      appointment: Appointment;
    }>;
    const data = unwrapApiResponse(payload);
    return data.appointment as Appointment;
  }
);

// Async thunk to update (edit) an appointment on the server
export const editAppointment = createAsyncThunk(
  "appointment/editAppointment",
  async (appointment: Appointment) => {
    const response = await fetch(`/api/doctor/appointments/update`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(appointment),
    });
    const payload = (await response.json()) as ApiResponse<{
      appointment: Appointment;
    }>;
    const data = unwrapApiResponse(payload);
    return data.appointment as Appointment;
  }
);

// Async thunk to delete an appointment on the server
export const removeAppointment = createAsyncThunk(
  "appointment/removeAppointment",
  async (appointmentId: string) => {
    const response = await fetch(
      `/api/doctor/appointments/delete/${appointmentId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const payload = (await response.json()) as ApiResponse<{
      id: string;
    }>;
    const data = unwrapApiResponse(payload);
    return data.id ?? appointmentId;
  }
);

// Modify fetchAvailability thunk to return only booked time slots (strings)
export const fetchAvailability = createAsyncThunk<
  string[], // return type: array of booked time slot strings
  { doctorId: string; date: string },
  { rejectValue: string }
>(
  "appointments/fetchAvailability",
  async ({ doctorId, date }, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `/api/patient/appointments/availability?doctorId=${doctorId}&date=${date}`
      );

      const payload = (await response.json()) as ApiResponse<{
        bookedSlots: string[];
      }>;
      const data = unwrapApiResponse(payload);
      return data.bookedSlots;
    } catch (error) {
      console.error("Error checking availability:", error);
      return rejectWithValue("Error checking availability");
    }
  }
);

const appointmentSlice = createSlice({
  name: "appointment",
  initialState,
  reducers: {
    // Hydration action for SSR data
    hydrateAppointments(state, action: PayloadAction<Appointment[]>) {
      state.appointments = normalizeAppointments(action.payload);
      state.loading = false;
      state.error = null;
    },
    // Synchronous action for adding an appointment.
    addAppointment(state, action: PayloadAction<Appointment>) {
      state.appointments.push(normalizeAppointment(action.payload));
    },
    // Synchronous update action now accepts an Appointment directly.
    updateAppointment(state, action: PayloadAction<Appointment>) {
      const index = state.appointments.findIndex(
        (appt) => appt._id === action.payload._id
      );
      if (index !== -1) {
        state.appointments[index] = normalizeAppointment(action.payload);
      }
    },
    // Synchronous delete action.
    deleteAppointment(state, action: PayloadAction<string>) {
      state.appointments = state.appointments.filter(
        (appointment) => appointment._id !== action.payload
      );
    },
  },
  extraReducers: (builder) => {
    // Fetch appointments cases.
    builder
      .addCase(fetchAppointments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchAppointments.fulfilled,
        (state, action: PayloadAction<Appointment[]>) => {
          state.loading = false;
          state.appointments = normalizeAppointments(action.payload);
        }
      )
      .addCase(fetchAppointments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch appointments";
      })
      // Create appointment cases.
      .addCase(
        createAppointment.fulfilled,
        (state, action: PayloadAction<Appointment>) => {
          state.appointments.push(normalizeAppointment(action.payload));
        }
      )
      .addCase(createAppointment.rejected, (state, action) => {
        state.error =
          (action.payload as string) || "Failed to create appointment";
      })
      // Edit appointment cases.
      .addCase(
        editAppointment.fulfilled,
        (state, action: PayloadAction<Appointment>) => {
          const index = state.appointments.findIndex(
            (appointment) => appointment._id === action.payload._id
          );
          if (index !== -1) {
            state.appointments[index] = normalizeAppointment(action.payload);
          }
        }
      )
      .addCase(editAppointment.rejected, (state, action) => {
        state.error =
          (action.payload as string) || "Failed to update appointment";
      })
      // Delete appointment cases.
      .addCase(
        removeAppointment.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.appointments = state.appointments.filter(
            (appointment) => appointment._id !== action.payload
          );
        }
      )
      .addCase(removeAppointment.rejected, (state, action) => {
        state.error =
          (action.payload as string) || "Failed to delete appointment";
      })
      // Availability fetch cases
      .addCase(fetchAvailability.pending, (state) => {
        state.bookedSlots = []; // Clear old slots when fetching new date
      })
      .addCase(
        fetchAvailability.fulfilled,
        (state, action: PayloadAction<string[]>) => {
          state.bookedSlots = action.payload; // Store only time slots here
        }
      )
      .addCase(fetchAvailability.rejected, (state) => {
        state.bookedSlots = []; // Clear slots on error
      });
  },
});

export const { addAppointment, updateAppointment, deleteAppointment, hydrateAppointments } =
  appointmentSlice.actions;
export const selectAppointments = (state: RootState) =>
  state.appointment.appointments;
export const selectAppointmentsLoading = (state: RootState) =>
  state.appointment.loading;
export const selectAppointmentsError = (state: RootState) =>
  state.appointment.error;
export const selectBookedSlots = (state: RootState) =>
  state.appointment.bookedSlots;
export default appointmentSlice.reducer;
