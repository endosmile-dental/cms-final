import clientAdminModel from "@/app/model/clientAdmin.model";
import ClinicModel from "@/app/model/Clinic.model";
import dbConnect from "@/app/utils/dbConnect";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  await dbConnect();

  try {
    const body = await request.json();

    const {
      name,
      registrationNumber,
      email,
      contactNumber,
      address,
      status,
      userId, // The userId of the User (from the request body)
    } = body;

    // Find the client admin document using the provided userId.
    // Adjust the lookup criteria if necessary.
    const clientAdminDoc = await clientAdminModel.findOne({ userId: userId });

    if (!clientAdminDoc) {
      return NextResponse.json(
        { message: "Client admin not found" },
        { status: 404 }
      );
    }

    // Create the new clinic, setting the clientAdmin field to the found client's _id.
    const newClinic = await ClinicModel.create({
      name,
      registrationNumber,
      email,
      contactNumber,
      address,
      status,
      clientAdminId: clientAdminDoc._id,
      // Other fields like services, businessHours, subscriptionPlan, etc. will use default values
    });

    return NextResponse.json(
      { message: "Clinic created successfully", clinic: newClinic },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating clinic:", error);
    return NextResponse.json(
      { message: "Error creating clinic", error: error.message },
      { status: 500 }
    );
  }
}
