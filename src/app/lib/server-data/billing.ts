import dbConnect from "@/app/utils/dbConnect";
import BillingModel from "@/app/model/Billing.model";
import PatientModel from "@/app/model/Patient.model";
import DoctorModel from "@/app/model/Doctor.model";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

/**
 * Server-side function to fetch billing records for a doctor
 * @param doctorUserId - The user ID of the doctor
 * @returns Promise<BillingRecord[]>
 */
export async function getDoctorBillingRecords(doctorUserId: string) {
  try {
    await dbConnect();

    // Find the doctor document using the doctor.userId field
    const doctor = await DoctorModel.findOne({ userId: doctorUserId });
    if (!doctor || Array.isArray(doctor) || !doctor._id) {
      throw new Error("Doctor not found");
    }

    // Fetch billing records associated with the doctor's _id
    const billings = await BillingModel.find({ doctorId: doctor._id })
      .populate("patientId", "fullName")
      .sort({ date: -1, createdAt: -1 });

    // Convert to plain objects to avoid circular reference issues in SSR
    return billings.map((billing) => {
      const plainObj = billing.toObject();
      // Remove any Buffer objects and convert to plain strings
      if (plainObj._id && plainObj._id.toString) {
        plainObj._id = plainObj._id.toString();
      }
      if (plainObj.doctorId && plainObj.doctorId._id) {
        plainObj.doctorId = plainObj.doctorId._id.toString();
      }
      if (plainObj.patientId && plainObj.patientId._id) {
        plainObj.patientId = plainObj.patientId._id.toString();
      }
      return plainObj;
    });
  } catch (error: unknown) {
    console.error("Error fetching doctor billing records:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to fetch billing records: ${error.message}`);
    }
    throw new Error("Unknown error occurred while fetching billing records");
  }
}

/**
 * Server-side function to fetch billing records for a patient
 * @param patientUserId - The user ID of the patient
 * @returns Promise<BillingRecord[]>
 */
export async function getPatientBillingRecords(patientUserId: string) {
  try {
    await dbConnect();

    // Find the patient document using the patient.userId field
    const patient = await PatientModel.findOne({ userId: patientUserId });
    if (!patient || Array.isArray(patient) || !patient._id) {
      throw new Error("Patient not found");
    }

    // Fetch billing records associated with the patient's _id
    const billings = await BillingModel.find({ patientId: patient._id })
      .populate("doctorId", "fullName")
      .sort({ date: -1, createdAt: -1 });

    return billings;
  } catch (error: unknown) {
    console.error("Error fetching patient billing records:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to fetch billing records: ${error.message}`);
    }
    throw new Error("Unknown error occurred while fetching billing records");
  }
}

/**
 * Server-side function to get comprehensive billing analytics for a doctor
 * @param doctorUserId - The user ID of the doctor
 * @returns Promise<RevenueStats>
 */
export async function getDoctorBillingAnalytics(doctorUserId: string) {
  try {
    await dbConnect();

    // Find the doctor document using the doctor.userId field
    const doctor = await DoctorModel.findOne({ userId: doctorUserId });
    if (!doctor || Array.isArray(doctor) || !doctor._id) {
      throw new Error("Doctor not found");
    }

    // Fetch all billing records for the doctor
    const billings = await BillingModel.find({ doctorId: doctor._id }).populate(
      "patientId",
      "fullName",
    );

    if (!billings || billings.length === 0) {
      return {
        totalRevenue: 0,
        totalReceived: 0,
        totalDue: 0,
        averageInvoice: 0,
        averageDiscount: 0,
        invoiceCount: 0,
        paidInvoices: 0,
        pendingInvoices: 0,
        revenueByPaymentMode: {},
        monthlyRevenue: {},
        topPatients: [],
        revenueGrowth: 0,
        collectionEfficiency: 0,
      };
    }

    // Calculate basic statistics
    let totalRevenue = 0;
    let totalReceived = 0;
    let totalDue = 0;
    let totalDiscount = 0;
    let invoiceCount = 0;
    let paidInvoices = 0;
    let pendingInvoices = 0;
    const revenueByPaymentMode: Record<string, number> = {};
    const monthlyRevenue: Record<string, number> = {};
    const patientRevenue: Record<string, number> = {};

    // Current period (last 30 days) and previous period for growth calculation
    const now = new Date();
    const currentPeriodStart = subMonths(now, 1);
    const previousPeriodStart = subMonths(now, 2);
    const previousPeriodEnd = subMonths(now, 1);

    let currentPeriodRevenue = 0;
    let previousPeriodRevenue = 0;

    billings.forEach((billing) => {
      const billingDate = new Date(billing.date);
      totalRevenue += billing.totalAmount;
      totalReceived += billing.amountReceived;
      totalDue += billing.amountDue;
      totalDiscount += billing.discount || 0;
      invoiceCount += 1;

      // Count invoices by status
      if (billing.status === "Paid") paidInvoices++;
      else if (billing.status === "Pending") pendingInvoices++;

      // Aggregate revenue by payment mode
      const mode = billing.modeOfPayment;
      revenueByPaymentMode[mode] =
        (revenueByPaymentMode[mode] || 0) + billing.totalAmount;

      // Aggregate monthly revenue
      const month = format(billingDate, "yyyy-MM");
      monthlyRevenue[month] =
        (monthlyRevenue[month] || 0) + billing.totalAmount;

      // Aggregate by patient
      if (
        billing.patientId &&
        typeof billing.patientId === "object" &&
        "fullName" in billing.patientId
      ) {
        const patientName = billing.patientId.fullName;

        if (patientName) {
          patientRevenue[patientName] =
            (patientRevenue[patientName] || 0) + billing.totalAmount;
        }
      }

      // Calculate growth periods
      if (billingDate >= currentPeriodStart && billingDate <= now) {
        currentPeriodRevenue += billing.totalAmount;
      }
      if (
        billingDate >= previousPeriodStart &&
        billingDate < previousPeriodEnd
      ) {
        previousPeriodRevenue += billing.totalAmount;
      }
    });

    // Calculate growth percentage
    const revenueGrowth =
      previousPeriodRevenue > 0
        ? ((currentPeriodRevenue - previousPeriodRevenue) /
            previousPeriodRevenue) *
          100
        : 0;

    // Calculate collection efficiency
    const collectionEfficiency =
      totalRevenue > 0 ? (totalReceived / totalRevenue) * 100 : 0;

    // Get top 5 patients by revenue
    const topPatients = Object.entries(patientRevenue)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([patientName, revenue]) => ({ patientName, revenue }));

    return {
      totalRevenue,
      totalReceived,
      totalDue,
      averageInvoice: invoiceCount ? totalRevenue / invoiceCount : 0,
      averageDiscount: invoiceCount ? totalDiscount / invoiceCount : 0,
      invoiceCount,
      paidInvoices,
      pendingInvoices,
      revenueByPaymentMode,
      monthlyRevenue,
      topPatients,
      revenueGrowth,
      collectionEfficiency,
    };
  } catch (error: unknown) {
    console.error("Error fetching doctor billing analytics:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to fetch billing analytics: ${error.message}`);
    }
    throw new Error("Unknown error occurred while fetching billing analytics");
  }
}

