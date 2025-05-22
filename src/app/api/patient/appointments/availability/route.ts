// app/api/availability/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/app/utils/dbConnect";
import AppointmentModel from "@/app/model/Appointment.model";
import mongoose from "mongoose";

export async function GET(request: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get("doctorId");
    const date = searchParams.get("date");

    if (!doctorId || !date) {
      return NextResponse.json(
        { message: "Missing required parameters" },
        { status: 400 }
      );
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

    return NextResponse.json({ bookedSlots });
  } catch (error) {
    console.error("Availability check error:", error);
    return NextResponse.json(
      { message: "Error checking availability" },
      { status: 500 }
    );
  }
}
