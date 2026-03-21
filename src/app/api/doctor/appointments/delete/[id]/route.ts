import { NextRequest } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/app/utils/dbConnect";
import AppointmentModel from "@/app/model/Appointment.model";
import { requireAuth } from "@/app/utils/authz";
import DoctorModel from "@/app/model/Doctor.model";
import { errorResponse, successResponse } from "@/app/utils/api";

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuth(["Doctor", "Admin", "SuperAdmin"]);
    if ("error" in authResult) return authResult.error;
    const { user } = authResult;

    await dbConnect();
    console.log("Database connected successfully.");

    // Extract the ID from the request URL
    const { pathname } = request.nextUrl;
    const parts = pathname.split("/");
    const appointmentId = parts[parts.length - 1];

    console.log("Deleting appointment with ID:", appointmentId);

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return errorResponse(400, "Invalid appointment ID");
    }

    // Check if the appointment exists
    const existingAppointment = await AppointmentModel.findById(appointmentId);
    if (!existingAppointment) {
      return errorResponse(404, "Appointment not found");
    }

    if (user.role === "Doctor") {
      const doctor = await DoctorModel.findOne({ userId: user.id }).select("_id");
      if (!doctor) {
        return errorResponse(404, "Doctor not found");
      }

      if (existingAppointment.doctor.toString() !== doctor._id.toString()) {
        return errorResponse(403, "Forbidden");
      }
    }

    // Delete the appointment
    await AppointmentModel.findByIdAndDelete(appointmentId);
    console.log("Appointment deleted successfully:", appointmentId);

    return successResponse(
      { message: "Appointment deleted successfully", id: appointmentId },
      200
    );
  } catch (error: unknown) {
    console.error("Error deleting appointment:", error);
    return errorResponse(
      500,
      error instanceof Error ? error.message : "Unknown error occurred"
    );
  }
}
