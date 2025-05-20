// components/PatientListCard.tsx
import { Patient } from "@/app/redux/slices/patientSlice";
import { Card } from "@/components/ui/card";

type Props = {
  patient: Patient;
  onSelect: (patient: Patient) => void;
};

const PatientListCard = ({ patient, onSelect }: Props) => {
  return (
    <Card
      className="p-4 flex flex-col gap-2 cursor-pointer hover:shadow-md transition"
      onClick={() => onSelect(patient)}
    >
      <div className="text-lg font-semibold text-gray-800">
        {patient.fullName}
      </div>
      <div className="text-sm text-gray-600">
        <span className="font-medium">ID:</span> {patient.PatientId}
      </div>
      <div className="text-sm text-gray-600">
        <span className="font-medium">Contact:</span>{" "}
        {patient.contactNumber || "NA"}
      </div>
      <div className="text-sm text-gray-600">
        <span className="font-medium">Gender:</span> {patient.gender || "NA"}
      </div>
    </Card>
  );
};

export default PatientListCard;
