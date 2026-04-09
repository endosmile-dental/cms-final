import {
  DialogClose,
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
} from "@/components/ui/table";
import { DialogDescription } from "@radix-ui/react-dialog";
import { X, CalendarDays, User, Phone, Clock, Stethoscope, Repeat } from "lucide-react";

interface Appointment {
  patientName: string;
  contactNumber?: string;
  timeSlot?: string;
  teeth?: string[] | string;
  treatments?: string[] | string;
  consultationType?: string;
}

interface AppointmentDetailsModalProps {
  date: Date;
  appointments: Appointment[];
  onClose: () => void;
}

const AppointmentDetailsModal = ({
  date,
  appointments,
  onClose,
}: AppointmentDetailsModalProps) => {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full p-0 rounded-xl bg-card border-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500/10 to-transparent border-b border-border p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-500/10 rounded-full">
                <CalendarDays className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-foreground">
                  Appointments for {format(date, "PPP")}
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-1">
                  {appointments.length} appointment{appointments.length !== 1 ? 's' : ''} scheduled on this date
                </DialogDescription>
              </div>
            </div>
            <DialogClose asChild>
              <button
                className="p-2 rounded-full hover:bg-muted transition-colors duration-200"
                aria-label="Close modal"
              >
                <X className="h-6 w-6 text-foreground" />
              </button>
            </DialogClose>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-x-auto max-h-[60vh]">
          {appointments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-left">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Patient Name
                    </div>
                  </TableHead>
                  <TableHead className="text-left">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Time
                    </div>
                  </TableHead>
                  <TableHead className="text-left">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Contact
                    </div>
                  </TableHead>
                  <TableHead className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-xs">🦷</span>
                      Teeth
                    </div>
                  </TableHead>
                  <TableHead className="text-left">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="h-4 w-4" />
                      Treatments
                    </div>
                  </TableHead>
                  <TableHead className="text-left">
                    <div className="flex items-center gap-2">
                      <Repeat className="h-4 w-4" />
                      Type
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((appointment, index) => {
                  const isTeethArray = Array.isArray(appointment.teeth);
                  const isTreatmentsArray = Array.isArray(
                    appointment.treatments
                  );
                  return (
                    <TableRow key={index}>
                      <TableCell className="text-sm font-medium">
                        {appointment.patientName}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {appointment?.timeSlot || "N/A"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {appointment?.contactNumber || "N/A"}
                      </TableCell>

                      <TableCell className="text-sm">
                        {isTeethArray ? (
                          <div className="flex flex-wrap gap-1">
                            {(appointment.teeth as string[]).map(
                              (tooth, idx) => (
                                <span
                                  key={idx}
                                  className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-xs font-medium px-2 py-1 rounded-full"
                                >
                                  {tooth}
                                </span>
                              )
                            )}
                          </div>
                        ) : (
                          <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-xs font-medium px-2 py-1 rounded-full">
                            {appointment.teeth || "Not specified"}
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="text-sm">
                        {isTreatmentsArray ? (
                          <div className="flex flex-wrap gap-1">
                            {(appointment.treatments as string[]).map(
                              (treatment, idx) => (
                                <span
                                  key={idx}
                                  className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-xs font-medium px-2 py-1 rounded-full"
                                >
                                  {treatment}
                                </span>
                              )
                            )}
                          </div>
                        ) : (
                          <span className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-xs font-medium px-2 py-1 rounded-full">
                            {appointment.treatments || "Not specified"}
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="text-sm">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            appointment.consultationType === "Follow-up"
                              ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                              : "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300"
                          }`}
                        >
                          {appointment.consultationType === "Follow-up" ? (
                            <>
                              <Repeat className="h-3 w-3 mr-1" />
                              Follow-up
                            </>
                          ) : (
                            "New"
                          )}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <CalendarDays className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">No appointments on this day</p>
              <p className="text-sm mt-1">There are no scheduled appointments for this date.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-muted/50 border-t border-border p-6">
          <DialogClose asChild>
            <button
              className="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
              onClick={onClose}
            >
              Close
            </button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentDetailsModal;