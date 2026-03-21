// app/api/availability/route.ts
import dbConnect from "@/app/utils/dbConnect";
import AppointmentModel from "@/app/model/Appointment.model";
import mongoose from "mongoose";
import { requireAuth } from "@/app/utils/authz";
import { errorResponse, successResponse } from "@/app/utils/api";

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

    // Convert date to local time range (avoid UTC offset issues)
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const appointments = await AppointmentModel.find({
      doctor: new mongoose.Types.ObjectId(doctorId),
      appointmentDate: {
        $gte: startDate,
        $lte: endDate,
      },
      status: { $ne: "Cancelled" },
    }).select("timeSlot appointmentDate");

    const bookedSlots = [...new Set(appointments.map((appt) => appt.timeSlot))];

    return successResponse({ bookedSlots });
  } catch (error) {
    console.error("Availability check error:", error);
    return errorResponse(500, "Error checking availability");
  }
}
