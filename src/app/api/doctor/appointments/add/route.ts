import AppointmentModel from "@/app/model/Appointment.model";
import DoctorModel from "@/app/model/Doctor.model";
import dbConnect from "@/app/utils/dbConnect";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // Connect to the database
    await dbConnect();

    // Parse the JSON body from the request
    const body = await request.json();
    console.log("body", body);

    // Destructure the required fields from the request body
    const {
      doctor, // This is doctors User Id
      patient,
      appointmentDate,
      consultationType,
      createdBy,
      notes,
    } = body;

    // Basic validation: check required fields
    if (
      !doctor ||
      !patient ||
      !appointmentDate ||
      !consultationType ||
      !createdBy
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const doctorInfo = await DoctorModel.findOne({ userId: doctor });

    console.log("doctorInfo", doctorInfo);

    // Create a new appointment document.
    // Note: Mongoose's pre-save hook will validate that the appointmentDate is in the future.
    const appointment = new AppointmentModel({
      doctor: doctorInfo?._id,
      clinic: doctorInfo?.clinicId,
      patient,
      appointmentDate,
      consultationType,
      createdBy,
      notes,
      status: "Scheduled", // You can set the default status here
    });

    // Save the appointment to the database
    const savedAppointment = await appointment.save();

    // Return the created appointment with a 201 status code.
    return NextResponse.json(
      { appointment: savedAppointment },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating appointment:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
