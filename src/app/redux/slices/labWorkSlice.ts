import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { LabWorkInput } from "@/schemas/zobLabWorkSchema";
import { Types } from "mongoose";

interface LabWorkPatient {
  _id: Types.ObjectId | string;
  fullName: string;
  contactNumber: string;
}

interface LabWorkDoctor {
  _id: Types.ObjectId | string;
  fullName: string;
  specialization: string;
}

// Type for lab work item (backend model aligned)
export interface ILabWork extends Omit<LabWorkInput, "patientId" | "doctorId"> {
  _id: Types.ObjectId | string;
  createdAt?: string;
  updatedAt?: string;
  patientId: LabWorkPatient; // Changed from string to Patient object
  doctorId: LabWorkDoctor; // Changed from string to Doctor object
}

// State structure
interface LabWorkState {
  data: ILabWork[];
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: LabWorkState = {
  data: [],
  loading: false,
  error: null,
};

// ✅ Fetch all lab works
export const fetchLabWorks = createAsyncThunk(
  "labWork/fetchAll",
  async (
    { userId, role }: { userId: string; role: "Doctor" | "Patient" },
    { rejectWithValue }
  ) => {
    let url = "";
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (role === "Doctor") {
      url = "/api/doctor/labWork/fetchAll";
      headers["x-doctor-user-id"] = userId;
    } else if (role === "Patient") {
      url = "/api/doctor/labWork/fetchAll";
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
      return data;
    } catch {
      return rejectWithValue("An error occurred while fetching appointments");
    }
  }
);

// ✅ Create lab work
export const createLabWork = createAsyncThunk(
  "labWork/create",
  async (formData: FormData) => {
    const res = await fetch("/api/doctor/labWork/add", {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Failed to create lab work");
    return (await res.json()) as ILabWork;
  }
);

// ✅ Update lab work
export const updateLabWork = createAsyncThunk(
  "labWork/update",
  async ({ id, updates }: { id: string; updates: FormData }) => {
    const res = await fetch(`/api/doctor/labWork/update/${id}`, {
      method: "PUT",
      body: updates,
    });
    if (!res.ok) throw new Error("Failed to update lab work");
    return (await res.json()) as ILabWork;
  }
);

// ✅ Delete lab work
export const deleteLabWork = createAsyncThunk(
  "labWork/delete",
  async (id: string) => {
    const res = await fetch(`/api/doctor/labWork/delete/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete lab work");
    return id;
  }
);

// Slice with complete loading/error handling
const labWorkSlice = createSlice({
  name: "labWork",
  initialState,
  reducers: {
    clearLabWorkError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch cases
      .addCase(fetchLabWorks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLabWorks.fulfilled, (state, action) => {
        state.data = action.payload;
        state.loading = false;
      })
      .addCase(fetchLabWorks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch lab work";
      })

      // Create cases (added pending/rejected)
      .addCase(createLabWork.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createLabWork.fulfilled, (state, action) => {
        state.data.unshift(action.payload);
        state.loading = false;
      })
      .addCase(createLabWork.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to create lab work";
      })

      // Update cases (added pending/rejected)
      .addCase(updateLabWork.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateLabWork.fulfilled, (state, action) => {
        const index = state.data.findIndex(
          (item) => item._id === action.payload._id
        );
        if (index !== -1) state.data[index] = action.payload;
        state.loading = false;
      })
      .addCase(updateLabWork.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to update lab work";
      })

      // Delete cases (fixed error handling)
      .addCase(deleteLabWork.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteLabWork.fulfilled, (state, action) => {
        state.data = state.data.filter((item) => item._id !== action.payload);
        state.loading = false;
      })
      .addCase(deleteLabWork.rejected, (state, action) => {
        state.loading = false;
        // Fixed to use action.error instead of action.payload
        state.error = action.error.message || "Failed to delete lab work";
      });
  },
});

export const { clearLabWorkError } = labWorkSlice.actions;
// Selectors (add these at the end of the file)
export const selectAllLabWorks = (state: { labWork: LabWorkState }) =>
  state.labWork.data;

export const selectLabWorkLoading = (state: { labWork: LabWorkState }) =>
  state.labWork.loading;

export const selectLabWorkError = (state: { labWork: LabWorkState }) =>
  state.labWork.error;
export default labWorkSlice.reducer;
