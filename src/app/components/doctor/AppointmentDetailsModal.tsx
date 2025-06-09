import {
  DialogClose,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
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

interface Appointment {
  patientName: string;
  contactNumber?: string;
  timeSlot?: string;
  teeth?: string[] | string;
  treatments?: string[] | string;
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
      <DialogTrigger />
      <DialogContent className="max-w-5xl w-full p-6 rounded-lg bg-white">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Appointments for {format(date, "PPP")}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Below is a list of all patient appointments scheduled on this date.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 overflow-x-auto">
          {appointments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-left">Patient Name</TableHead>
                  <TableHead className="text-left">Appointment Time</TableHead>
                  <TableHead className="text-left">Contact Number</TableHead>
                  <TableHead className="text-left">Teeth</TableHead>
                  <TableHead className="text-left">Treatments</TableHead>
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
                      <TableCell className="text-sm">
                        {appointment.patientName}
                      </TableCell>
                      <TableCell className="text-sm">
                        {appointment?.timeSlot || "N/A"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {appointment?.contactNumber || "N/A"}
                      </TableCell>

                      <TableCell className="text-sm">
                        {isTeethArray ? (
                          <div className="flex flex-wrap gap-1">
                            {(appointment.teeth as string[]).map(
                              (tooth, idx) => (
                                <span
                                  key={idx}
                                  className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full"
                                >
                                  {tooth}
                                </span>
                              )
                            )}
                          </div>
                        ) : (
                          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
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
                                  className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full"
                                >
                                  {treatment}
                                </span>
                              )
                            )}
                          </div>
                        ) : (
                          <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                            {appointment.treatments || "Not specified"}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <p>No appointments on this day.</p>
          )}
        </div>

        <DialogClose asChild>
          <button
            className="bg-blue-500 text-white py-2 px-4 rounded-md mt-4"
            onClick={onClose}
          >
            Close
          </button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentDetailsModal;
