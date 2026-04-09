import dbConnect from "@/app/utils/dbConnect";
import LabWorkModel from "@/app/model/LabWork.model";
import DoctorModel from "@/app/model/Doctor.model";
import PatientModel from "@/app/model/Patient.model";
import { formatDateForServer } from "@/app/utils/dateUtils";

/**
 * Server-side function to fetch lab work records for a doctor
 * @param doctorUserId - The user ID of the doctor
 * @returns Promise<LabWork[]>
 */
export async function getDoctorLabWorks(doctorUserId: string) {
  try {
    await dbConnect();

    // Find the doctor document using the doctor.userId field
    const doctor = await DoctorModel.findOne({ userId: doctorUserId })
      .select("_id fullName specialization")
      .lean<{ _id: string; fullName: string; specialization: string } | null>();
    
    if (!doctor || Array.isArray(doctor) || !doctor._id) {
      throw new Error("Doctor not found");
    }

    // Fetch lab work records associated with the doctor's _id
    const labWorks = await LabWorkModel.find({ doctorId: doctor._id })
      .populate("patientId", "fullName contactNumber PatientId")
      .sort({ createdAt: -1 })
      .lean();

    // Convert to plain objects to avoid circular reference issues in SSR
    return labWorks.map((labWork) => {
      const plainObj = { ...labWork };
      
      // Remove any Buffer objects and convert to plain strings
      if (plainObj._id && plainObj._id.toString) {
        plainObj._id = plainObj._id.toString();
      }
      
      // Convert doctorId to object format matching Redux slice expectations
      plainObj.doctorId = {
        _id: doctor._id.toString(),
        fullName: doctor.fullName,
        specialization: doctor.specialization,
      };
      
      // Convert patientId to object format matching Redux slice expectations
      if (plainObj.patientId && typeof plainObj.patientId === 'object' && '_id' in plainObj.patientId) {
        const patient = plainObj.patientId as { _id: unknown; fullName?: string; contactNumber?: string; PatientId?: string };
        plainObj.patientId = {
          _id: patient._id?.toString() || '',
          fullName: patient.fullName || '',
          contactNumber: patient.contactNumber || '',
        };
      }
      
      // Convert Date objects to strings for Redux compatibility
      if (plainObj.impressionsTakenOn && plainObj.impressionsTakenOn instanceof Date) {
        plainObj.impressionsTakenOn = formatDateForServer(plainObj.impressionsTakenOn);
      }
      if (plainObj.sentToLabOn && plainObj.sentToLabOn instanceof Date) {
        plainObj.sentToLabOn = formatDateForServer(plainObj.sentToLabOn);
      }
      if (plainObj.receivedFromLabOn && plainObj.receivedFromLabOn instanceof Date) {
        plainObj.receivedFromLabOn = formatDateForServer(plainObj.receivedFromLabOn);
      }
      if (plainObj.fittedOn && plainObj.fittedOn instanceof Date) {
        plainObj.fittedOn = formatDateForServer(plainObj.fittedOn);
      }
      if (plainObj.expectedDeliveryDate && plainObj.expectedDeliveryDate instanceof Date) {
        plainObj.expectedDeliveryDate = formatDateForServer(plainObj.expectedDeliveryDate);
      }
      if (plainObj.reWorkSentDate && plainObj.reWorkSentDate instanceof Date) {
        plainObj.reWorkSentDate = formatDateForServer(plainObj.reWorkSentDate);
      }
      if (plainObj.createdAt && plainObj.createdAt instanceof Date) {
        plainObj.createdAt = formatDateForServer(plainObj.createdAt);
      }
      if (plainObj.updatedAt && plainObj.updatedAt instanceof Date) {
        plainObj.updatedAt = formatDateForServer(plainObj.updatedAt);
      }
      
      return plainObj;
    });
  } catch (error: unknown) {
    console.error("Error fetching doctor lab works:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to fetch lab works: ${error.message}`);
    }
    throw new Error("Unknown error occurred while fetching lab works");
  }
}

/**
 * Server-side function to fetch lab work records for a patient
 * @param patientUserId - The user ID of the patient
 * @returns Promise<LabWork[]>
 */