/**
 * Server-side function to get billing records filtered by date range
 * @param doctorUserId - The user ID of the doctor
 * @param startDate - Start date for filtering
 * @param endDate - End date for filtering
 * @returns Promise<BillingRecord[]>
 */
export async function getBillingRecordsByDateRange(
  doctorUserId: string,
  startDate: Date,
  endDate: Date,
) {
  try {
    await dbConnect();

    // Find the doctor document using the doctor.userId field
    const doctor = await DoctorModel.findOne({ userId: doctorUserId });
    if (!doctor || Array.isArray(doctor) || !doctor._id) {
      throw new Error("Doctor not found");
    }

    // Fetch billing records within the date range
    const billings = await BillingModel.find({
      doctorId: doctor._id,
      date: {
        $gte: startOfMonth(startDate),
        $lte: endOfMonth(endDate),
      },
    })
      .populate("patientId", "fullName PatientId")
      .sort({ date: -1, createdAt: -1 });

    return billings;
  } catch (error: unknown) {
    console.error("Error fetching billing records by date range:", error);
    if (error instanceof Error) {
      throw new Error(
        `Failed to fetch billing records by date range: ${error.message}`,
      );
    }
    throw new Error(
      "Unknown error occurred while fetching billing records by date range",
    );
  }
}

/**
 * Server-side function to get billing summary for a specific month
 * @param doctorUserId - The user ID of the doctor
 * @param year - Year for the summary
 * @param month - Month for the summary (1-12)
 * @returns Promise<{ totalRevenue: number, totalReceived: number, totalDue: number, invoiceCount: number }>
 */
export async function getMonthlyBillingSummary(
  doctorUserId: string,
  year: number,
  month: number,
) {
  try {
    await dbConnect();

    // Find the doctor document using the doctor.userId field
    const doctor = await DoctorModel.findOne({ userId: doctorUserId });
    if (!doctor) {
      throw new Error("Doctor not found");
    }

    // Calculate start and end dates for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Fetch billing records for the month
    const billings = await BillingModel.find({
      doctorId: doctor._id,
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    });

    // Calculate summary
    const totalRevenue = billings.reduce(
      (sum, billing) => sum + billing.totalAmount,
      0,
    );
    const totalReceived = billings.reduce(
      (sum, billing) => sum + billing.amountReceived,
      0,
    );
    const totalDue = billings.reduce(
      (sum, billing) => sum + billing.amountDue,
      0,
    );
    const invoiceCount = billings.length;

    return {
      totalRevenue,
      totalReceived,
      totalDue,
      invoiceCount,
    };
  } catch (error: unknown) {
    console.error("Error fetching monthly billing summary:", error);
    if (error instanceof Error) {
      throw new Error(
        `Failed to fetch monthly billing summary: ${error.message}`,
      );
    }
    throw new Error(
      "Unknown error occurred while fetching monthly billing summary",
    );
  }
}

// Type definitions for the analytics
export interface RevenueStats {
  totalRevenue: number;
  totalReceived: number;
  totalDue: number;
  averageInvoice: number;
  averageDiscount: number;
  invoiceCount: number;
  paidInvoices: number;
  pendingInvoices: number;
  revenueByPaymentMode: Record<string, number>;
  monthlyRevenue: Record<string, number>;
  topPatients: Array<{ patientName: string; revenue: number }>;
  revenueGrowth: number;
  collectionEfficiency: number;
}
