import twilio from "twilio";
import { requireAuth } from "@/app/utils/authz";
import { errorResponse, parseJson, successResponse } from "@/app/utils/api";
import { sendSmsSchema } from "@/app/schemas/api";

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth([
      "Doctor",
      "Admin",
      "SuperAdmin",
      "clientAdmin",
    ]);
    if ("error" in authResult) return authResult.error;

    const parsed = await parseJson(request, sendSmsSchema);
    if ("error" in parsed) return parsed.error;
    const { phoneNumber, message } = parsed.data;

    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    );

    const response = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER!,
      to: phoneNumber,
    });

    console.log(`SMS sent to ${phoneNumber}: ${response.sid}`);

    return successResponse({ sid: response.sid }, 200);
  } catch (error: unknown) {
    console.error("Twilio SMS Error:", error);
    return errorResponse(
      500,
      error instanceof Error
        ? error.message
        : "Failed to send SMS. Please try again later."
    );
  }
}
