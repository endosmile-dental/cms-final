import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { RootState } from "../store/store";

export type ConsultationType = "New" | "Follow-up";
export type AppointmentStatus = "Scheduled" | "Completed" | "Cancelled";
export type PaymentStatus = "Pending" | "Paid" | "Refunded";

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

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(
          errorData.error || "Failed to fetch appointments"
        );
      }

      const data = await response.json();
      return data.appointments as Appointment[];
    } catch {
      return rejectWithValue("An error occurred while fetching appointments");
    }
  }
);

// Async thunk to create an appointment
export const createAppointment = createAsyncThunk(
  "appointment/createAppointment",
  async (
    appointmentData: Omit<Appointment, "_id" | "createdAt" | "updatedAt">,
    thunkAPI
  ) => {
    const response = await fetch("/api/doctor/appointments/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(appointmentData),
    });
    if (!response.ok) {
      return thunkAPI.rejectWithValue("Failed to create appointment");
    }
    const data = await response.json();
    return data.appointment as Appointment;
  }
);

// Async thunk to update (edit) an appointment on the server
export const editAppointment = createAsyncThunk(
  "appointment/editAppointment",
  async (appointment: Appointment, thunkAPI) => {
    const response = await fetch(`/api/doctor/appointments/update`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(appointment),
    });
    if (!response.ok) {
      const errorData = await response.json();
      return thunkAPI.rejectWithValue(
        errorData.error || "Failed to update appointment"
      );
    }
    const data = await response.json();
    return data.appointment as Appointment;
  }
);

// Async thunk to delete an appointment on the server
export const removeAppointment = createAsyncThunk(
  "appointment/removeAppointment",
  async (appointmentId: string, thunkAPI) => {
    const response = await fetch(
      `/api/doctor/appointments/delete/${appointmentId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    if (!response.ok) {
      const errorData = await response.json();
      return thunkAPI.rejectWithValue(
        errorData.error || "Failed to delete appointment"
      );
    }
    return appointmentId;
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

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(
          errorData.message || "Availability check failed"
        );
      }

      const data = await response.json();
      return data.bookedSlots; // Directly access bookedSlots from response
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
    // Synchronous action for adding an appointment.
    addAppointment(state, action: PayloadAction<Appointment>) {
      state.appointments.push(action.payload);
    },
    // Synchronous update action now accepts an Appointment directly.
    updateAppointment(state, action: PayloadAction<Appointment>) {
      const index = state.appointments.findIndex(
        (appt) => appt._id === action.payload._id
      );
      if (index !== -1) {
        state.appointments[index] = action.payload;
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
          state.appointments = action.payload;
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
          state.appointments.push(action.payload);
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
            state.appointments[index] = action.payload;
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
      .addCase(
        fetchAvailability.fulfilled,
        (state, action: PayloadAction<string[]>) => {
          state.bookedSlots = action.payload; // Store only time slots here
        }
      );
  },
});

export const { addAppointment, updateAppointment, deleteAppointment } =
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
