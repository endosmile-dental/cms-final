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
  patientName: string;
  patientId: string;
  doctorId: string;
  clinicId: string;
  date: string;
  treatments: Treatment[];
  amountBeforeDiscount: number;
  discount: number;
  totalAmount: number;
  advance: number;
  amountReceived: number;
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

interface UpdateBillingArgs {
  billingId: string;
  updatedBillingData: Partial<BillingRecord>;
}

/**
 * Async thunk to update an existing billing record.
 * @param billingId - The ID of the billing record to update.
 * @param updatedBillingData - The data to update the billing record with.
 */

export const updateBillingRecord = createAsyncThunk<
  BillingRecord,
  UpdateBillingArgs,
  { rejectValue: string }
>(
  "billing/updateBilling",
  async ({ billingId, updatedBillingData }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/doctor/billing/update/${billingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedBillingData),
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
        return rejectWithValue("An unexpected error occurred");
      }
    }
  }
);

/**
 * Async thunk to create a new billing record.
 */
export const createBilling = createAsyncThunk<
  BillingRecord | undefined,
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
 * Async thunk to fetch billing records based on userId and role.
 */
export const fetchBillings = createAsyncThunk<
  BillingRecord[],
  { userId: string; role: "Doctor" | "Patient" },
  { rejectValue: string }
>("billing/fetchBillings", async ({ userId, role }, { rejectWithValue }) => {
  try {
    let url = "";
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (role === "Doctor") {
      url = "/api/doctor/billing/getAll";
      headers["x-doctor-user-id"] = userId;
    } else if (role === "Patient") {
      url = "/api/patient/billing/getBilling"; // API for fetching patient-specific billing
      headers["x-patient-user-id"] = userId;
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
      ? (data.billings as BillingRecord[])
      : (data.billings as BillingRecord[]);
  } catch {
    return rejectWithValue("Failed to fetch billings");
  }
});

/**
 * Billing slice definition.
 */
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

    builder.addCase(createBilling.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createBilling.fulfilled, (state, action) => {
      state.loading = false;
      if (action.payload) {
        state.billingRecords.push(action.payload);
      }
    });
    builder.addCase(createBilling.rejected, (state, action) => {
      state.loading = false;
      state.error = (action.payload as string) || "Failed to create billing";
    });
    builder.addCase(updateBillingRecord.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      updateBillingRecord.fulfilled,
      (state, action: PayloadAction<BillingRecord>) => {
        state.loading = false;
        const index = state.billingRecords.findIndex(
          (billing) => billing._id === action.payload._id
        );
        if (index !== -1) {
          state.billingRecords[index] = action.payload;
        }
      }
    );
    builder.addCase(updateBillingRecord.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || "Failed to update billing";
    });
  },
});

export const { addBilling, updateBilling, deleteBilling } =
  billingSlice.actions;
export const selectBillings = (state: RootState) =>
  state.billing.billingRecords;
export const selectBillingsLoading = (state: RootState) =>
  state.billing.loading;
export const selectBillingsError = (state: RootState) =>
  state.billing.error;

export default billingSlice.reducer;