export async function getPatientLabWorks(patientUserId: string) {
  try {
    await dbConnect();

    // Find the patient document using the patient.userId field
    const patient = await PatientModel.findOne({ userId: patientUserId });
    if (!patient) {
      throw new Error("Patient not found");
    }

    // Fetch lab work records associated with the patient's _id
    const labWorks = await LabWorkModel.find({ patientId: patient._id })
      .populate("doctorId", "fullName")
      .sort({ createdAt: -1 })
      .lean(); // Use lean() to get plain objects instead of Mongoose documents

    // Convert Date objects to strings for Redux compatibility
    return labWorks.map(labWork => {
      if (labWork.impressionsTakenOn && labWork.impressionsTakenOn instanceof Date) {
        labWork.impressionsTakenOn = formatDateForServer(labWork.impressionsTakenOn);
      }
      if (labWork.sentToLabOn && labWork.sentToLabOn instanceof Date) {
        labWork.sentToLabOn = formatDateForServer(labWork.sentToLabOn);
      }
      if (labWork.receivedFromLabOn && labWork.receivedFromLabOn instanceof Date) {
        labWork.receivedFromLabOn = formatDateForServer(labWork.receivedFromLabOn);
      }
      if (labWork.fittedOn && labWork.fittedOn instanceof Date) {
        labWork.fittedOn = formatDateForServer(labWork.fittedOn);
      }
      if (labWork.expectedDeliveryDate && labWork.expectedDeliveryDate instanceof Date) {
        labWork.expectedDeliveryDate = formatDateForServer(labWork.expectedDeliveryDate);
      }
      if (labWork.reWorkSentDate && labWork.reWorkSentDate instanceof Date) {
        labWork.reWorkSentDate = formatDateForServer(labWork.reWorkSentDate);
      }
      return labWork;
    });
  } catch (error: unknown) {
    console.error("Error fetching patient lab works:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to fetch lab works: ${error.message}`);
    }
    throw new Error("Unknown error occurred while fetching lab works");
  }
}

/**
 * Server-side function to get lab work analytics for a doctor
 * @param doctorUserId - The user ID of the doctor
 * @returns Promise<LabWorkAnalytics>
 */
export async function getDoctorLabWorkAnalytics(doctorUserId: string) {
  try {
    await dbConnect();

    // Find the doctor document using the doctor.userId field
    const doctor = await DoctorModel.findOne({ userId: doctorUserId });
    if (!doctor || Array.isArray(doctor) || !doctor._id) {
      throw new Error("Doctor not found");
    }

    // Fetch all lab work records for the doctor
    const labWorks = await LabWorkModel.find({ doctorId: doctor._id })
      .populate("patientId", "fullName")
      .lean(); // Use lean() to get plain objects instead of Mongoose documents

    if (!labWorks || labWorks.length === 0) {
      return {
        totalLabWorks: 0,
        pendingLabWorks: 0,
        receivedLabWorks: 0,
        fittedLabWorks: 0,
        cancelledLabWorks: 0,
        reworkLabWorks: 0,
        labWorkByType: {},
        labWorkByLab: {},
        monthlyLabWorks: {},
        averageTurnaroundTime: 0,
      };
    }

    // Calculate basic statistics
    let totalLabWorks = 0;
    let pendingLabWorks = 0;
    let receivedLabWorks = 0;
    let fittedLabWorks = 0;
    let cancelledLabWorks = 0;
    let reworkLabWorks = 0;
    const labWorkByType: Record<string, number> = {};
    const labWorkByLab: Record<string, number> = {};
    const monthlyLabWorks: Record<string, number> = {};
    let totalTurnaroundTime = 0;
    let completedLabWorks = 0;

    labWorks.forEach((labWork) => {
      totalLabWorks += 1;

      // Count by status
      switch (labWork.status) {
        case "Pending":
          pendingLabWorks++;
          break;
        case "Received":
          receivedLabWorks++;
          break;
        case "Fitted":
          fittedLabWorks++;
          break;
        case "Cancelled":
          cancelledLabWorks++;
          break;
        case "Rework":
          reworkLabWorks++;
          break;
      }

      // Aggregate by order type
      const orderType = labWork.orderType;
      labWorkByType[orderType] = (labWorkByType[orderType] || 0) + 1;

      // Aggregate by lab name
      const labName = labWork.labName;
      labWorkByLab[labName] = (labWorkByLab[labName] || 0) + 1;

      // Aggregate monthly lab works
      const createdAt = new Date(labWork.createdAt);
      const month = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, "0")}`;
      monthlyLabWorks[month] = (monthlyLabWorks[month] || 0) + 1;

      // Calculate turnaround time for completed lab works
      if (labWork.status === "Fitted" && labWork.sentToLabOn && labWork.fittedOn) {
        const sentDate = new Date(labWork.sentToLabOn);
        const fittedDate = new Date(labWork.fittedOn);
        const turnaroundTime = Math.ceil((fittedDate.getTime() - sentDate.getTime()) / (1000 * 60 * 60 * 24));
        totalTurnaroundTime += turnaroundTime;
        completedLabWorks += 1;
      }
    });

    // Calculate average turnaround time
    const averageTurnaroundTime = completedLabWorks > 0 ? totalTurnaroundTime / completedLabWorks : 0;

    return {
      totalLabWorks,
      pendingLabWorks,
      receivedLabWorks,
      fittedLabWorks,
      cancelledLabWorks,
      reworkLabWorks,
      labWorkByType,
      labWorkByLab,
      monthlyLabWorks,
      averageTurnaroundTime,
    };
  } catch (error: unknown) {
    console.error("Error fetching doctor lab work analytics:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to fetch lab work analytics: ${error.message}`);
    }
    throw new Error("Unknown error occurred while fetching lab work analytics");
  }
}

