import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { RootState } from "../store/store";

// Define a type for an Appointment
export interface Appointment {
  _id: string;
  doctor: string | undefined;
  patient: string;
  clinic?: string;
  appointmentDate: string;
  status: "Scheduled" | "Completed" | "Cancelled";
  consultationType: "New" | "Follow-up";
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
  loading: boolean;
  error: string | null;
}

const initialState: AppointmentState = {
  appointments: [],
  loading: false,
  error: null,
};

// Asynchronous thunk action for fetching appointments
export const fetchAppointments = createAsyncThunk(
  "appointment/fetchAppointments",
  async (doctorUserId: string, { rejectWithValue }) => {
    const response = await fetch("/api/doctor/appointments/fetchAppointments", {
      headers: {
        "Content-Type": "application/json",
        "x-doctor-user-id": doctorUserId,
      },
    });
    if (!response.ok) {
      const errorData = await response.json();
      return rejectWithValue(errorData.error);
    }
    const data = await response.json();
    return data.appointments as Appointment[];
  }
);

// Async thunk to create an appointment using Mongoose-generated ID
export const createAppointment = createAsyncThunk(
  "appointment/createAppointment",
  async (
    appointmentData: Omit<Appointment, "_id" | "createdAt" | "updatedAt">,
    thunkAPI
  ) => {
    console.log("appointmentData", appointmentData);

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
    // Mongoose will generate _id, createdAt, and updatedAt automatically
    return data.appointment as Appointment;
  }
);

const appointmentSlice = createSlice({
  name: "appointment",
  initialState,
  reducers: {
    addAppointment(state, action: PayloadAction<Appointment>) {
      state.appointments.push(action.payload);
    },
    updateAppointment(state, action: PayloadAction<Appointment>) {
      const index = state.appointments.findIndex(
        (appointment) => appointment._id === action.payload._id
      );
      if (index !== -1) {
        state.appointments[index] = action.payload;
      }
    },
    deleteAppointment(state, action: PayloadAction<string>) {
      state.appointments = state.appointments.filter(
        (appointment) => appointment._id !== action.payload
      );
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch appointments cases
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
      // Create appointment cases
      .addCase(
        createAppointment.fulfilled,
        (state, action: PayloadAction<Appointment>) => {
          state.appointments.push(action.payload);
        }
      )
      .addCase(createAppointment.rejected, (state, action) => {
        state.error =
          (action.payload as string) || "Failed to create appointment";
      });
  },
});

export const { addAppointment, updateAppointment, deleteAppointment } =
  appointmentSlice.actions;
export const selectAppointments = (state: RootState) =>
  state.appointment.appointments;
export default appointmentSlice.reducer;
