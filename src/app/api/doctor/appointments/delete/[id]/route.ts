// app/api/doctor/appointments/delete/[id]/route.ts
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/app/utils/dbConnect";
import AppointmentModel from "@/app/model/Appointment.model";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    console.log("Database connected successfully.");

    // Await params before destructuring its properties
    const { id: appointmentId } = await params;
    console.log("Deleting appointment with ID:", appointmentId);

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return NextResponse.json(
        { error: "Invalid appointment ID" },
        { status: 400 }
      );
    }

    // Check if the appointment exists
    const existingAppointment = await AppointmentModel.findById(appointmentId);
    if (!existingAppointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    // Delete the appointment
    await AppointmentModel.findByIdAndDelete(appointmentId);
    console.log("Appointment deleted successfully:", appointmentId);

    return NextResponse.json(
      { message: "Appointment deleted successfully", id: appointmentId },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error fetching doctor details:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(
      { error: "Unknown error occurred" },
      { status: 500 }
    );
  }
}
