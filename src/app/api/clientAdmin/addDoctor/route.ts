import clientAdminModel from "@/app/model/clientAdmin.model";
import ClinicModel from "@/app/model/Clinic.model";
import DoctorModel from "@/app/model/Doctor.model";
import UserModel from "@/app/model/User.model";
import dbConnect from "@/app/utils/dbConnect";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  await dbConnect();

  try {
    const body = await request.json();
    const {
      userId, // the client admin's userId extracted from the payload
      fullName,
      email,
      password,
      specialization,
      specializationDetails,
      contactNumber,
      experienceYears,
      gender,
      address,
      qualifications,
    } = body;

    console.log(userId);

    // 1. Check if a Client Admin exists using userId.
    const clientAdmin = await clientAdminModel.findOne({ userId: userId });
    if (!clientAdmin) {
      return NextResponse.json(
        { message: "Client Admin not found." },
        { status: 404 }
      );
    }

    // 2. Check if any Clinic exists that is associated with this Client Admin.
    // (Assuming your Clinic model stores a reference to ClientAdmin in a field named "clientAdmin")
    const clinic = await ClinicModel.findOne({
      clientAdminId: clientAdmin._id,
    });
    if (!clinic) {
      return NextResponse.json(
        { message: "No clinic found for this Client Admin." },
        { status: 404 }
      );
    }

    // 3. Create a new User document for the doctor.
    // The password will be hashed automatically by the pre-save hook in your User model.
    const newUser = await UserModel.create({
      email,
      password,
      role: "Doctor",
      status: "Active", // or your desired default status
    });

    // 4. Create a new Doctor document that includes:
    //    - The newly created User's ID
    //    - The Clinic's ID from the found clinic
    //    - The rest of the form fields
    const newDoctor = await DoctorModel.create({
      userId: newUser._id,
      clinicId: clinic._id,
      fullName,
      specialization,
      specializationDetails,
      contactNumber,
      experienceYears,
      gender,
      address,
      // Convert comma-separated qualifications string into an array, if provided.
      qualifications: qualifications
        ? qualifications.split(",").map((q: string) => q.trim())
        : [],
    });

    return NextResponse.json(
      {
        message: "Doctor created successfully.",
        user: newUser,
        doctor: newDoctor,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating doctor:", error);
    return NextResponse.json(
      { message: "Error creating doctor", error: error.message },
      { status: 500 }
    );
  }
}
