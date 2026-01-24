"use client";

import DashboardCards, { Stat } from "@/app/dashboard/ui/DashboardCards";
import {
  Appointment,
  fetchAppointments,
  selectAppointments,
} from "@/app/redux/slices/appointmentSlice";
import {
  BillingRecord,
  fetchBillings,
  selectBillings,
} from "@/app/redux/slices/billingSlice";
import { fetchPatients, Patient } from "@/app/redux/slices/patientSlice";
import { useAppDispatch, useAppSelector } from "@/app/redux/store/hooks";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  AlertOctagon,
  ArrowDownCircle,
  Calendar,
  CalendarDays,
  ClipboardList,
  Clock,
  CreditCard,
  Edit,
  FileClock,
  FileText,
  FlaskConical,
  Hash,
  IndianRupee,
  Info,
  Mail,
  MapPin,
  Percent,
  Pill,
  Printer,
  ReceiptText,
  Smile,
  Stethoscope,
  StickyNote,
  Tag,
  Trash,
  Wallet,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import TwoLineDashboardChart from "../TwoLineDashboardChart";

import DataTable from "../DataTable";
import { format } from "date-fns";
import EditPatientModal from "../EditPatientModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ContactInfo from "../ContactInfo";
import SectionHeader from "../SectionHeader";
import { DialogFooterActions } from "../DialogFooterActions";
import DeletePatientModal from "../DeletePatientModal";
import {
  fetchLabWorks,
  ILabWork,
  selectAllLabWorks,
} from "@/app/redux/slices/labWorkSlice";
import IconButtonWithTooltip from "../IconButtonWithTooltip";

// ... existing imports ...
interface PatientDetailViewProps {
  patient: Patient;
  onPatientUpdated: (updatedPatient: Patient) => void;
}

