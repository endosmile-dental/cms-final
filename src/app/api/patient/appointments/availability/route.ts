// app/api/availability/route.ts
import dbConnect from "@/app/utils/dbConnect";
import AppointmentModel from "@/app/model/Appointment.model";
import mongoose from "mongoose";
import { requireAuth } from "@/app/utils/authz";
import { errorResponse, successResponse } from "@/app/utils/api";
import { parseDateFromServer } from "@/app/utils/dateUtils";

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth([
      "Patient",
      "Doctor",
      "Admin",
      "SuperAdmin",
    ]);
    if ("error" in authResult) return authResult.error;

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get("doctorId");
    const date = searchParams.get("date");

    if (!doctorId || !date) {
      return errorResponse(400, "Missing required parameters");
    }

    // Parse date as local date (YYYY-MM-DD format) to avoid timezone issues
    const startDate = parseDateFromServer(date);
    const endDate = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate(),
      23,
      59,
      59,
      999
    );

    console.log('[AVAILABILITY API] Query params:', { doctorId, date });
    console.log('[AVAILABILITY API] Date range:', { startDate: startDate.toISOString(), endDate: endDate.toISOString() });

    const appointments = await AppointmentModel.find({
      doctor: new mongoose.Types.ObjectId(doctorId),
      appointmentDate: {
        $gte: startDate,
        $lte: endDate,
      },
      status: { $ne: "Cancelled" },
    }).select("timeSlot appointmentDate");

    const bookedSlots = [...new Set(appointments.map((appt) => appt.timeSlot))];

    console.log('[AVAILABILITY API] Found appointments:', appointments.length);
    console.log('[AVAILABILITY API] Booked slots:', bookedSlots);

    return successResponse({ bookedSlots });
  } catch (error) {
    console.error("Availability check error:", error);
    return errorResponse(500, "Error checking availability");
  }
}
