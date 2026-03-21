import {
  createSlice,
  createAsyncThunk,
  createSelector,
} from "@reduxjs/toolkit";
import type { ApiResponse } from "@/app/types/api";
import { unwrapApiResponse } from "@/app/utils/apiClient";


const shouldLog = process.env.NEXT_PUBLIC_DEBUG_LOGS === "true";
const debugLog = (...args: unknown[]) => {
  if (shouldLog) console.log(...args);
};

// Define treatment interface locally to avoid Mongoose type conflicts
export interface ITreatment {
  _id: string;
  name: string;
  category: string;
  description?: string;
  defaultPrice?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// State structure
interface TreatmentState {
  data: ITreatment[];
  loading: boolean;
  loaded: boolean;
  error: string | null;
}

// Initial state
const initialState: TreatmentState = {
  data: [],
  loading: false,
  loaded: false,
  error: null,
};

// Fetch all treatments
export const fetchTreatments = createAsyncThunk(
  "treatment/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      debugLog("DEBUG: fetchTreatments - Starting API call");
      const response = await fetch("/api/admin/treatments", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      debugLog("DEBUG: fetchTreatments - Response status:", response.status);
      const payload = (await response.json()) as ApiResponse<ITreatment[]>;
      debugLog("DEBUG: fetchTreatments - Raw payload:", payload);
      
      const data = unwrapApiResponse(payload);
      debugLog("DEBUG: fetchTreatments - Unwrapped data:", data);
      debugLog("DEBUG: fetchTreatments - Unwrapped data type:", typeof data);
      debugLog("DEBUG: fetchTreatments - Unwrapped data isArray:", Array.isArray(data));
      debugLog("DEBUG: fetchTreatments - Unwrapped data length:", Array.isArray(data) ? data.length : "Not an array");
      
      // Extract treatments from the response structure
      const treatments = Array.isArray(data)
        ? data
        : (
            typeof data === "object" &&
            data !== null &&
            Array.isArray((data as { treatments?: ITreatment[] }).treatments)
          )
          ? (data as { treatments?: ITreatment[] }).treatments
          : [];
      debugLog("DEBUG: fetchTreatments - Extracted treatments:", treatments);
      debugLog("DEBUG: fetchTreatments - Extracted treatments type:", typeof treatments);
      debugLog("DEBUG: fetchTreatments - Extracted treatments isArray:", Array.isArray(treatments));
      debugLog("DEBUG: fetchTreatments - Extracted treatments length:", Array.isArray(treatments) ? treatments.length : "Not an array");
      
      return treatments;
    } catch (error) {
      console.error("DEBUG: fetchTreatments - Error:", error);
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch treatments",
      );
    }
  },
);

// Create treatment
export const createTreatment = createAsyncThunk(
  "treatment/create",
  async (
    treatmentData: Omit<ITreatment, "_id" | "createdAt" | "updatedAt">,
  ) => {
    const response = await fetch("/api/admin/treatments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(treatmentData),
    });

    const payload = (await response.json()) as ApiResponse<ITreatment>;
    const data = unwrapApiResponse(payload);
    return data;
  },
);

// Update treatment
export const updateTreatment = createAsyncThunk(
  "treatment/update",
  async ({
    id,
    treatmentData,
  }: {
    id: string;
    treatmentData: Partial<ITreatment>;
  }) => {
    const response = await fetch(`/api/admin/treatments/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(treatmentData),
    });

    const payload = (await response.json()) as ApiResponse<ITreatment>;
    const data = unwrapApiResponse(payload);
    return data;
  },
);

// Delete treatment (soft delete)
export const deleteTreatment = createAsyncThunk(
  "treatment/delete",
  async (id: string) => {
    const response = await fetch(`/api/admin/treatments/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete treatment");
    }

    return id;
  },
);

// Slice with complete loading/error handling
const treatmentSlice = createSlice({
  name: "treatment",
  initialState,
  reducers: {
    clearTreatmentError(state) {
      state.error = null;
    },
    // Add hydration action for SSR + Redux combo
    hydrateTreatments(state, action: { payload: ITreatment[] }) {
      state.data = action.payload ?? [];
      state.loading = false;
      state.loaded = true;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch cases
      .addCase(fetchTreatments.pending, (state) => {
        debugLog("DEBUG: fetchTreatments.pending - Setting loading to true");
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTreatments.fulfilled, (state, action) => {
        debugLog("DEBUG: fetchTreatments.fulfilled - Setting data:", action.payload);
        state.data = action.payload ?? [];
        state.loading = false;
        state.loaded = true;
      })
      .addCase(fetchTreatments.rejected, (state, action) => {
        debugLog("DEBUG: fetchTreatments.rejected - Error:", action.error.message);
        state.loading = false;
        state.loaded = false;
        state.error = action.error.message || "Failed to fetch treatments";
      })

      // Create cases
      .addCase(createTreatment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTreatment.fulfilled, (state, action) => {
        state.data.unshift(action.payload);
        state.loading = false;
      })
      .addCase(createTreatment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to create treatment";
      })

      // Update cases
      .addCase(updateTreatment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTreatment.fulfilled, (state, action) => {
        const index = state.data.findIndex(
          (item) => item._id.toString() === action.payload._id.toString(),
        );
        if (index !== -1) state.data[index] = action.payload;
        state.loading = false;
      })
      .addCase(updateTreatment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to update treatment";
      })

      // Delete cases
      .addCase(deleteTreatment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTreatment.fulfilled, (state, action) => {
        state.data = state.data.filter(
          (item) => item._id.toString() !== action.payload,
        );
        state.loading = false;
      })
      .addCase(deleteTreatment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to delete treatment";
      });
  },
});

export const { clearTreatmentError } = treatmentSlice.actions;
export const hydrateTreatments = treatmentSlice.actions.hydrateTreatments;

// Memoized selectors to prevent unnecessary rerenders
export const selectAllTreatments = (state: { treatment: TreatmentState }) =>
  state.treatment.data;

export const selectActiveTreatments = createSelector(
  [(state: { treatment: TreatmentState }) => state.treatment.data],
  (data) => {
    if (!Array.isArray(data)) {
      return [];
    }
    
    return data.filter((treatment) => treatment.isActive);
  }
);

export const selectTreatmentsByCategory = createSelector(
  [
    (state: { treatment: TreatmentState }) => state.treatment.data,
    (state: { treatment: TreatmentState }, category: string) => category,
  ],
  (data, category) =>
    Array.isArray(data)
      ? data.filter(
          (treatment) => treatment.category === category && treatment.isActive,
        )
      : [],
);

export const selectTreatmentLoading = (state: { treatment: TreatmentState }) =>
  state.treatment.loading;

export const selectTreatmentLoaded = (state: { treatment: TreatmentState }) =>
  state.treatment.loaded;

export const selectTreatmentError = (state: { treatment: TreatmentState }) =>
  state.treatment.error;

export default treatmentSlice.reducer;
