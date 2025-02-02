// src/app/actions/signoutAction.server.ts
"use server";

import { signOut } from "@/app/auth"; // Ensure this signOut function is implemented on the server
import { redirect } from "next/navigation";

export async function signOutAction() {
  await signOut(redirect("/api/auth/signin"));
}
