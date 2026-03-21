import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type Theme = "light" | "dark" | "system";

interface ThemeState {
  mode: Theme;
  isDark: boolean;
}

const initialState: ThemeState = {
  mode: "light",
  isDark: false,
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<Theme>) => {
      state.mode = action.payload;
      // Update isDark based on the new mode
      if (action.payload === "system") {
        // Check system preference
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        state.isDark = prefersDark;
      } else {
        state.isDark = action.payload === "dark";
      }
    },
    toggleTheme: (state) => {
      if (state.mode === "light") {
        state.mode = "dark";
        state.isDark = true;
      } else if (state.mode === "dark") {
        state.mode = "light";
        state.isDark = false;
      }
      // If mode is "system", toggle between light and dark but keep system mode
    },
    updateSystemTheme: (state, action: PayloadAction<boolean>) => {
      if (state.mode === "system") {
        state.isDark = action.payload;
      }
    },
    initializeTheme: (state, action: PayloadAction<Theme>) => {
      state.mode = action.payload;
      // Initialize isDark based on the mode
      if (action.payload === "system") {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        state.isDark = prefersDark;
      } else {
        state.isDark = action.payload === "dark";
      }
    },
  },
});

export const { setTheme, toggleTheme, updateSystemTheme, initializeTheme } =
  themeSlice.actions;

export default themeSlice.reducer;