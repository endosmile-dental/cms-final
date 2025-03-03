import { NextResponse } from "next/server";
import dbConnect from "@/app/utils/dbConnect";
import AppointmentModel from "@/app/model/Appointment.model";
import DoctorModel from "@/app/model/Doctor.model";

export async function GET(request: Request) {
  try {
    await dbConnect();

    // Retrieve the doctorUserId from the custom header.
    const doctorUserId = request.headers.get("x-doctor-user-id");

    if (!doctorUserId) {
      return NextResponse.json(
        { message: "Doctor user id not provided" },
        { status: 400 }
      );
    }

    // Find the doctor document using the doctor.userId field.
    const doctor = await DoctorModel.findOne({ userId: doctorUserId });
    if (!doctor) {
      return NextResponse.json(
        { message: "Doctor not found" },
        { status: 404 }
      );
    }

    // Fetch appointments associated with the doctor's _id.
    const appointments = await AppointmentModel.find({ doctor: doctor._id });

    return NextResponse.json({ appointments });
  } catch (error: unknown) {
    console.error("Error fetching appointments:", error);
    if (error instanceof Error) {
      return NextResponse.json(
        { message: "Error fetching appointments", error: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { message: "Unknown error occurred" },
      { status: 500 }
    );
  }
}
