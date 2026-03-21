import { createSlice } from "@reduxjs/toolkit";

interface HydrationState {
  isHydrated: boolean;
  hydrationTimestamp: number | null;
}

const initialState: HydrationState = {
  isHydrated: false,
  hydrationTimestamp: null,
};

const hydrationSlice = createSlice({
  name: "hydration",
  initialState,
  reducers: {
    hydrateStore: (state) => {
      state.isHydrated = true;
      state.hydrationTimestamp = Date.now();
    },
    resetHydration: (state) => {
      state.isHydrated = false;
      state.hydrationTimestamp = null;
    },
  },
});

export const { hydrateStore, resetHydration } = hydrationSlice.actions;
export default hydrationSlice.reducer;