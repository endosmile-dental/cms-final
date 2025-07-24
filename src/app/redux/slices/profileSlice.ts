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
  createdAt: string;
  updatedAt: string;
}

export interface PatientProfile {
  _id: string;
  DoctorId: string;
  ClinicId: string;
  PatientId: string;
  fullName: string;
  contactNumber: string;
  gender: "Male" | "Female" | "Other";
  dateOfBirth: string;
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

// Fetch Profile Thunk
export const fetchProfile = createAsyncThunk<
  ProfileData,
  FetchProfileArgs,
  { rejectValue: string }
>("profile/fetchProfile", async ({ userId, role }, { rejectWithValue }) => {
  let endpoint = "";
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (role === "Doctor") {
    endpoint = "/api/doctor/fetchProfile";
    headers["x-doctor-user-id"] = userId;
  } else if (role === "Patient") {
    endpoint = "/api/patient/fetchProfile";
    headers["x-patient-user-id"] = userId;
  } else {
    return rejectWithValue("Unsupported user role");
  }

  try {
    const res = await fetch(endpoint, { method: "GET", headers });

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

interface UpdateProfileArgs {
  profile: DoctorProfile | PatientProfile;
  role: "Doctor" | "Patient";
}

// Update Profile Thunk
export const updateProfile = createAsyncThunk<
  ProfileData,
  UpdateProfileArgs,
  { rejectValue: string }
>("profile/updateProfile", async ({ profile, role }, { rejectWithValue }) => {
  let endpoint = "";
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (role === "Doctor") {
    endpoint = `/api/doctor/updateProfile/${profile._id}`;
    headers["x-doctor-user-id"] = profile._id;
  } else if (role === "Patient") {
    endpoint = `/api/patient/updateProfile/${profile._id}`;
    headers["x-patient-user-id"] = profile._id;
  } else {
    return rejectWithValue("Unsupported user role");
  }

  try {
    const res = await fetch(endpoint, {
      method: "PUT",
      headers,
      body: JSON.stringify(profile),
    });

    if (!res.ok) {
      const errorData = await res.json();
      return rejectWithValue(errorData.error || "Failed to update profile");
    }

    const updatedData = await res.json();
    return updatedData as ProfileData;
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
    builder
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch profile";
      })
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to update profile";
      });
  },
});

export const { clearProfile } = profileSlice.actions;
// Selectors
export const selectProfile = (state: { profile: ProfileState }) =>
  state.profile.profile;
export const selectProfileLoading = (state: { profile: ProfileState }) =>
  state.profile.loading;
export const selectProfileError = (state: { profile: ProfileState }) =>
  state.profile.error;

export default profileSlice.reducer;
