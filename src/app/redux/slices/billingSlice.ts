// src/store/slices/billingSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store/store";

// Define an interface for a treatment item.
export interface Treatment {
  treatment: string;
  price: number;
  quantity: number;
}

// Define an interface for a Billing record.
export interface BillingRecord {
  _id: string;
  invoiceId: string;
  patientId: string;
  doctorId: string;
  clinicId: string;
  date: string; // or Date if you prefer
  treatments: Treatment[];
  discount: number;
  advance: number;
  amountReceived: number;
  modeOfPayment: string;
  address?: string;
  status: "Pending" | "Paid" | "Partial" | "Cancelled";
  createdAt: string;
  updatedAt: string;
}

// Define the state for the billing slice.
interface BillingState {
  billingRecords: BillingRecord[];
  loading: boolean;
  error: string | null;
}

const initialState: BillingState = {
  billingRecords: [],
  loading: false,
  error: null,
};

interface CreateBillingArgs {
  billingData: any;
  doctorId: string;
}

export const createBilling = createAsyncThunk(
  "billing/createBilling",
  async ({ billingData, doctorId }: CreateBillingArgs, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/doctor/billing/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-doctor-id": doctorId,
        },
        body: JSON.stringify(billingData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error);
      }

      const data = await response.json();
      return data.billing as BillingRecord;
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      } else {
        console.error("An unexpected error occurred");
        // setFormError("An unexpected error occurred");
      }
    }
  }
);

// Async thunk to fetch billing records from your API route.
export const fetchBillings = createAsyncThunk(
  "billing/fetchBillings",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch("/api/doctor/billing/getAll");
      if (!res.ok) {
        const errorData = await res.json();
        return rejectWithValue(errorData.error);
      }
      const data = await res.json();
      // Assuming the API returns { billings: BillingRecord[] }
      return data.billings as BillingRecord[];
    } catch (error: unknown) {
      return rejectWithValue(error);
    }
  }
);

const billingSlice = createSlice({
  name: "billing",
  initialState,
  reducers: {
    addBilling(state, action: PayloadAction<BillingRecord>) {
      state.billingRecords.push(action.payload);
    },
    updateBilling(state, action: PayloadAction<BillingRecord>) {
      const index = state.billingRecords.findIndex(
        (billing) => billing._id === action.payload._id
      );
      if (index !== -1) {
        state.billingRecords[index] = action.payload;
      }
    },
    deleteBilling(state, action: PayloadAction<string>) {
      state.billingRecords = state.billingRecords.filter(
        (billing) => billing._id !== action.payload
      );
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchBillings.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      fetchBillings.fulfilled,
      (state, action: PayloadAction<BillingRecord[]>) => {
        state.loading = false;
        state.billingRecords = action.payload;
      }
    );
    builder.addCase(fetchBillings.rejected, (state, action) => {
      state.loading = false;
      state.error = (action.payload as string) || "Failed to fetch billings";
    });
  },
});

// Export the reducer actions and selector.
export const { addBilling, updateBilling, deleteBilling } =
  billingSlice.actions;
export const selectBillings = (state: RootState) =>
  state.billing.billingRecords;
export default billingSlice.reducer;
