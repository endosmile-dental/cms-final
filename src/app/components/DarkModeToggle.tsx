"use client";

import * as React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppSelector, useAppDispatch } from "@/app/redux/store/hooks";
import { setTheme } from "@/app/redux/slices/themeSlice";

export function DarkModeToggle() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.theme);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    dispatch(setTheme(newTheme));
  };

  const getIcon = () => {
    switch (theme.mode) {
      case "light":
        return <Sun className="h-4 w-4 text-yellow-500" />;
      case "dark":
        return <Moon className="h-4 w-4 text-blue-400" />;
      case "system":
        return <Monitor className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Sun className="h-4 w-4 text-yellow-500" />;
    }
  };

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <Button variant="outline" size="sm" className="relative">
        <Sun className="h-4 w-4 text-yellow-500" />
        <span className="sr-only">Toggle theme</span>
        <span className="ml-2 text-sm capitalize">Loading...</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          {getIcon()}
          <span className="sr-only">Toggle theme</span>
          <span className="ml-2 text-sm capitalize">{theme.mode}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem
          onClick={() => handleThemeChange("light")}
          className="flex items-center justify-between"
        >
          <div className="flex items-center">
            <Sun className="mr-2 h-4 w-4" />
            Light
          </div>
          {theme.mode === "light" && (
            <div className="h-2 w-2 rounded-full bg-blue-500" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleThemeChange("dark")}
          className="flex items-center justify-between"
        >
          <div className="flex items-center">
            <Moon className="mr-2 h-4 w-4" />
            Dark
          </div>
          {theme.mode === "dark" && (
            <div className="h-2 w-2 rounded-full bg-blue-500" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleThemeChange("system")}
          className="flex items-center justify-between"
        >
          <div className="flex items-center">
            <Monitor className="mr-2 h-4 w-4" />
            System
          </div>
          {theme.mode === "system" && (
            <div className="h-2 w-2 rounded-full bg-blue-500" />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
