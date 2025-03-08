import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

export interface DoctorProfile {
  _id: string;
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
  createdAt: string; // ISO string representation
  updatedAt: string;
}

export interface PatientProfile {
  _id: string;
  DoctorId: string;
  ClinicId: string;
  PatientId: string;
  fullName: string;
  contactNumber: string;
  email?: string;
  gender: "Male" | "Female" | "Other";
  dateOfBirth: string; // ISO string representation
  address?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
  };
  medicalHistory?: string[];
  currentMedications?: string[];
  emergencyContact?: {
    fullName: string;
    contactNumber: string;
    relationship: string;
  };
  createdAt: string;
  updatedAt: string;
}

export type ProfileData = DoctorProfile | PatientProfile | null;

interface ProfileState {
  profile: ProfileData;
  loading: boolean;
  error: string | null;
}

const initialState: ProfileState = {
  profile: null,
  loading: false,
  error: null,
};

interface FetchProfileArgs {
  userId: string;
  role: string;
}

// Create an async thunk to fetch the profile data based on the role.
export const fetchProfile = createAsyncThunk<
  ProfileData,
  FetchProfileArgs,
  { rejectValue: string }
>("profile/fetchProfile", async ({ userId, role }, { rejectWithValue }) => {
  let endpoint = "";
  if (role === "Doctor") {
    endpoint = "/api/doctor/fetchProfile";
  } else if (role === "Patient") {
    endpoint = "/api/patient/fetchProfile";
  } else {
    return rejectWithValue("Unsupported user role");
  }
  try {
    const res = await fetch(endpoint, {
      headers: {
        "Content-Type": "application/json",
        // Pass userId as header (adjust key if needed)
        "x-doctor-user-id": userId,
      },
    });
    if (!res.ok) {
      const errorData = await res.json();
      return rejectWithValue(errorData.error || "Failed to fetch profile");
    }
    const data = await res.json();
    if (role === "Doctor" && data.doctor) {
      return data.doctor as ProfileData;
    } else if (role === "Patient" && data.patient) {
      return data.patient as ProfileData;
    }
    return rejectWithValue("Profile data missing");
  } catch (error: unknown) {
    if (error instanceof Error) {
      return rejectWithValue(error.message);
    }
    return rejectWithValue("An unknown error occurred");
  }
});

const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    clearProfile(state) {
      state.profile = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchProfile.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchProfile.fulfilled, (state, action) => {
      state.loading = false;
      state.profile = action.payload;
    });
    builder.addCase(fetchProfile.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || "Failed to fetch profile";
    });
  },
});

export const { clearProfile } = profileSlice.actions;
export default profileSlice.reducer;
