#!/usr/bin/env node
/**
 * ✅ ONE TIME MIGRATION SCRIPT
 * Fixes all existing corrupted appointment dates in database
 * Converts every appointment to properly normalized IST midnight UTC date
 *
 * Run with: node scripts/fixAppointmentDates.mjs
 */

import mongoose from "mongoose";
import dotenv from "dotenv";

import '../src/app/model/Appointment.model.js';

dotenv.config({ path: ".env.local" });

const TIMEZONE_OFFSET = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30

// Connect to database
await mongoose.connect(process.env.MONGODB_URI);
console.log("✅ Connected to database");

// Get all appointments
const Appointment = mongoose.model("Appointment");
const allAppointments = await Appointment.find({});

console.log(`📍 Found ${allAppointments.length} total appointments`);

let fixedCount = 0;
let alreadyCorrectCount = 0;

for (const apt of allAppointments) {
  const originalDate = new Date(apt.appointmentDate);

  // Extract actual date that user intended (regardless of stored time)
  const intendedLocalDate = new Date(originalDate.getTime() + TIMEZONE_OFFSET);
  const year = intendedLocalDate.getUTCFullYear();
  const month = intendedLocalDate.getUTCMonth();
  const day = intendedLocalDate.getUTCDate();

  // Create CORRECT normalized date: IST midnight = UTC 18:30 previous day
  const correctedDate = new Date(Date.UTC(year, month, day) - TIMEZONE_OFFSET);

  // Check if already correct
  if (originalDate.getTime() === correctedDate.getTime()) {
    alreadyCorrectCount++;
    continue;
  }

  // Update appointment
  apt.appointmentDate = correctedDate;
  await apt.save();
  fixedCount++;

  console.log(
    `🔧 Fixed: ${originalDate.toISOString()} → ${correctedDate.toISOString()}`,
  );
}

console.log("\n✅ MIGRATION COMPLETED");
console.log(`📊 Total appointments: ${allAppointments.length}`);
console.log(`✅ Already correct: ${alreadyCorrectCount}`);
console.log(`🔧 Fixed corrupted dates: ${fixedCount}`);
console.log("\n🎉 All appointments are now 100% consistent!");

await mongoose.disconnect();
