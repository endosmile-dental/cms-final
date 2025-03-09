// app/api/doctor/appointments/update/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/app/utils/dbConnect";
import AppointmentModel from "@/app/model/Appointment.model";

export async function PUT(request: Request) {
  try {
    // Establish database connection
    await dbConnect();

    const body = await request.json();

    // Ensure the appointment _id is provided in the request body.
    if (!body._id) {
      return NextResponse.json(
        { error: "Missing appointment _id in request body" },
        { status: 400 }
      );
    }

    // Optional: Validate required fields (e.g., appointmentDate, status, consultationType)
    if (!body.appointmentDate || !body.status || !body.consultationType) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: appointmentDate, status, or consultationType",
        },
        { status: 400 }
      );
    }

    const appointmentId = body._id;

    // Update the appointment document; { new: true } returns the updated document.
    const updatedAppointment = await AppointmentModel.findByIdAndUpdate(
      appointmentId,
      body,
      { new: true, runValidators: true }
    );

    if (!updatedAppointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { appointment: updatedAppointment },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update appointment" },
      { status: 500 }
    );
  }
}
