// src/app/components/auth/signout-button.tsx
"use client";

import { signOutAction } from "@/app/actions/signoutAction.server"; // Adjust the path as needed
import { LogOut } from "lucide-react";

export function SignOut() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="w-full flex items-center text-white gap-3 p-2 bg-red-500 hover:bg-red-600 rounded"
      >
        <LogOut size={20} /> Logout
      </button>
    </form>
  );
}
