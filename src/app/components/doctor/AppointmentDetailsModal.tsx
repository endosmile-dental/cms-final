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

interface AppointmentDetailsModalProps {
  date: Date;
  appointments: any[]; // Array of appointments for this date
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
        </DialogHeader>

        <div className="mt-4 overflow-x-auto">
          {appointments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-left">Patient Name</TableHead>
                  <TableHead className="text-left">Appointment Time</TableHead>
                  <TableHead className="text-left">Teeth</TableHead>
                  <TableHead className="text-left">Treatments</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((appointment, index) => {
                  // Check if teeth and treatments are arrays

                  const teeth = Array.isArray(appointment.teeth)
                    ? appointment.teeth.join(", ")
                    : appointment.teeth || "Not specified";

                  const treatments = Array.isArray(appointment.treatments)
                    ? appointment.treatments.join(", ")
                    : appointment.treatments || "Not specified";

                  console.log(treatments, "treatments");

                  return (
                    <TableRow key={index}>
                      <TableCell className="text-sm">
                        {appointment.patientName}
                      </TableCell>
                      <TableCell className="text-sm">
                        {appointment?.timeSlot || "N/A"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {Array.isArray(appointment.teeth) ? (
                          <div className="flex flex-wrap gap-1">
                            {appointment.teeth.map(
                              (tooth: string, idx: number) => (
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
                        {Array.isArray(appointment.treatments) ? (
                          <div className="flex flex-wrap gap-1">
                            {appointment.treatments.map(
                              (treatment: string, idx: number) => (
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
