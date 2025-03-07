import { NextResponse } from "next/server";
import PatientModel from "@/app/model/Patient.model";
import DoctorModel from "@/app/model/Doctor.model";
import dbConnect from "@/app/utils/dbConnect";

export async function GET(request: Request) {
  try {
    await dbConnect();

    // Extract doctorUserId from headers instead of query parameters.
    const doctorUserId = request.headers.get("x-doctor-user-id");
    console.log("doctorUserId",doctorUserId);
    
    if (!doctorUserId) {
      return NextResponse.json(
        { message: "Doctor user id not provided" },
        { status: 400 }
      );
    }

    // Retrieve the doctor document using the doctor.userId field.
    const doctor = await DoctorModel.findOne({ userId: doctorUserId });
    if (!doctor) {
      return NextResponse.json(
        { message: "Doctor not found" },
        { status: 404 }
      );
    }

    // Fetch patients associated with the doctor's _id.
    const patients = await PatientModel.find({ DoctorId: doctor._id }).select(
      "-permissions -__v"
    );

    return NextResponse.json({ patients });
  } catch (error: unknown) {
    console.error("Error fetching patients:", error);
    if (error instanceof Error) {
      return NextResponse.json(
        { message: "Error fetching patients:", error: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { message: "Unknown error occurred" },
      { status: 500 }
    );
  }
}
