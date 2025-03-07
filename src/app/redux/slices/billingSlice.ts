// src/store/slices/billingSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store/store";

/**
 * Interface for an individual treatment item.
 */
export interface Treatment {
  treatment: string;
  price: number;
  quantity: number;
}

/**
 * Interface for a Billing record.
 */
export interface BillingRecord {
  _id: string;
  invoiceId: string;
  patientId: string;
  doctorId: string;
  clinicId: string;
  date: string; // Alternatively, Date if needed
  treatments: Treatment[];
  /** Original total before discount is applied */
  amountBeforeDiscount: number;
  /** Discount amount applied */
  discount: number;
  /** Total after discount is applied */
  totalAmount: number;
  advance: number;
  amountReceived: number;
  /** Remaining amount to be paid */
  amountDue: number;
  modeOfPayment: string;
  address?: string;
  status: "Pending" | "Paid" | "Partial" | "Cancelled";
  createdAt: string;
  updatedAt: string;
}

/**
 * Billing slice state.
 */
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
  billingData: unknown;
  doctorId: string;
}

/**
 * Async thunk to create a new billing record.
 * It sends a POST request to the billing API endpoint.
 */
export const createBilling = createAsyncThunk<
  BillingRecord | undefined, // Return type (can be undefined)
  CreateBillingArgs,
  { rejectValue: string }
>(
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
      }
    }
  }
);

/**
 * Async thunk to fetch billing records for a specific doctor.
 * The doctor ID is provided via a custom header.
 */
export const fetchBillings = createAsyncThunk<
  BillingRecord[],
  string,
  { rejectValue: string }
>(
  "billing/fetchBillings",
  async (doctorUserId: string, { rejectWithValue }) => {
    try {
      const res = await fetch(`/api/doctor/billing/getAll`, {
        headers: {
          "Content-Type": "application/json",
          "x-doctor-user-id": doctorUserId,
        },
      });
      if (!res.ok) {
        const errorData = await res.json();
        return rejectWithValue(errorData.error);
      }
      const data = await res.json();
      // Assuming the API returns an object with a billings array.
      return data.billings as BillingRecord[];
    } catch {
      return rejectWithValue("Failed to fetch billings");
    }
  }
);

/**
 * Billing slice definition.
 */
const billingSlice = createSlice({
  name: "billing",
  initialState,
  reducers: {
    /**
     * Adds a billing record to the state.
     */
    addBilling(state, action: PayloadAction<BillingRecord>) {
      state.billingRecords.push(action.payload);
    },
    /**
     * Updates an existing billing record.
     */
    updateBilling(state, action: PayloadAction<BillingRecord>) {
      const index = state.billingRecords.findIndex(
        (billing) => billing._id === action.payload._id
      );
      if (index !== -1) {
        state.billingRecords[index] = action.payload;
      }
    },
    /**
     * Deletes a billing record from the state by its _id.
     */
    deleteBilling(state, action: PayloadAction<string>) {
      state.billingRecords = state.billingRecords.filter(
        (billing) => billing._id !== action.payload
      );
    },
  },
  extraReducers: (builder) => {
    // Handle fetchBillings lifecycle.
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

    // Handle createBilling lifecycle.
    builder.addCase(createBilling.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createBilling.fulfilled, (state, action) => {
      state.loading = false;
      // Check if action.payload is defined before adding it.
      if (action.payload) {
        state.billingRecords.push(action.payload);
      }
    });
    builder.addCase(createBilling.rejected, (state, action) => {
      state.loading = false;
      state.error = (action.payload as string) || "Failed to create billing";
    });
  },
});

// Export actions and selector.
export const { addBilling, updateBilling, deleteBilling } =
  billingSlice.actions;
export const selectBillings = (state: RootState) =>
  state.billing.billingRecords;

export default billingSlice.reducer;
