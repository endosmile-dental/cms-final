import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Define Doctor Interface
export interface Doctor {
  _id: string;
  userId: string;
  clinicId: string;
  fullName: string;
  specialization: string;
  specializationDetails?: string;
  contactNumber: string;
  address?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
  };
  qualifications?: string[];
  experienceYears: number;
  gender?: "Male" | "Female" | "Other";
  rating?: number;
  workingHours: {
    day: string;
    startTime: string;
    endTime: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

// Define the state type
interface DoctorsState {
  doctors: Doctor[];
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: DoctorsState = {
  doctors: [],
  loading: false,
  error: null,
};

// Define parameters for fetching doctors
interface FetchDoctorsArgs {
  userId: string;
}

// Async Thunk to fetch doctors
export const fetchDoctors = createAsyncThunk<
  Doctor[],
  FetchDoctorsArgs,
  { rejectValue: string }
>("doctors/fetchDoctors", async ({ userId }, { rejectWithValue }) => {
  try {
    const res = await fetch("/api/doctor/fetchDoctors", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": userId, // Only sending userId
      },
    });

    if (!res.ok) {
      const errorData = await res.json();
      return rejectWithValue(errorData.error || "Failed to fetch doctors");
    }

    const data = await res.json();
    return data.doctors; // Ensure API response contains { doctors: [...] }
  } catch (error: unknown) {
    if (error instanceof Error) {
      return rejectWithValue(error.message);
    }
    return rejectWithValue("An unknown error occurred");
  }
});

// Create the slice
const doctorSlice = createSlice({
  name: "doctors",
  initialState,
  reducers: {
    clearDoctors(state) {
      state.doctors = [];
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchDoctors.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchDoctors.fulfilled, (state, action) => {
      state.loading = false;
      state.doctors = action.payload;
    });
    builder.addCase(fetchDoctors.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || "Failed to fetch doctors";
    });
  },
});

// Export actions & reducer
export const { clearDoctors } = doctorSlice.actions;
export const selectDoctors = (state: { doctors: DoctorsState }) =>
  state.doctors.doctors;
export const selectDoctorsLoading = (state: DoctorsState) => state.loading;
export const selectDoctorsError = (state: DoctorsState) => state.error;

export default doctorSlice.reducer;
