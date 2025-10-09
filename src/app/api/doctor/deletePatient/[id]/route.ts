// /app/api/doctor/deletePatient/[id]/route.ts
import AppointmentModel from "@/app/model/Appointment.model";
import BillingModel from "@/app/model/Billing.model";
import LabWorkModel from "@/app/model/LabWork.model";
import PatientModel from "@/app/model/Patient.model";
import UserModel from "@/app/model/User.model";
import dbConnect from "@/app/utils/dbConnect";
import { NextResponse, NextRequest } from "next/server";

// DELETE /api/doctor/deletePatient/:id
export async function DELETE(request: NextRequest) {
  await dbConnect();

  try {
    // Extract ID from URL path
    const pathSegments = request.nextUrl.pathname.split("/");
    const id = pathSegments[pathSegments.length - 1];

    console.log("Extracted ID:", id);

    if (!id) {
      return NextResponse.json(
        { error: "Missing patient ID" },
        { status: 400 }
      );
    }

    // Check if patient exists
    const patient = await PatientModel.findById(id);
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    console.log("Patient found:", patient);

    const patientId = patient._id.toString();
    const userId = patient.userId?.toString() || null;

    // ---- Delete related documents ----
    // Appointments: use patient (ObjectId)
    const appointmentsResult = await AppointmentModel.deleteMany({
      patient: patientId,
    });
    console.log("Appointments deleted:", appointmentsResult.deletedCount);

    // Billings: use patientId (stored as String)
    const billingsResult = await BillingModel.deleteMany({
      patientId: patientId,
    });
    console.log("Billings deleted:", billingsResult.deletedCount);

    // LabWorks: use patientId (ObjectId ref)
    const labResult = await LabWorkModel.deleteMany({ patientId: patientId });
    console.log("LabWorks deleted:", labResult.deletedCount);

    // ---- Delete linked User if exists ----
    if (userId) {
      const deletedUser = await UserModel.findByIdAndDelete(userId);
      console.log("Deleted User:", deletedUser?._id || "No user found");
    }

    // ---- Delete patient last ----
    await PatientModel.findByIdAndDelete(patientId);
    console.log("Deleted Patient:", patientId);

    return NextResponse.json(
      {
        message: "Patient, linked user, and related data deleted successfully",
        deleted: {
          patientId,
          userId: userId || null,
          appointments: appointmentsResult.deletedCount,
          billings: billingsResult.deletedCount,
          labworks: labResult.deletedCount,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete patient error:", error);
    return NextResponse.json(
      { error: "Failed to delete patient" },
      { status: 500 }
    );
  }
}