/**
 * Server-side function to get lab work records filtered by date range
 * @param doctorUserId - The user ID of the doctor
 * @param startDate - Start date for filtering
 * @param endDate - End date for filtering
 * @returns Promise<LabWork[]>
 */
export async function getLabWorksByDateRange(
  doctorUserId: string,
  startDate: Date,
  endDate: Date
) {
  try {
    await dbConnect();

    // Find the doctor document using the doctor.userId field
    const doctor = await DoctorModel.findOne({ userId: doctorUserId });
    if (!doctor || Array.isArray(doctor) || !doctor._id) {
      throw new Error("Doctor not found");
    }

    // Fetch lab work records within the date range
    const labWorks = await LabWorkModel.find({
      doctorId: doctor._id,
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
    })
      .populate("patientId", "fullName PatientId")
      .sort({ createdAt: -1 })
      .lean(); // Use lean() to get plain objects instead of Mongoose documents

    // Convert Date objects to strings for Redux compatibility
    return labWorks.map(labWork => {
      if (labWork.impressionsTakenOn && labWork.impressionsTakenOn instanceof Date) {
        labWork.impressionsTakenOn = formatDateForServer(labWork.impressionsTakenOn);
      }
      if (labWork.sentToLabOn && labWork.sentToLabOn instanceof Date) {
        labWork.sentToLabOn = formatDateForServer(labWork.sentToLabOn);
      }
      if (labWork.receivedFromLabOn && labWork.receivedFromLabOn instanceof Date) {
        labWork.receivedFromLabOn = formatDateForServer(labWork.receivedFromLabOn);
      }
      if (labWork.fittedOn && labWork.fittedOn instanceof Date) {
        labWork.fittedOn = formatDateForServer(labWork.fittedOn);
      }
      if (labWork.expectedDeliveryDate && labWork.expectedDeliveryDate instanceof Date) {
        labWork.expectedDeliveryDate = formatDateForServer(labWork.expectedDeliveryDate);
      }
      if (labWork.reWorkSentDate && labWork.reWorkSentDate instanceof Date) {
        labWork.reWorkSentDate = formatDateForServer(labWork.reWorkSentDate);
      }
      return labWork;
    });
  } catch (error: unknown) {
    console.error("Error fetching lab works by date range:", error);
    if (error instanceof Error) {
      throw new Error(
        `Failed to fetch lab works by date range: ${error.message}`
      );
    }
    throw new Error(
      "Unknown error occurred while fetching lab works by date range"
    );
  }
}

// Type definitions for lab work analytics
export interface LabWorkAnalytics {
  totalLabWorks: number;
  pendingLabWorks: number;
  receivedLabWorks: number;
  fittedLabWorks: number;
  cancelledLabWorks: number;
  reworkLabWorks: number;
  labWorkByType: Record<string, number>;
  labWorkByLab: Record<string, number>;
  monthlyLabWorks: Record<string, number>;
  averageTurnaroundTime: number;
}