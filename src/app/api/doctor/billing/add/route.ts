import dbConnect from "@/app/utils/dbConnect";
import Billing from "@/app/model/Billing.model";
import DoctorModel from "@/app/model/Doctor.model";
import { zodBillingSchema } from "@/schemas/zodBillingSchema";
import { ZodError } from "zod";
import { requireAuth, resolveUserIdFromHeader } from "@/app/utils/authz";
import { errorResponse, parseJson, successResponse } from "@/app/utils/api";
import { z } from "zod";

/**
 * POST route handler for creating a new billing record.
 *
 * This function:
 * - Establishes a database connection.
 * - Parses and validates the request body using zodBillingSchema.
 * - Retrieves the doctor's record (to get the clinicId) using a custom header "x-doctor-id".
 * - Creates a new billing document. The Billing model's pre-save middleware will
 *   compute financial fields (such as amountBeforeDiscount, totalAmount, and amountDue).
 *
 * @param request Request object containing billing data in JSON format.
 * @returns A NextResponse with a success message and the created billing record, or an error message.
 */
export async function POST(request: Request) {
  try {
    const authResult = await requireAuth(["Doctor", "Admin", "SuperAdmin"]);
    if ("error" in authResult) return authResult.error;
    const { user } = authResult;

    // Establish a database connection.
    await dbConnect();

    const parsedBody = await parseJson(request, z.record(z.unknown()));
    if ("error" in parsedBody) return parsedBody.error;
    const body = parsedBody.data as Record<string, unknown>;

    // Replace patientId with hiddenPatientId and remove original patientId
    if (body.hiddenPatientId) {
      body.patientId = body.hiddenPatientId; // Set as actual ObjectId
    }

    // Now run Zod validation
    const data = zodBillingSchema.parse(body);
    console.log("Parsed Billing Data:", data);

    // Retrieve doctorId from a custom header (or session).
    const doctorIdResult = resolveUserIdFromHeader(
      request,
      user,
      "x-doctor-id"
    );
    if ("error" in doctorIdResult) return doctorIdResult.error;
    const { userId: doctorId } = doctorIdResult;

    // Retrieve the doctor's record to extract the associated clinicId.
    const doctor = await DoctorModel.findOne({ userId: doctorId });
    if (!doctor) {
      return errorResponse(404, "Doctor not found.");
    }
    const clinicId = doctor.clinicId;

    // Create a new billing document.
    // Dummy values are passed for computed fields to satisfy Mongoose's required constraints.
    // The pre-save middleware in the Billing model will recalculate these values.
    const billing = await Billing.create({
      invoiceId: data.invoiceId,
      patientId: data.patientId,
      doctorId: doctorId,
      clinicId: clinicId,
      date: new Date(data.date),
      treatments: data.treatments,
      discount: data.discount,
      advance: data.advance,
      amountReceived: data.amountReceived,
      modeOfPayment: data.modeOfPayment,
      address: data.address,
      amountBeforeDiscount: 0,
      totalAmount: 0,
      amountDue: 0,
    });

    return successResponse(
      { message: "Billing created successfully", billing },
      201
    );
  } catch (error: unknown) {
    console.error("Error creating billing:", error);
    if (error instanceof ZodError) {
      return errorResponse(400, "Validation error", error.issues);
    } else if (error instanceof Error) {
      // If it was a connection‐failure after all retries, you can return 503
      if (
        error.message.includes("Server selection") ||
        error.message.includes("connection") ||
        error.message.includes("Timeout")
      ) {
        return errorResponse(
          503,
          "Database unavailable. Please try again later."
        );
      }
      return errorResponse(500, "Error creating billing", error.message);
    }
    return errorResponse(500, "Unknown error occurred");
  }
}
