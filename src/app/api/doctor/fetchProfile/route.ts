import { NextResponse } from "next/server";
import dbConnect from "@/app/utils/dbConnect";
import DoctorModel from "@/app/model/Doctor.model";

/**
 * GET route handler for fetching complete doctor details,
 * excluding sensitive data using .select().
 *
 * This function:
 * - Establishes a database connection.
 * - Extracts the doctor's user ID from a custom header ("x-doctor-user-id").
 * - Finds the doctor record in the DoctorModel using the provided user ID,
 *   while excluding sensitive fields.
 * - Returns the safe doctor details as JSON.
 *
 * @param request Request object.
 * @returns A NextResponse containing the doctor details or an error message.
 */
export async function GET(request: Request) {
  try {
    await dbConnect();
    const doctorUserId = request.headers.get("x-doctor-user-id");

    if (!doctorUserId) {
      return NextResponse.json(
        { error: "Doctor user id not provided" },
        { status: 400 }
      );
    }

    // Find doctor and exclude sensitive fields
    const doctor = await DoctorModel.findOne({ userId: doctorUserId }).select(
      "-permissions -userId"
    );

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    // Convert ObjectId to String before sending response
    const transformedDoctor = {
      ...doctor.toObject(),
      _id: doctor._id.toString(),
      clinicId: doctor.clinicId.toString(),
      createdAt: doctor.createdAt.toISOString(),
      updatedAt: doctor.updatedAt.toISOString(),
    };

    return NextResponse.json({ doctor: transformedDoctor }, { status: 200 });
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
