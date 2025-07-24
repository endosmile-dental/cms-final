// src/store/slices/patientSlice.ts
import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { RootState } from "../store/store";

// Define a type for a Patient (adjust to match your model)
export interface Patient {
  email: string | undefined;
  _id: string; // Mongoose-generated Document ID
  userId: string; // Reference to the User model
  DoctorId: string; // Reference to the Doctor model
  ClinicId: string; // Reference to the Clinic model
  PatientId: string; // Unique patient identifier (e.g., "ES000001")
  fullName: string;
  contactNumber: string;
  gender: "Male" | "Female" | "Other";
  dateOfBirth: string; // ISO date string
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  };
  medicalHistory?: string[];
  currentMedications?: string[];
  emergencyContact?: {
    fullName?: string;
    contactNumber?: string;
    relationship?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface PatientState {
  patients: Patient[];
  loading: boolean;
  error: string | null;
}

const initialState: PatientState = {
  patients: [],
  loading: false,
  error: null,
};

// Asynchronous thunk action for fetching patients for a given doctor
export const fetchPatients = createAsyncThunk(
  "patient/fetchPatients",
  async (
    { userId, role }: { userId: string; role: "Doctor" },
    { rejectWithValue }
  ) => {
    try {
      let url = "";
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (role === "Doctor") {
        url = "/api/doctor/fetchPatients";
        headers["x-doctor-user-id"] = userId;
      } else {
        return rejectWithValue("Invalid role");
      }

      const response = await fetch(url, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error);
      }

      const data = await response.json();
      return role === "Doctor"
        ? (data.patients as Patient[])
        : [data.profile as Patient]; // Ensure data format consistency
    } catch {
      return rejectWithValue("Failed to fetch patients");
    }
  }
);

export const updatePatientAsync = createAsyncThunk(
  "patient/updatePatientAsync",
  async (patient: Patient, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/doctor/editPatient", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(patient),
      });
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error);
      }
      const updatedPatient = await response.json();
      return updatedPatient.patient as Patient;
    } catch {
      return rejectWithValue("Failed to update patient");
    }
  }
);

const patientSlice = createSlice({
  name: "patient",
  initialState,
  reducers: {
    addPatient(state, action: PayloadAction<Patient>) {
      state.patients.push(action.payload);
    },
    updatePatient(state, action: PayloadAction<Patient>) {
      const index = state.patients.findIndex(
        (patient) => patient._id === action.payload._id
      );
      if (index !== -1) {
        state.patients[index] = action.payload;
      }
    },
    deletePatient(state, action: PayloadAction<string>) {
      state.patients = state.patients.filter(
        (patient) => patient._id !== action.payload
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPatients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchPatients.fulfilled,
        (state, action: PayloadAction<Patient[]>) => {
          state.loading = false;
          state.patients = action.payload;
        }
      )
      .addCase(fetchPatients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch patients";
      })
      .addCase(updatePatientAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        updatePatientAsync.fulfilled,
        (state, action: PayloadAction<Patient>) => {
          state.loading = false;
          const index = state.patients.findIndex(
            (patient) => patient._id === action.payload._id
          );
          if (index !== -1) {
            state.patients[index] = action.payload;
          }
        }
      )
      .addCase(updatePatientAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { addPatient, updatePatient, deletePatient } =
  patientSlice.actions;
export const selectPatients = (state: RootState) => state.patient.patients;
export const selectPatientLoading = (state: RootState) => state.patient.loading;
export const selectPatientError = (state: RootState) => state.patient.error;
export default patientSlice.reducer;
