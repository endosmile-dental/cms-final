import { NextResponse, NextRequest } from "next/server";
import dbConnect from "@/app/utils/dbConnect";
import UserModel from "@/app/model/User.model";
import DoctorModel from "@/app/model/Doctor.model";
import PatientModel from "@/app/model/Patient.model"; // Correct Patient model import

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Extract userId from headers
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required in headers" },
        { status: 400 }
      );
    }

    // Find user details based on userId
    const user = await UserModel.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let clinicId: string | null = null;

    // Determine clinicId based on role
    if (user.role === "Doctor") {
      const doctor = await DoctorModel.findOne({ userId });
      clinicId = doctor?.clinicId?.toString() || null;
    } else if (user.role === "Patient") {
      const patient = await PatientModel.findOne({ userId });
      clinicId = patient?.ClinicId?.toString() || null;
    } else {
      return NextResponse.json(
        { error: "Access denied. Only Doctors and Patients are allowed." },
        { status: 403 }
      );
    }

    if (!clinicId) {
      return NextResponse.json(
        { error: "No clinic found for this user" },
        { status: 404 }
      );
    }

    // Fetch doctors belonging to the clinic
    const doctors = await DoctorModel.find({ clinicId }).select("-permissions");

    // Transform response data
    const transformedDoctors = doctors.map((doctor) => ({
      ...doctor.toObject(),
      _id: doctor._id.toString(),
      clinicId: doctor.clinicId.toString(),
      createdAt: doctor.createdAt.toISOString(),
      updatedAt: doctor.updatedAt.toISOString(),
    }));

    return NextResponse.json({ doctors: transformedDoctors }, { status: 200 });
  } catch (error: unknown) {
    console.error("Error fetching doctors:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
