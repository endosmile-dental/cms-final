// app/api/doctor/billing/getAll/route.ts

import { NextResponse } from "next/server";
import dbConnect from "@/app/utils/dbConnect";
import BillingModel from "@/app/model/Billing.model";

export async function GET() {
  try {
    // Ensure the database is connected
    await dbConnect();

    // Fetch all billing records from the database.
    // Optionally, you can add sorting or other query parameters if needed.
    const billings = await BillingModel.find();

    // Return the billing records as JSON.
    return NextResponse.json({ billings });
  } catch (error: any) {
    console.error("Error fetching billings:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
