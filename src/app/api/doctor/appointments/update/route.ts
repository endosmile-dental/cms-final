// app/api/doctor/appointments/update/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/app/utils/dbConnect";
import AppointmentModel from "@/app/model/Appointment.model";

export async function PUT(request: Request) {
  try {
    // Establish database connection
    await dbConnect();

    // Parse request body
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

    // Ensure treatments and teeth are arrays
    if (body.treatments && !Array.isArray(body.treatments)) {
      return NextResponse.json(
        { error: "Treatments should be an array" },
        { status: 400 }
      );
    }
    if (body.teeth && !Array.isArray(body.teeth)) {
      return NextResponse.json(
        { error: "Teeth should be an array" },
        { status: 400 }
      );
    }

    const appointmentId = body._id;

    // Update the appointment document with the provided body fields; { new: true } returns the updated document.
    const updatedAppointment = await AppointmentModel.findByIdAndUpdate(
      appointmentId,
      {
        $set: {
          appointmentDate: body.appointmentDate,
          status: body.status,
          consultationType: body.consultationType,
          timeSlot: body.timeSlot,
          treatments: body.treatments, // Optional, will overwrite if provided
          teeth: body.teeth, // Optional, will overwrite if provided
          notes: body.notes, // Optional, will overwrite if provided
          paymentStatus: body.paymentStatus, // Optional, will overwrite if provided
          amount: body.amount, // Optional, will overwrite if provided
        },
      },
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
  } catch (error: unknown) {
    console.error("Error updating appointment:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(
      { error: "Unknown error occurred" },
      { status: 500 }
    );
  }
}
