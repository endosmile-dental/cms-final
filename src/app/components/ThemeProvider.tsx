"use client";

import * as React from "react";
import { useAppSelector, useAppDispatch } from "@/app/redux/store/hooks";
import { useEffect } from "react";
import { updateSystemTheme, initializeTheme } from "@/app/redux/slices/themeSlice";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.theme);

  useEffect(() => {
    // Initialize theme from localStorage or system preference
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | "system" | null;
    const initialTheme = savedTheme || "light";
    
    dispatch(initializeTheme(initialTheme));
    
    // Set up system theme listener
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      dispatch(updateSystemTheme(e.matches));
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);
    
    // Initial system theme check
    dispatch(updateSystemTheme(mediaQuery.matches));

    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
    };
  }, [dispatch]);

  useEffect(() => {
    // Update CSS-in-JS variables when theme changes
    const root = window.document.documentElement;

    if (theme.isDark) {
      root.classList.add("dark");
      // Set dark theme CSS variables using HSL format for better consistency
      // Using bg-gray-900 equivalent: hsl(220 14.3% 15.1%)
      root.style.setProperty("--background", "220 14.3% 15.1%");
      root.style.setProperty("--foreground", "220 14.3% 96.1%");
      root.style.setProperty("--card", "220 14.3% 15.1%");
      root.style.setProperty("--card-foreground", "220 14.3% 96.1%");
      root.style.setProperty("--popover", "220 14.3% 15.1%");
      root.style.setProperty("--popover-foreground", "220 14.3% 96.1%");
      root.style.setProperty("--primary", "220 14.3% 96.1%");
      root.style.setProperty("--primary-foreground", "220 14.3% 15.1%");
      root.style.setProperty("--secondary", "220 14.3% 20.0%");
      root.style.setProperty("--secondary-foreground", "220 14.3% 96.1%");
      root.style.setProperty("--muted", "220 14.3% 20.0%");
      root.style.setProperty("--muted-foreground", "220 14.3% 70.0%");
      root.style.setProperty("--accent", "220 14.3% 20.0%");
      root.style.setProperty("--accent-foreground", "220 14.3% 96.1%");
      root.style.setProperty("--destructive", "0 62.8% 30.6%");
      root.style.setProperty("--destructive-foreground", "220 14.3% 96.1%");
      root.style.setProperty("--border", "220 14.3% 20.0%");
      root.style.setProperty("--input", "220 14.3% 20.0%");
      root.style.setProperty("--ring", "220 14.3% 80.0%");
      
      // Enhanced dark mode variables for better contrast
      root.style.setProperty("--sidebar-background", "220 14.3% 15.1%");
      root.style.setProperty("--sidebar-foreground", "240 4.8% 95.9%");
      root.style.setProperty("--sidebar-primary", "224.3 76.3% 48%");
      root.style.setProperty("--sidebar-primary-foreground", "0 0% 100%");
      root.style.setProperty("--sidebar-accent", "240 3.7% 15.9%");
      root.style.setProperty("--sidebar-accent-foreground", "240 4.8% 95.9%");
      root.style.setProperty("--sidebar-border", "240 3.7% 15.9%");
      root.style.setProperty("--sidebar-ring", "217.2 91.2% 59.8%");
    } else {
      root.classList.remove("dark");
      // Set light theme CSS variables using HSL format for better consistency
      root.style.setProperty("--background", "0 0% 100%");
      root.style.setProperty("--foreground", "240 10% 3.9%");
      root.style.setProperty("--card", "0 0% 100%");
      root.style.setProperty("--card-foreground", "240 10% 3.9%");
      root.style.setProperty("--popover", "0 0% 100%");
      root.style.setProperty("--popover-foreground", "240 10% 3.9%");
      root.style.setProperty("--primary", "240 5.9% 10%");
      root.style.setProperty("--primary-foreground", "0 0% 98%");
      root.style.setProperty("--secondary", "240 4.8% 95.9%");
      root.style.setProperty("--secondary-foreground", "240 5.9% 10%");
      root.style.setProperty("--muted", "240 4.8% 95.9%");
      root.style.setProperty("--muted-foreground", "240 3.8% 46.1%");
      root.style.setProperty("--accent", "240 4.8% 95.9%");
      root.style.setProperty("--accent-foreground", "240 5.9% 10%");
      root.style.setProperty("--destructive", "0 84.2% 60.2%");
      root.style.setProperty("--destructive-foreground", "0 0% 98%");
      root.style.setProperty("--border", "240 5.9% 90%");
      root.style.setProperty("--input", "240 5.9% 90%");
      root.style.setProperty("--ring", "240 10% 3.9%");
      
      // Enhanced light mode variables
      root.style.setProperty("--sidebar-background", "0 0% 98%");
      root.style.setProperty("--sidebar-foreground", "240 5.3% 26.1%");
      root.style.setProperty("--sidebar-primary", "240 5.9% 10%");
      root.style.setProperty("--sidebar-primary-foreground", "0 0% 98%");
      root.style.setProperty("--sidebar-accent", "240 4.8% 95.9%");
      root.style.setProperty("--sidebar-accent-foreground", "240 5.9% 10%");
      root.style.setProperty("--sidebar-border", "220 13% 91%");
      root.style.setProperty("--sidebar-ring", "217.2 91.2% 59.8%");
    }

    // Save theme preference to localStorage
    localStorage.setItem("theme", theme.mode);
  }, [theme.isDark, theme.mode]);

  return <div className={theme.isDark ? "dark" : ""}>{children}</div>;
}