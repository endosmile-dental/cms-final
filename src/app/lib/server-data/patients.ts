import dbConnect from "@/app/utils/dbConnect";
import PatientModel from "@/app/model/Patient.model";
import DoctorModel from "@/app/model/Doctor.model";

/**
 * Server-side function to fetch patients for a doctor
 * @param doctorUserId - The user ID of the doctor
 * @returns Promise<Patient[]>
 */
export async function getDoctorPatients(doctorUserId: string) {
  try {
    await dbConnect();

    // Find the doctor document using the doctor.userId field
    const doctor = await DoctorModel.findOne({ userId: doctorUserId });
    if (!doctor) {
      throw new Error("Doctor not found");
    }

    // Fetch patients associated with the doctor's _id
    const patients = await PatientModel.find({ DoctorId: doctor._id })
      .select("-permissions -__v")
      .sort({ fullName: 1 });

    // Convert to plain objects to avoid circular reference issues in SSR
    return patients.map(patient => {
      const plainObj = patient.toObject();
      // Remove any Buffer objects and convert to plain strings
      if (plainObj._id && plainObj._id.toString) {
        plainObj._id = plainObj._id.toString();
      }
      if (plainObj.DoctorId && plainObj.DoctorId._id) {
        plainObj.DoctorId = plainObj.DoctorId._id.toString();
      }
      if (plainObj.userId && plainObj.userId._id) {
        plainObj.userId = plainObj.userId._id.toString();
      }
      if (plainObj.ClinicId && plainObj.ClinicId._id) {
        plainObj.ClinicId = plainObj.ClinicId._id.toString();
      }
      return plainObj;
    });
  } catch (error: unknown) {
    console.error("Error fetching doctor patients:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to fetch patients: ${error.message}`);
    }
    throw new Error("Unknown error occurred while fetching patients");
  }
}

/**
 * Server-side function to fetch a specific patient by ID
 * @param patientId - The ID of the patient
 * @param doctorUserId - The user ID of the doctor (for authorization)
 * @returns Promise<Patient | null>
 */
export async function getPatientById(patientId: string, doctorUserId: string) {
  try {
    await dbConnect();

    // Find the doctor document using the doctor.userId field
    const doctor = await DoctorModel.findOne({ userId: doctorUserId });
    if (!doctor) {
      throw new Error("Doctor not found");
    }

    // Fetch the specific patient and ensure they belong to this doctor
    const patient = await PatientModel.findOne({
      _id: patientId,
      DoctorId: doctor._id,
    }).select("-permissions -__v");

    return patient;
  } catch (error: unknown) {
    console.error("Error fetching patient by ID:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to fetch patient: ${error.message}`);
    }
    throw new Error("Unknown error occurred while fetching patient");
  }
}

/**
 * Server-side function to search patients by name or ID
 * @param searchTerm - The search term (name or PatientId)
 * @param doctorUserId - The user ID of the doctor
 * @returns Promise<Patient[]>
 */
export async function searchPatients(
  searchTerm: string,
  doctorUserId: string
) {
  try {
    await dbConnect();

    // Find the doctor document using the doctor.userId field
    const doctor = await DoctorModel.findOne({ userId: doctorUserId });
    if (!doctor) {
      throw new Error("Doctor not found");
    }

    // Create regex for case-insensitive search
    const searchRegex = new RegExp(searchTerm, "i");

    // Search patients by name or PatientId, ensuring they belong to this doctor
    const patients = await PatientModel.find({
      DoctorId: doctor._id,
      $or: [
        { fullName: searchRegex },
        { PatientId: searchRegex },
        { contactNumber: searchRegex },
      ],
    })
      .select("-permissions -__v")
      .sort({ fullName: 1 });

    return patients;
  } catch (error: unknown) {
    console.error("Error searching patients:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to search patients: ${error.message}`);
    }
    throw new Error("Unknown error occurred while searching patients");
  }
}

/**
 * Server-side function to get patient statistics for a doctor
 * @param doctorUserId - The user ID of the doctor
 * @returns Promise<{ total: number, male: number, female: number, other: number }>
 */
export async function getPatientStatistics(doctorUserId: string) {
  try {
    await dbConnect();

    // Find the doctor document using the doctor.userId field
    const doctor = await DoctorModel.findOne({ userId: doctorUserId });
    if (!doctor) {
      throw new Error("Doctor not found");
    }

    // Aggregate patient statistics
    const stats = await PatientModel.aggregate([
      {
        $match: {
          DoctorId: doctor._id,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          male: {
            $sum: {
              $cond: [{ $eq: ["$gender", "Male"] }, 1, 0],
            },
          },
          female: {
            $sum: {
              $cond: [{ $eq: ["$gender", "Female"] }, 1, 0],
            },
          },
          other: {
            $sum: {
              $cond: [{ $eq: ["$gender", "Other"] }, 1, 0],
            },
          },
        },
      },
    ]);

    if (stats.length === 0) {
      return {
        total: 0,
        male: 0,
        female: 0,
        other: 0,
      };
    }

    return {
      total: stats[0].total,
      male: stats[0].male,
      female: stats[0].female,
      other: stats[0].other,
    };
  } catch (error: unknown) {
    console.error("Error fetching patient statistics:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to fetch patient statistics: ${error.message}`);
    }
    throw new Error("Unknown error occurred while fetching patient statistics");
  }
}