// src/app/actions/signoutAction.server.ts
"use server";

import { signOut } from "@/app/auth"; // Ensure this signOut function is implemented on the server

export async function signOutAction() {
  await signOut({ redirectTo: "/api/auth/signin" });
}