// New component for Patient Detail View
const PatientDetailView = ({
  patient,
  onPatientUpdated,
}: PatientDetailViewProps) => {
  const [timeFrame, setTimeFrame] = useState<"monthly" | "yearly">("monthly");
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [openSelectedAppointment, setOpenSelectedAppointment] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState<BillingRecord | null>(
    null
  );
  const [openSelectedBilling, setOpenSelectedBilling] = useState(false);

  const [selectedLabwork, setSelectedLabwork] = useState<ILabWork | null>(null);
  const [openSelectedLabwork, setOpenSelectedLabwork] = useState(false);
  const [openStatDialog, setOpenStatDialog] = useState<null | string>(null);

  const { data: session } = useSession();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const appointments = useAppSelector(selectAppointments);
  const billings = useAppSelector(selectBillings);
  const labWorks = useAppSelector(selectAllLabWorks);

  const appointmentDialogRef = useRef<HTMLDivElement>(null);
  const billingDialogRef = useRef<HTMLDivElement>(null);
  const labworkDialogRef = useRef<HTMLDivElement>(null);

  // Safe date formatting utility functions
  const safeFormatDate = (dateValue: unknown): string => {
    if (!dateValue) return "N/A";

    try {
      if (dateValue instanceof Date) {
        return dateValue.toLocaleDateString();
      }

      if (typeof dateValue === "string" || typeof dateValue === "number") {
        const date = new Date(dateValue);
        return isNaN(date.getTime()) ? "N/A" : date.toLocaleDateString();
      }

      return "N/A";
    } catch {
      return "N/A";
    }
  };

  const { patientAppointments, patientBillings, patientLabworks, stats } =
    useMemo(() => {
      const patientAppointments = appointments.filter(
        (appointment) => appointment.patient === patient._id
      );

      const patientBillings = billings.filter(
        (billing) => billing.patientId === patient._id
      );

      // ✅ Filter labworks for the current patient
      const patientLabworks = labWorks.filter(
        (labwork) => labwork.patientId?._id === patient._id
      );

      const upcomingAppointments = patientAppointments.filter(
        (app) =>
          new Date(app.appointmentDate) >= new Date() &&
          app.status !== "Completed" &&
          app.status !== "Cancelled"
      );

      const totalTreatments = patientBillings.reduce(
        (total, billing) => total + (billing.treatments?.length || 0),
        0
      );

      const stats: Stat[] = [
        {
          title: "Upcoming Appointments",
          value: upcomingAppointments.length.toString(),
          icon: <Calendar size={24} />,
          color: "bg-blue-500",
          onClickFunction: () => setOpenStatDialog("Upcoming Appointments"),
        },
        {
          title: "Medical History",
          value: (patient.medicalHistory?.length || 0).toString(),
          icon: <FileText size={24} />,
          color: "bg-purple-500",
          onClickFunction: () => setOpenStatDialog("Medical History"),
        },
        {
          title: "Active Medications",
          value: (patient.currentMedications?.length || 0).toString(),
          icon: <Pill size={24} />,
          color: "bg-red-500",
          onClickFunction: () => setOpenStatDialog("Active Medications"),
        },
        {
          title: "Total Treatments",
          value: totalTreatments.toString(),
          icon: <Stethoscope size={24} />,
          color: "bg-green-500",
          onClickFunction: () => setOpenStatDialog("Total Treatments"),
        },
      ];

      return { patientAppointments, patientBillings, patientLabworks, stats };
    }, [appointments, billings, labWorks, patient]);

  const processChartData = (
    patientAppointments: Appointment[],
    patientBillings: BillingRecord[],
    timeFrame: "monthly" | "yearly"
  ) => {
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return timeFrame === "yearly"
        ? `${date.getFullYear()}`
        : `${date.getFullYear()}-${(date.getMonth() + 1)
          .toString()
          .padStart(2, "0")}`;
    };

    // Process appointments
    const appointmentCounts = patientAppointments.reduce<
      Record<string, number>
    >((acc, appointment) => {
      const month = formatDate(appointment.appointmentDate);
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});

    // Process treatments from billings
    const treatmentCounts = patientBillings.reduce<Record<string, number>>(
      (acc, billing) => {
        const month = formatDate(billing.date);
        const treatmentsCount = billing.treatments?.length || 0;
        acc[month] = (acc[month] || 0) + treatmentsCount;
        return acc;
      },
      {}
    );

    // Combine data
    const allMonths = Array.from(
      new Set([
        ...Object.keys(appointmentCounts),
        ...Object.keys(treatmentCounts),
      ])
    ).sort();

    return allMonths.map((month) => ({
      date: month,
      appointments: appointmentCounts[month] || 0,
      treatments: treatmentCounts[month] || 0,
    }));
  };

  const handleOpenModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setOpenSelectedAppointment(true);
  };

  const handleOpenLabworkModal = (labwork: ILabWork) => {
    setSelectedLabwork(labwork);
    setOpenSelectedLabwork(true);
  };

  const openEditModal = () => setEditModalOpen(true);
  const closeEditModal = () => setEditModalOpen(false);

  const openDeleteModal = () => {
    setIsDeleteModalOpen(true);
  };
  const closeDeleteModal = () => setIsDeleteModalOpen(false);

  return (
    <>
      {/* Patient Header Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-start">
          <h1 className="text-2xl font-bold text-gray-800">
            {patient.fullName}
          </h1>
          <div className="flex gap-3">
            <div onClick={openEditModal}>
              <IconButtonWithTooltip
                href="#"
                hoverBgColor="#38bdf8"
                tooltip="Edit"
                icon={<Edit size={16} />}
              />
            </div>

            <div onClick={openDeleteModal}>
              <IconButtonWithTooltip
                href="#"
                hoverBgColor="#f87171"
                tooltip="Delete"
                icon={<Trash size={16} />}
              />
            </div>
          </div>
        </div>

        {/* Patient Metadata Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4 text-sm">
          <div>
            <span className="text-gray-500">Contact:</span>{" "}
            {patient.contactNumber || "NA"}
          </div>
          <div>
            <span className="text-gray-500">Gender:</span>{" "}
            {patient.gender || "NA"}
          </div>
          <div>
            <span className="text-gray-500">Age:</span>{" "}
            {patient.age || "NA"}
          </div>
          <div>
            <span className="text-gray-500">DOB:</span>{" "}
            {patient.dateOfBirth
              ? new Date(patient.dateOfBirth).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
              : "NA"}{" "}
          </div>
          <div>
            <span className="text-gray-500">Patient ID:</span>{" "}
            {patient.PatientId}
          </div>
        </div>
      </div>

      <DashboardCards stats={stats} />

      {/* Contact Information Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TwoLineDashboardChart
          data={processChartData(
            patientAppointments,
            patientBillings,
            timeFrame
          )}
          timeFrame={timeFrame}
          setTimeFrame={setTimeFrame}
        />
        <div className="bg-white p-6 rounded-lg shadow-sm flex flex-col gap-y-5">
          <ContactInfo
            icon={<Mail className="text-blue-500" size={20} />}
            title="Email"
            content={patient.email || "NA"}
          />
          <ContactInfo
            icon={<MapPin className="text-green-500" size={20} />}
            title="Address"
            content={`${patient.address?.street}, ${patient.address?.city}, ${patient.address?.state} - ${patient.address?.postalCode}`}
          />
          <ContactInfo
            icon={<AlertOctagon className="text-red-500" size={20} />}
            title="Emergency Contacts"
            content={`${patient.emergencyContact?.fullName} (${patient.emergencyContact?.relationship}): ${patient.emergencyContact?.contactNumber}`}
          />
        </div>
      </div>

      {/* Appointment History Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <SectionHeader
          icon={<Calendar className="text-purple-500" size={20} />}
          title="Appointments"
        />
        <DataTable<Appointment>
          data={patientAppointments}
          title=""
          showSearch={false}
          itemsPerPage={10}
          searchFields={["appointmentDate", "status"]}
          columns={[
            {
              header: "Date",
              accessorKey: "appointmentDate",
              sortable: true,
              render: (v) =>
                typeof v === "string" || typeof v === "number"
                  ? new Date(v).toLocaleDateString()
                  : "N/A",
            },
            {
              header: "Time",
              accessorKey: "timeSlot",
              sortable: true,
            },
            {
              header: "Teeth",
              accessorKey: "teeth",
              render: (v) => (Array.isArray(v) ? v.join(", ") : "N/A"),
            },
            {
              header: "Type",
              accessorKey: "consultationType",
              render: (v) => v || "N/A",
            },
            {
              header: "Status",
              accessorKey: "status",
              render: (v) => v || "N/A",
            },
            {
              header: "Notes",
              accessorKey: "notes",
              render: (v) => v || "N/A",
            },
            {
              header: "Actions",
              accessorKey: "_id",
              render: (_, row) => (
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenModal(row);
                  }}
                >
                  View
                </Button>
              ),
            },
          ]}
        />
      </div>

      {/* Billing History Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <SectionHeader
          icon={<IndianRupee className="text-green-500" size={20} />}
          title="Billings"
        />
        <DataTable<BillingRecord>
          data={patientBillings}
          // ... same billing table config ...
          title=""
          showSearch={false}
          itemsPerPage={10}
          searchFields={["date", "treatments"]}
          columns={[
            {
              header: "Date",
              accessorKey: "date",
              sortable: true,
              render: (v) =>
                typeof v === "string" || typeof v === "number"
                  ? new Date(v).toLocaleDateString()
                  : "N/A",
            },
            {
              header: "Treatments",
              accessorKey: "treatments",
              sortable: true,
              render: (v) =>
                Array.isArray(v) ? v.map((t) => t.treatment).join(", ") : "N/A",
            },
            {
              header: "Amount",
              accessorKey: "totalAmount",
              render: (v) => (typeof v === "number" ? v.toFixed(2) : "N/A"),
            },
            {
              header: "Discount",
              accessorKey: "discount",
            },
            {
              header: "Mode of Payment",
              accessorKey: "modeOfPayment",
            },
            {
              header: "Actions",
              accessorKey: "_id",
              render: (_, row) => (
                <>
                  <div
                    className="flex space-x-2"
                    onClick={(e) => e.stopPropagation()} // Stop row click
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedBilling(row);
                        setOpenSelectedBilling(true);
                      }}
                    >
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const formattedRow = {
                          ...row,
                          date: format(new Date(row.date), "dd MMM yyyy"),
                          patientName: patient?.fullName || "",
                          contactNumber: patient?.contactNumber || "",
                          gender: patient?.gender || "",
                          email: patient?.email,
                        };

                        // Arrow function to sanitize null/undefined

                        const sanitizeFormData = <
                          T extends Record<string, unknown>
                        >(
                          data: T
                        ): Partial<T> =>
                          Object.fromEntries(
                            Object.entries(data).filter(
                              ([, value]) =>
                                value !== null && value !== undefined
                            )
                          ) as Partial<T>;

                        const sanitizedData = sanitizeFormData(formattedRow);

                        sessionStorage.setItem(
                          "formData",
                          JSON.stringify(sanitizedData)
                        );

                        router.push(
                          "/dashboard/pages/Doctor/patientBilling/invoice"
                        );
                      }}
                    >
                      <Printer size={16} />
                    </Button>
                  </div>
                </>
              ),
            },
          ]}
        />
      </div>

      {/* Labworks Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <SectionHeader
          icon={<FlaskConical className="text-orange-500" size={20} />} // or Beaker / TestTube from lucide-react
          title="Labworks"
        />

        <DataTable<ILabWork>
          data={patientLabworks}
          title=""
          showSearch={false}
          itemsPerPage={10}
          searchFields={["orderType", "status", "labName", "material"]}
          columns={[
            {
              header: "Lab Name",
              accessorKey: "labName",
              sortable: true,
            },
            {
              header: "Order Type",
              accessorKey: "orderType",
              sortable: true,
            },
            {
              header: "Material",
              accessorKey: "material",
            },
            {
              header: "Shade",
              accessorKey: "shade",
            },
            {
              header: "Tooth Numbers",
              accessorKey: "toothNumbers",
              render: (v) => (Array.isArray(v) ? v.join(", ") : "N/A"),
            },
            {
              header: "Impressions Taken On",
              accessorKey: "impressionsTakenOn",
              sortable: true,
              render: (v) => safeFormatDate(v),
            },
            {
              header: "Expected Delivery",
              accessorKey: "expectedDeliveryDate",
              sortable: true,
              render: (v) => safeFormatDate(v),
            },
            {
              header: "Status",
              accessorKey: "status",
              render: (v) => {
                const statusValue = typeof v === "string" ? v : "N/A";
                return (
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${v === "Pending"
                      ? "bg-yellow-100 text-yellow-700"
                      : v === "Received"
                        ? "bg-blue-100 text-blue-700"
                        : v === "Fitted"
                          ? "bg-green-100 text-green-700"
                          : v === "Rework"
                            ? "bg-orange-100 text-orange-700"
                            : v === "Cancelled"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-700"
                      }`}
                  >
                    {statusValue}
                  </span>
                );
              },
            },
            {
              header: "Actions",
              accessorKey: "_id",
              render: (_, row) => (
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenLabworkModal(row);
                  }}
                >
                  View
                </Button>
              ),
            },
          ]}
        />
      </div>

      {/* Delete Patient Modal */}
      <DeletePatientModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        patient={patient}
        onPatientDeleted={() => {
          if (session?.user.id) {
            dispatch(
              fetchPatients({ userId: session.user.id, role: "Doctor" })
            );
            dispatch(
              fetchAppointments({ userId: session.user.id, role: "Doctor" })
            );
            dispatch(
              fetchBillings({ userId: session.user.id, role: "Doctor" })
            );
            dispatch(
              fetchLabWorks({ userId: session.user.id, role: "Doctor" })
            );
          }
        }}
      />

      {/* Edit Patient Modal */}
      <EditPatientModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        patient={patient}
        onPatientUpdated={(updatedPatient: Patient) => {
          onPatientUpdated(updatedPatient);
          if (session?.user.id) {
            dispatch(
              fetchPatients({ userId: session.user.id, role: "Doctor" })
            );
          }
        }}
      />

      {/* Appointment Details Dialog  */}

      <Dialog
        open={openSelectedAppointment}
        onOpenChange={setOpenSelectedAppointment}
      >
        <DialogContent
          ref={appointmentDialogRef}
          className="max-w-2xl animate-fade-in"
        >
          <DialogTitle className="text-2xl font-bold mb-4">
            <ClipboardList className="inline-block mr-2 h-6 w-6" />
            Appointment Details
          </DialogTitle>

          {selectedAppointment ? (
            <>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {/* Appointment ID */}
                <div className="flex items-start gap-2 col-span-2">
                  <Hash className="h-5 w-5 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-muted-foreground">Appointment ID</p>
                    <p className="font-medium">
                      {selectedAppointment._id.slice(-5)}
                    </p>
                  </div>
                </div>

                {/* Date */}
                <div className="flex items-start gap-2">
                  <CalendarDays className="h-5 w-5 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-muted-foreground">Date</p>
                    <p className="font-medium">
                      {new Date(
                        selectedAppointment.appointmentDate
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Time */}
                <div className="flex items-start gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-muted-foreground">Time</p>
                    <p className="font-medium">
                      {selectedAppointment.timeSlot}
                    </p>
                  </div>
                </div>

                {/* Teeth */}
                <div className="flex items-start gap-2">
                  <Smile className="h-5 w-5 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-muted-foreground">Teeth</p>
                    <p className="font-medium">
                      {selectedAppointment.teeth?.join(", ") || "N/A"}
                    </p>
                  </div>
                </div>

                {/* Consultation Type */}
                <div className="flex items-start gap-2">
                  <FileText className="h-5 w-5 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-muted-foreground">Consultation Type</p>
                    <p className="font-medium">
                      {selectedAppointment.consultationType || "N/A"}
                    </p>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-start gap-2">
                  <Info className="h-5 w-5 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <p className="capitalize font-bold">
                      {selectedAppointment.status}
                    </p>
                  </div>
                </div>

                {/* Payment Status */}
                <div className="flex items-start gap-2">
                  <IndianRupee className="h-5 w-5 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-muted-foreground">Payment</p>
                    <p className="capitalize font-bold">
                      {selectedAppointment.paymentStatus}
                    </p>
                  </div>
                </div>

                {/* Treatments */}
                <div className="flex items-start gap-2 col-span-2">
                  <Tag className="h-5 w-5 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-muted-foreground">Treatments</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedAppointment ? (
                        selectedAppointment.treatments!.map(
                          (treatment: string) => (
                            <p key={treatment} className="font-bold">
                              {treatment},
                            </p>
                          )
                        )
                      ) : (
                        <p className="font-medium">N/A</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="flex items-start gap-2 col-span-2">
                  <StickyNote className="h-5 w-5 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-muted-foreground">Notes</p>
                    <p className="font-medium">
                      {selectedAppointment.notes || "N/A"}
                    </p>
                  </div>
                </div>

                {/* Created At */}
                <div className="flex items-start gap-2 no-capture">
                  <FileClock className="h-5 w-5 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-muted-foreground">Created At</p>
                    <p className="font-medium">
                      {new Date(selectedAppointment.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Updated At */}
                <div className="flex items-start gap-2 no-capture">
                  <FileClock className="h-5 w-5 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-muted-foreground">Updated At</p>
                    <p className="font-medium">
                      {new Date(selectedAppointment.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              <DialogFooterActions
                captureRef={appointmentDialogRef}
                className="no-capture"
              />
            </>
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              No appointment selected.
            </p>
          )}
        </DialogContent>
      </Dialog>

      {/* Billing Details Dialog */}

      <Dialog open={openSelectedBilling} onOpenChange={setOpenSelectedBilling}>
        <DialogContent
          ref={billingDialogRef}
          className="max-w-2xl animate-fade-in"
        >
          <DialogTitle className="text-2xl font-bold mb-4">
            <ReceiptText className="inline-block mr-2 h-6 w-6" />
            Billing Details
          </DialogTitle>

          {selectedBilling ? (
            <>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {/* Date */}
                <div className="flex items-start gap-2">
                  <CalendarDays className="h-5 w-5 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-muted-foreground">Date</p>
                    <p className="font-medium">
                      {new Date(selectedBilling.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Invoice ID */}
                <div className="flex items-start gap-2">
                  <FileText className="h-5 w-5 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-muted-foreground">Invoice ID</p>
                    <p className="font-medium">{selectedBilling.invoiceId}</p>
                  </div>
                </div>

                {/* Treatments */}
                <div className="flex items-start gap-2 col-span-2">
                  <ReceiptText className="h-5 w-5 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-muted-foreground">Treatments</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedBilling.treatments?.map((t, idx) => (
                        <p key={idx} className="font-bold">
                          {t.treatment} (₹{t.price} * {t.quantity})
                        </p>
                      )) || "N/A"}
                    </div>
                  </div>
                </div>

                {/* Amount Before Discount */}
                <div className="flex items-start gap-2">
                  <IndianRupee className="h-5 w-5 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-muted-foreground">
                      Amount Before Discount
                    </p>
                    <p className="font-medium">
                      ₹{selectedBilling.amountBeforeDiscount?.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Discount */}
                <div className="flex items-start gap-2">
                  <Percent className="h-5 w-5 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-muted-foreground">Discount</p>
                    <p className="font-medium">
                      ₹{selectedBilling.discount || 0}
                    </p>
                  </div>
                </div>

                {/* Total Amount */}
                <div className="flex items-start gap-2">
                  <Wallet className="h-5 w-5 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-muted-foreground">Total Amount</p>
                    <p className="font-medium">
                      ₹{selectedBilling.totalAmount.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Amount Received */}
                <div className="flex items-start gap-2">
                  <ArrowDownCircle className="h-5 w-5 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-muted-foreground">Amount Received</p>
                    <p className="font-medium">
                      ₹{selectedBilling.amountReceived?.toFixed(2) || 0}
                    </p>
                  </div>
                </div>

                {/* Amount Due */}
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-muted-foreground">Amount Due</p>
                    <p
                      className={`font-medium ${selectedBilling.amountDue < 0 ? "text-red-500" : ""
                        }`}
                    >
                      ₹{selectedBilling.amountDue?.toFixed(2) || 0}
                    </p>
                  </div>
                </div>

                {/* Mode of Payment */}
                <div className="flex items-start gap-2">
                  <CreditCard className="h-5 w-5 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-muted-foreground">Mode of Payment</p>
                    <p className="font-medium">
                      {selectedBilling.modeOfPayment || "N/A"}
                    </p>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-start gap-2 col-span-2">
                  <ClipboardList className="h-5 w-5 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <p className="capitalize font-bold">
                      {selectedBilling.status}
                    </p>
                  </div>
                </div>
              </div>
              <DialogFooterActions
                captureRef={billingDialogRef}
                className="no-capture"
              />
            </>
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              No billing selected.
            </p>
          )}
        </DialogContent>
      </Dialog>

      {/* Labwork Details Dialog */}
      <Dialog open={openSelectedLabwork} onOpenChange={setOpenSelectedLabwork}>
        <DialogContent
          ref={labworkDialogRef}
          className="max-w-2xl animate-fade-in"
        >
          <DialogTitle className="text-2xl font-bold mb-4">
            <FlaskConical className="inline-block mr-2 h-6 w-6" />
            Labwork Details
          </DialogTitle>

          {selectedLabwork ? (
            <>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {/* Lab Name */}
                <div className="flex items-start gap-2">
                  <FlaskConical className="h-5 w-5 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-muted-foreground">Lab Name</p>
                    <p className="font-medium">
                      {selectedLabwork.labName || "N/A"}
                    </p>
                  </div>
                </div>

                {/* Order Type */}
                <div className="flex items-start gap-2">
                  <ClipboardList className="h-5 w-5 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-muted-foreground">Order Type</p>
                    <p className="font-medium">
                      {selectedLabwork.orderType || "N/A"}
                    </p>
                  </div>
                </div>

                {/* Material */}
                <div className="flex items-start gap-2">
                  <Tag className="h-5 w-5 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-muted-foreground">Material</p>
                    <p className="font-medium">
                      {selectedLabwork.material || "N/A"}
                    </p>
                  </div>
                </div>

                {/* Shade */}
                <div className="flex items-start gap-2">
                  <StickyNote className="h-5 w-5 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-muted-foreground">Shade</p>
                    <p className="font-medium">
                      {selectedLabwork.shade || "N/A"}
                    </p>
                  </div>
                </div>

                {/* Tooth Numbers */}
                <div className="flex items-start gap-2 col-span-2">
                  <Smile className="h-5 w-5 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-muted-foreground">Tooth Numbers</p>
                    <p className="font-medium">
                      {Array.isArray(selectedLabwork.toothNumbers)
                        ? selectedLabwork.toothNumbers.join(", ")
                        : "N/A"}
                    </p>
                  </div>
                </div>

                {/* Impressions Taken On */}
                <div className="flex items-start gap-2">
                  <CalendarDays className="h-5 w-5 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-muted-foreground">
                      Impressions Taken On
                    </p>
                    <p className="font-medium">
                      {safeFormatDate(selectedLabwork.impressionsTakenOn)}
                    </p>
                  </div>
                </div>

                {/* Expected Delivery */}
                <div className="flex items-start gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-muted-foreground">Expected Delivery</p>
                    <p className="font-medium">
                      {safeFormatDate(selectedLabwork.expectedDeliveryDate)}
                    </p>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-start gap-2 col-span-2">
                  <Info className="h-5 w-5 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${selectedLabwork.status === "Pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : selectedLabwork.status === "Received"
                          ? "bg-blue-100 text-blue-700"
                          : selectedLabwork.status === "Fitted"
                            ? "bg-green-100 text-green-700"
                            : selectedLabwork.status === "Rework"
                              ? "bg-orange-100 text-orange-700"
                              : selectedLabwork.status === "Cancelled"
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-700"
                        }`}
                    >
                      {selectedLabwork.status || "N/A"}
                    </span>
                  </div>
                </div>

                {/* Remarks */}
                {selectedLabwork.remarks && (
                  <div className="flex items-start gap-2 col-span-2">
                    <FileText className="h-5 w-5 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-muted-foreground">Remarks</p>
                      <p className="font-medium">{selectedLabwork.remarks}</p>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooterActions
                captureRef={labworkDialogRef}
                className="no-capture"
              />
            </>
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              No labwork selected.
            </p>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!openStatDialog}
        onOpenChange={() => setOpenStatDialog(null)}
      >
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{openStatDialog}</DialogTitle>
          </DialogHeader>

          {/* Render content dynamically based on which stat is open */}
          {openStatDialog === "Upcoming Appointments" && (
            <div className="space-y-3">
              {patientAppointments.length > 0 ? (
                patientAppointments.map((app) => (
                  <div
                    key={app._id}
                    className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleOpenModal(app)}
                  >
                    <p className="font-medium">
                      {safeFormatDate(app.appointmentDate)}
                    </p>
                    <p className="text-sm text-gray-500">{app.status}</p>
                    <p className="text-sm text-gray-500">{app.treatments}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">
                  No upcoming appointments.
                </p>
              )}
            </div>
          )}

          {openStatDialog === "Medical History" && (
            <ul className="list-disc pl-5 space-y-2">
              {patient.medicalHistory?.length ? (
                patient.medicalHistory.map((h, i) => (
                  <li key={i} className="text-gray-700">
                    {h}
                  </li>
                ))
              ) : (
                <p className="text-gray-500 text-sm">
                  No medical history available.
                </p>
              )}
            </ul>
          )}

          {openStatDialog === "Active Medications" && (
            <ul className="list-disc pl-5 space-y-2">
              {patient.currentMedications?.length ? (
                patient.currentMedications.map((m, i) => (
                  <li key={i} className="text-gray-700">
                    {m}
                  </li>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No active medications.</p>
              )}
            </ul>
          )}

          {openStatDialog === "Total Treatments" && (
            <div className="space-y-3">
              {patientBillings.length > 0 ? (
                patientBillings.map((bill) => (
                  <div
                    key={bill._id}
                    className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedBilling(bill)}
                  >
                    <p className="font-medium">{safeFormatDate(bill.date)}</p>
                    <p className="text-sm text-gray-500">
                      Treatments: {bill.treatments?.length || 0}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">
                  No billing records found.
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PatientDetailView;
