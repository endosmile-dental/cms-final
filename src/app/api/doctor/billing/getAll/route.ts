import { NextResponse } from "next/server";
import dbConnect from "@/app/utils/dbConnect";
import BillingModel from "@/app/model/Billing.model";
import DoctorModel from "@/app/model/Doctor.model";

export async function GET(request: Request) {
  try {
    await dbConnect();

    // Extract doctorUserId from custom headers.
    const doctorUserId = request.headers.get("x-doctor-user-id");

    if (!doctorUserId) {
      return NextResponse.json(
        { message: "Doctor user id not provided" },
        { status: 400 }
      );
    }

    // Fetch billing records associated with the found doctor's _id.
    const billings = await BillingModel.find({ doctorId: doctorUserId });

    console.log("all billings", billings);

    return NextResponse.json({ billings });
  } catch (error: unknown) {
    console.error("Error fetching billings:", error);
    if (error instanceof Error) {
      return NextResponse.json(
        { message: "Error fetching billings", error: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { message: "Unknown error occurred" },
      { status: 500 }
    );
  }
}
