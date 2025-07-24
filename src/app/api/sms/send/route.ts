import { NextResponse } from "next/server";
import twilio from "twilio";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phoneNumber, message } = body;

    if (!phoneNumber || !message) {
      return NextResponse.json(
        { error: "Missing phoneNumber or message" },
        { status: 400 }
      );
    }

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

    return NextResponse.json(
      { success: true, sid: response.sid },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Twilio SMS Error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to send SMS. Please try again later.",
      },
      { status: 500 }
    );
  }
}
