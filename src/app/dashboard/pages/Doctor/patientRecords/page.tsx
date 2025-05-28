"use client";

// Core imports
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

// UI Components
import DashboardLayout from "@/app/dashboard/layout/DashboardLayout";
import DashboardCards, { Stat } from "@/app/dashboard/ui/DashboardCards";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import DataTable from "@/app/components/DataTable";
import EditPatientModal from "../../../../components/EditPatientModal";

// Icons
import {
  Search,
  UserPlus,
  Edit,
  AlertOctagon,
  MapPin,
  Mail,
  Calendar,
  DollarSign,
  ArrowLeft,
  StickyNote,
  ClipboardList,
  FileText,
  Smile,
  CalendarDays,
  Clock,
  ReceiptText,
  Percent,
  CreditCard,
  Hash,
  Info,
  IndianRupee,
  Tag,
  FileClock,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  AlertCircle,
} from "lucide-react";

// Redux and Data
import { selectPatients, Patient } from "@/app/redux/slices/patientSlice";
import { useAppSelector, useAppDispatch } from "@/app/redux/store/hooks";
import { fetchPatients } from "@/app/redux/slices/patientSlice";
import {
  Appointment,
  selectAppointments,
} from "@/app/redux/slices/appointmentSlice";
import { BillingRecord, selectBillings } from "@/app/redux/slices/billingSlice";
import TwoLineDashboardChart from "@/app/components/TwoLineDashboardChart";
import { useSearchParams } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export default function PatientRecords() {
  // State Management
  const [searchInput, setSearchInput] = useState("");
  const [suggestions, setSuggestions] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [timeFrame, setTimeFrame] = useState<"monthly" | "yearly">("monthly");

  // Redux Data
  const patients = useAppSelector(selectPatients);
  const appointments = useAppSelector(selectAppointments);
  const billings = useAppSelector(selectBillings);
  const dispatch = useAppDispatch();
  const { data: session } = useSession();

  //Router
  const searchParams = useSearchParams();

  // Refs
  const suggestionBoxRef = useRef<HTMLUListElement | null>(null);

  // Appointment table variables
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [openSelectedAppointment, setOpenSelectedAppointment] = useState(false);

  const handleOpenModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setOpenSelectedAppointment(true);
  };

  // Billing Table variable and functions
  const [openSelectedBilling, setOpenSelectedBilling] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState<BillingRecord | null>(
    null
  );

  // Static patient stats (consider making these dynamic based on actual data)
  const stats: Stat[] = [
    {
      title: "Upcoming Appointments",
      value: "2",
      icon: <Calendar size={24} />,
      color: "bg-blue-500",
      LinkURL: "",
    },
    {
      title: "Active Medications",
      value: "5",
      icon: <AlertOctagon size={24} />,
      color: "bg-purple-500",
      LinkURL: "",
    },
    {
      title: "Known Allergies",
      value: "3",
      icon: <AlertOctagon size={24} />,
      color: "bg-red-500",
      LinkURL: "",
    },
    {
      title: "Last BMI",
      value: "24.3",
      icon: <AlertOctagon size={24} />,
      color: "bg-green-500",
      LinkURL: "",
    },
  ];

  // Search Handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);

    // Filter patients based on ID or name
    const filtered = patients.filter((patient) =>
      value.startsWith("ES") || /\d/.test(value[0])
        ? patient.PatientId.toLowerCase().includes(value.toLowerCase())
        : patient.fullName.toLowerCase().includes(value.toLowerCase())
    );

    setSuggestions(filtered);
  };

  const handleSelectSuggestion = (patient: Patient) => {
    setSelectedPatient(patient);
    setSearchInput(patient.fullName);
    setSuggestions([]);
  };

  // Modal Controls
  const openEditModal = () => setEditModalOpen(true);
  const closeEditModal = () => setEditModalOpen(false);

  // Update selected patient when Redux data changes
  useEffect(() => {
    if (selectedPatient) {
      const updated = patients.find((p) => p._id === selectedPatient._id);
      if (updated) setSelectedPatient(updated);
    }
  }, [patients, selectedPatient]);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionBoxRef.current &&
        !suggestionBoxRef.current.contains(event.target as Node)
      ) {
        setSuggestions([]);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const processChartData = (
    appointments: Appointment[],
    billings: BillingRecord[],
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
    const appointmentCounts = appointments.reduce<Record<string, number>>(
      (acc, appointment) => {
        const month = formatDate(appointment.appointmentDate);
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      },
      {}
    );

    // Process treatments from billings
    const treatmentCounts = billings.reduce<Record<string, number>>(
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

  // Patient Data Filters
  const getPatientAppointments = (patientId: string) =>
    appointments.filter((appointment) => appointment.patient === patientId);

  const getPatientBillings = (patientId: string) =>
    billings.filter((billing) => billing.patientId === patientId);

  useEffect(() => {
    const patientId = searchParams.get("patientId");
    if (patientId && patients.length > 0) {
      console.log("Fetching patient from query:", patientId);

      const patientFromQuery = patients.find((p) => p._id === patientId);
      if (patientFromQuery) {
        setSelectedPatient(patientFromQuery);
      }
    }
  }, [searchParams, patients]);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Search Section */}
        <div className="flex justify-between items-end gap-x-2 bg-white p-4 rounded-lg shadow-sm">
          <Button
            variant="ghost"
            className="flex items-center gap-2 text-sm"
            onClick={() => setSelectedPatient(null)} // Reset selected patient on back button click
          >
            <ArrowLeft size={20} />
          </Button>
          <div className="relative w-full">
            <Search
              className="absolute left-3 top-2.5 text-gray-400"
              size={18}
            />
            <Input
              placeholder="Search patients..."
              value={searchInput}
              onChange={handleSearchChange}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />

            {/* Search Suggestions */}
            {suggestions.length > 0 && (
              <ul
                ref={suggestionBoxRef}
                className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 shadow-lg max-h-60 overflow-auto"
              >
                {suggestions.map((patient, index) => (
                  <li
                    key={index}
                    className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                    onClick={() => handleSelectSuggestion(patient)}
                  >
                    {patient.fullName} ({patient.PatientId})
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Link href="/dashboard/pages/Doctor/patientRecords/patientRegistrationForm">
            <Button className="mt-3 md:mt-0 md:ml-4 flex items-center gap-2">
              <UserPlus size={18} />
              <span className="hidden md:block">Add Patient</span>
            </Button>
          </Link>
        </div>

        {selectedPatient ? (
          /* Patient Detail View */
          <>
            {/* Patient Header Section */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex justify-between items-start">
                <h1 className="text-2xl font-bold text-gray-800">
                  {selectedPatient.fullName}
                </h1>
                <Button variant="ghost" size="sm" onClick={openEditModal}>
                  <Edit size={16} />
                </Button>
              </div>

              {/* Patient Metadata Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                <div>
                  <span className="text-gray-500">Contact:</span>{" "}
                  {selectedPatient.contactNumber || "NA"}
                </div>
                <div>
                  <span className="text-gray-500">Gender:</span>{" "}
                  {selectedPatient.gender || "NA"}
                </div>
                <div>
                  <span className="text-gray-500">DOB:</span>{" "}
                  {selectedPatient.dateOfBirth
                    ? new Date(selectedPatient.dateOfBirth).toLocaleDateString(
                        "en-GB",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }
                      )
                    : "NA"}{" "}
                </div>
                <div>
                  <span className="text-gray-500">Patient ID:</span>{" "}
                  {selectedPatient.PatientId}
                </div>
              </div>
            </div>

            <DashboardCards stats={stats} />

            {/* Contact Information Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TwoLineDashboardChart
                data={processChartData(
                  getPatientAppointments(selectedPatient._id),
                  getPatientBillings(selectedPatient.PatientId),
                  timeFrame
                )}
                timeFrame={timeFrame}
                setTimeFrame={setTimeFrame}
              />
              <div className="bg-white p-6 rounded-lg shadow-sm flex flex-col gap-y-5">
                <ContactInfo
                  icon={<Mail className="text-blue-500" size={20} />}
                  title="Email"
                  content={selectedPatient.email || "NA"}
                />
                <ContactInfo
                  icon={<MapPin className="text-green-500" size={20} />}
                  title="Address"
                  content={`${selectedPatient.address?.street}, ${selectedPatient.address?.city}, ${selectedPatient.address?.state} - ${selectedPatient.address?.postalCode}`}
                />
                <ContactInfo
                  icon={<AlertOctagon className="text-red-500" size={20} />}
                  title="Emergency Contacts"
                  content={`${selectedPatient.emergencyContact?.fullName} (${selectedPatient.emergencyContact?.relationship}): ${selectedPatient.emergencyContact?.contactNumber}`}
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
                data={getPatientAppointments(selectedPatient._id)}
                title=""
                showSearch={false}
                itemsPerPage={10}
                searchFields={["appointmentDate", "status"]}
                columns={[
                  {
                    header: "Date",
                    accessorKey: "appointmentDate",
                    sortable: true,
                    render: (v) => new Date(v).toLocaleDateString(),
                  },
                  {
                    header: "Time",
                    accessorKey: "timeSlot",
                    sortable: true,
                  },
                  {
                    header: "Teeth",
                    accessorKey: "teeth",
                    render: (v) => v.join(",") || "N/A",
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
                icon={<DollarSign className="text-green-500" size={20} />}
                title="Billings"
              />
              {/* <BillingTable
                billings={getPatientBillings(selectedPatient.PatientId)}
              /> */}
              <DataTable<BillingRecord>
                data={getPatientBillings(selectedPatient.PatientId)}
                title=""
                showSearch={false}
                itemsPerPage={10}
                searchFields={["date", "treatments"]}
                columns={[
                  {
                    header: "Date",
                    accessorKey: "date",
                    sortable: true,
                    render: (v) => new Date(v).toLocaleDateString(),
                  },
                  {
                    header: "Treatments",
                    accessorKey: "treatments",
                    sortable: true,
                    render: (v: { treatment: string }[]) =>
                      v.map((t) => t.treatment).join(", ") || "N/A",
                  },
                  {
                    header: "Amount",
                    accessorKey: "totalAmount",
                    render: (v) => v.toFixed(2) || "N/A",
                  },
                  {
                    header: "Discount",
                    accessorKey: "discount",
                    render: (v) => v || "N/A",
                  },
                  {
                    header: "Mode of Payment",
                    accessorKey: "modeOfPayment",
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
                          setSelectedBilling(row);
                          setOpenSelectedBilling(true);
                        }}
                      >
                        View
                      </Button>
                    ),
                  },
                ]}
              />
            </div>

            {/* Edit Patient Modal */}
            <EditPatientModal
              isOpen={isEditModalOpen}
              onClose={closeEditModal}
              patient={selectedPatient}
              onPatientUpdated={(updatedPatient: Patient) => {
                setSelectedPatient(updatedPatient);
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
              <DialogContent className="max-w-2xl animate-fade-in">
                <DialogTitle className="text-2xl font-bold mb-4">
                  <ClipboardList className="inline-block mr-2 h-6 w-6" />
                  Appointment Details
                </DialogTitle>

                {selectedAppointment ? (
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
                        <p className="text-muted-foreground">
                          Consultation Type
                        </p>
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
                        <Badge
                          variant={
                            selectedAppointment.status === "Cancelled"
                              ? "destructive"
                              : selectedAppointment.status === "Completed"
                              ? "default"
                              : "secondary"
                          }
                          className="capitalize"
                        >
                          {selectedAppointment.status}
                        </Badge>
                      </div>
                    </div>

                    {/* Payment Status */}
                    <div className="flex items-start gap-2">
                      <IndianRupee className="h-5 w-5 text-muted-foreground mt-1" />
                      <div>
                        <p className="text-muted-foreground">Payment</p>
                        <Badge
                          variant={
                            selectedAppointment.paymentStatus === "Pending"
                              ? "secondary"
                              : "default"
                          }
                          className="capitalize"
                        >
                          {selectedAppointment.paymentStatus}
                        </Badge>
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
                                <Badge key={treatment} variant="outline">
                                  {treatment}
                                </Badge>
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
                    <div className="flex items-start gap-2">
                      <FileClock className="h-5 w-5 text-muted-foreground mt-1" />
                      <div>
                        <p className="text-muted-foreground">Created At</p>
                        <p className="font-medium">
                          {new Date(
                            selectedAppointment.createdAt
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Updated At */}
                    <div className="flex items-start gap-2">
                      <FileClock className="h-5 w-5 text-muted-foreground mt-1" />
                      <div>
                        <p className="text-muted-foreground">Updated At</p>
                        <p className="font-medium">
                          {new Date(
                            selectedAppointment.updatedAt
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-sm text-muted-foreground">
                    No appointment selected.
                  </p>
                )}
              </DialogContent>
            </Dialog>

            {/* Billing Details Dialog */}

            <Dialog
              open={openSelectedBilling}
              onOpenChange={setOpenSelectedBilling}
            >
              <DialogContent className="max-w-2xl animate-fade-in">
                <DialogTitle className="text-2xl font-bold mb-4">
                  <ReceiptText className="inline-block mr-2 h-6 w-6" />
                  Billing Details
                </DialogTitle>

                {selectedBilling ? (
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
                        <p className="font-medium">
                          {selectedBilling.invoiceId}
                        </p>
                      </div>
                    </div>

                    {/* Treatments */}
                    <div className="flex items-start gap-2 col-span-2">
                      <ReceiptText className="h-5 w-5 text-muted-foreground mt-1" />
                      <div>
                        <p className="text-muted-foreground">Treatments</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {selectedBilling.treatments?.map((t, idx) => (
                            <Badge key={idx} variant="outline">
                              {t.treatment} (₹{t.price} * {t.quantity})
                            </Badge>
                          )) || "N/A"}
                        </div>
                      </div>
                    </div>

                    {/* Amount Before Discount */}
                    <div className="flex items-start gap-2">
                      <DollarSign className="h-5 w-5 text-muted-foreground mt-1" />
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

                    {/* Advance */}
                    <div className="flex items-start gap-2">
                      <ArrowUpCircle className="h-5 w-5 text-muted-foreground mt-1" />
                      <div>
                        <p className="text-muted-foreground">Advance</p>
                        <p className="font-medium">
                          ₹{selectedBilling.advance?.toFixed(2) || 0}
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
                          className={`font-medium ${
                            selectedBilling.amountDue < 0 ? "text-red-500" : ""
                          }`}
                        >
                          ₹{selectedBilling.amountDue?.toFixed(2) || 0}
                        </p>
                      </div>
                    </div>

                    {/* Mode of Payment */}
                    <div className="flex items-start gap-2 col-span-2">
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
                        <Badge
                          variant={
                            selectedBilling.status === "Pending"
                              ? "secondary"
                              : "default"
                          }
                          className="capitalize"
                        >
                          {selectedBilling.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-sm text-muted-foreground">
                    No billing selected.
                  </p>
                )}
              </DialogContent>
            </Dialog>
          </>
        ) : (
          /* Patient List View */
          <DataTable<Patient>
            data={patients}
            title="Patient Records"
            itemsPerPage={10}
            searchFields={["fullName", "PatientId"]}
            onRowClick={setSelectedPatient}
            columns={[
              { header: "Full Name", accessorKey: "fullName", sortable: true },
              {
                header: "Patient ID",
                accessorKey: "PatientId",
                sortable: true,
              },
              {
                header: "Contact",
                accessorKey: "contactNumber",
                render: (v) => v || "N/A",
              },
              {
                header: "Gender",
                accessorKey: "gender",
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
                      setSelectedPatient(row);
                    }}
                  >
                    View
                  </Button>
                ),
              },
            ]}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

// Reusable Section Components
const SectionHeader = ({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) => (
  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
    {icon}
    {title}
  </h2>
);

const ContactInfo = ({
  icon,
  title,
  content,
}: {
  icon: React.ReactNode;
  title: string;
  content: string;
}) => (
  <div>
    <SectionHeader icon={icon} title={title} />
    <ul className="space-y-3">
      <li className="p-2 bg-blue-50 rounded">{content}</li>
    </ul>
  </div>
);
