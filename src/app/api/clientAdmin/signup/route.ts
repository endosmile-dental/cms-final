import { NextResponse } from "next/server";
import dbConnect from "@/app/utils/dbConnect";
import UserModel from "@/app/model/User.model";
import clientAdminModel from "@/app/model/clientAdmin.model";

export async function POST(request: Request) {
  await dbConnect(); // Ensure the DB connection is established

  try {
    const body = await request.json();
    const { fullName, email, password, contactNumber, address } = body;

    // 1. Check if a user with the given email already exists.
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email already exists." },
        { status: 400 }
      );
    }

    // 2. Create the user in the User model with role "clientAdmin"
    // The password will be hashed automatically by the pre-save middleware on your User model.
    const newUser = await UserModel.create({
      email,
      password,
      role: "clientAdmin",
      status: "Active", // You can set default status as needed
    });

    // 3. Create the client admin in the clientAdmin model with the provided details.
    const newClientAdmin = await clientAdminModel.create({
      userId: newUser._id,
      fullName,
      contactNumber,
      address, // address is expected to be an object containing street, city, state, postalCode
    });

    // 4. Return a success response
    return NextResponse.json(
      {
        message: "Client Admin created successfully",
        user: newUser,
        clientAdmin: newClientAdmin,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Error during client admin signup:", error);
    if (error instanceof Error) {
      return NextResponse.json(
        { message: "Error during client admin signup:", error: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { message: "Unknown error occurred" },
      { status: 500 }
    );
  }
}
