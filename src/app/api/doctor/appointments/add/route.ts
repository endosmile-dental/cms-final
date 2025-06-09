import AppointmentModel from "@/app/model/Appointment.model";
import DoctorModel from "@/app/model/Doctor.model";
import dbConnect from "@/app/utils/dbConnect";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    await dbConnect();

    const body = await request.json();
    console.log("body", body);

    const {
      doctor, // User ID
      patient,
      appointmentDate,
      consultationType,
      createdBy,
      notes,
      timeSlot,
      treatments,
      teeth,
    } = body;

    // Validate required fields
    if (
      !doctor ||
      !patient ||
      !appointmentDate ||
      !consultationType ||
      !createdBy ||
      !timeSlot
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const appointmentDateObj = new Date(appointmentDate);
    console.log("appointmentDate", appointmentDate);
    console.log("appointmentDateObj", appointmentDateObj);
    console.log("Current date", new Date());
    const now = new Date();
    const nowStartOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const appointmentStartOfDay = new Date(
      appointmentDateObj.getFullYear(),
      appointmentDateObj.getMonth(),
      appointmentDateObj.getDate()
    );

    console.log("nowStartOfDay", nowStartOfDay);
    console.log("appointmentStartOfDay", appointmentStartOfDay);
    

    if (appointmentStartOfDay < nowStartOfDay) {
      return NextResponse.json(
        { error: "Appointment date must be today or in the future" },
        { status: 400 }
      );
    }

    // Fetch doctor info to extract internal ID and clinic ID
    const doctorInfo = await DoctorModel.findOne({ userId: doctor });
    if (!doctorInfo) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    const appointment = new AppointmentModel({
      doctor: doctorInfo._id,
      clinic: doctorInfo.clinicId,
      patient,
      appointmentDate,
      consultationType,
      createdBy,
      notes,
      timeSlot,
      treatments, // should be array of strings or ObjectIds
      teeth, // should be array of numbers or strings
      status: "Scheduled",
    });

    console.log("appointment", appointment);

    const savedAppointment = await appointment.save();

    return NextResponse.json(
      { appointment: savedAppointment },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Error creating appointment:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
