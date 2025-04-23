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
  TableFooter,
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
      <DialogContent className="max-w-4xl w-full p-6 rounded-lg bg-white">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Appointments for {format(date, "PPP")}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {appointments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-left">Patient Name</TableHead>
                  <TableHead className="text-left">Appointment Time</TableHead>
                  <TableHead className="text-left">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((appointment, index) => (
                  <TableRow key={index}>
                    <TableCell className="text-sm">
                      {appointment.patientName}
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(appointment.appointmentTime), "hh:mm a")}
                    </TableCell>
                    <TableCell className="text-sm">
                      {appointment.status}
                    </TableCell>
                  </TableRow>
                ))}
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
