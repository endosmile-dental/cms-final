// src/store/index.ts
import { configureStore } from "@reduxjs/toolkit";
import billingReducer from "../slices/billingSlice";
import patientReducer from "../slices/patientSlice";
import appointmentReducer from "../slices/appointmentSlice";
import profileReducer from "../slices/profileSlice";
import doctorReducer from "../slices/doctorSlice";
import labWorkReducer from "../slices/labWorkSlice";

export const store = configureStore({
  reducer: {
    patient: patientReducer,
    billing: billingReducer,
    appointment: appointmentReducer,
    profile: profileReducer,
    doctors: doctorReducer,
    labWork: labWorkReducer,

    // doctor: doctorReducer,
    // clinic: clinicReducer,
    // auth: authReducer,
  },
  // Redux Toolkit automatically sets up the Redux DevTools extension and middleware.
});

// Infer the `RootState` and `AppDispatch` types from the store itself.
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
