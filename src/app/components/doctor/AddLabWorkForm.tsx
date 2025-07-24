"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MultiSelect } from "@/components/ui/multi-select";
import { teethOptions } from "../BookAppointmentForm";
import { useAppDispatch, useAppSelector } from "@/app/redux/store/hooks";
import { Patient, selectPatients } from "@/app/redux/slices/patientSlice";
import { ProfileData } from "@/app/redux/slices/profileSlice";
import { FilePlus2, Loader2, X } from "lucide-react";
import { createLabWork } from "@/app/redux/slices/labWorkSlice";

interface AddLabWorkFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const orderTypes = [
  "Crown",
  "Bridge",
  "Denture",
  "Aligner",
  "Implant",
  "Inlay/Onlay",
  "Veneer",
  "Others",
] as const;

const materialByOrderType: Record<string, string[]> = {
  Crown: [
    "Zirconia",
    "Lithium Disilicate (e.max)",
    "PFM",
    "Full Ceramic",
    "Full Metal",
    "Composite Resin",
  ],
  Bridge: ["Zirconia", "PFM", "Full Metal", "Full Ceramic"],
  Denture: [
    "Acrylic Resin",
    "Cobalt-Chromium",
    "Flexible Nylon (Valplast)",
    "Thermoplastic Resin",
  ],
  Aligner: ["PETG", "TPU"],
  Implant: ["Titanium", "Zirconia", "Hybrid (Zirconia + Porcelain)"],
  "Inlay/Onlay": [
    "Composite Resin",
    "Zirconia",
    "Gold Alloy",
    "Lithium Disilicate (e.max)",
  ],
  Veneer: ["Lithium Disilicate (e.max)", "Porcelain", "Composite Resin"],
  Others: [
    "Zirconia",
    "Lithium Disilicate (e.max)",
    "PFM",
    "Full Ceramic",
    "Full Metal",
    "Composite Resin",
    "Acrylic Resin",
    "Cobalt-Chromium",
    "Flexible Nylon (Valplast)",
    "Thermoplastic Resin",
    "PETG",
    "TPU",
    "Titanium",
    "Hybrid (Zirconia + Porcelain)",
    "Porcelain",
    "Gold Alloy",
  ],
};

const AddLabWorkForm: React.FC<AddLabWorkFormProps> = ({
  onClose,
  onSuccess,
}) => {
  const dispatch = useAppDispatch();

  const [formData, setFormData] = useState({
    doctorId: "",
    patientId: "",
    labName: "",
    orderType: "",
    othersText: "",
    toothNumbers: [] as string[],
    expectedDeliveryDate: "",
    status: "Pending",
    remarks: "",
    shade: "",
    material: "",
    impressionsTakenOn: new Date().toLocaleDateString("en-CA"),
    attachments: [] as File[],
  });

  const patients = useAppSelector(selectPatients);
  const profile = useAppSelector(
    (state) => state?.profile?.profile as ProfileData
  );

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [patientQuery, setPatientQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.patientId.trim())
      newErrors.patientId = "Patient ID is required";
    if (!formData.labName.trim()) newErrors.labName = "Lab Name is required";
    if (!formData.orderType) newErrors.orderType = "Order Type is required";
    if (formData.orderType === "Others" && !formData.othersText.trim())
      newErrors.othersText = "Please specify the order type";
    if (formData.toothNumbers.length === 0)
      newErrors.toothNumbers = "Select at least one tooth";
    if (!formData.expectedDeliveryDate)
      newErrors.expectedDeliveryDate = "Delivery date is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    if (profile?._id) {
      setFormData((prev) => ({
        ...prev,
        doctorId: profile._id,
      }));
    }
  }, [profile]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const filteredSuggestions = useMemo(
    () =>
      patientQuery
        ? patients.filter(
            (p) =>
              p.fullName.toLowerCase().includes(patientQuery.toLowerCase()) ||
              p.PatientId.toLowerCase().includes(patientQuery.toLowerCase())
          )
        : [],
    [patientQuery, patients]
  );

  const handleSelectPatient = useCallback((patient: Patient) => {
    setPatientQuery(`${patient.fullName} (${patient.PatientId})`);
    setFormData((prev) => ({
      ...prev,
      patientId: patient._id,
    }));
  }, []);

  const handlePatientChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPatientQuery(e.target.value);
    },
    []
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFormData((prev) => ({
        ...prev,
        attachments: [...prev.attachments, ...newFiles],
      }));
    }
  };

  const removeFile = (index: number) => {
    setFormData((prev) => {
      const updatedFiles = [...prev.attachments];
      updatedFiles.splice(index, 1);
      return { ...prev, attachments: updatedFiles };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();

      // Append all form fields
      formDataToSend.append("patientId", formData.patientId);
      formDataToSend.append("doctorId", formData.doctorId);
      formDataToSend.append("labName", formData.labName);
      formDataToSend.append("orderType", formData.orderType);
      formDataToSend.append("othersText", formData.othersText);
      formDataToSend.append(
        "toothNumbers",
        JSON.stringify(formData.toothNumbers)
      );
      formDataToSend.append(
        "expectedDeliveryDate",
        formData.expectedDeliveryDate
      );
      formDataToSend.append("status", formData.status);
      formDataToSend.append("remarks", formData.remarks);
      formDataToSend.append("shade", formData.shade);
      formDataToSend.append("material", formData.material);
      formDataToSend.append("impressionsTakenOn", formData.impressionsTakenOn);

      // Append files
      if (formData.attachments.length > 0) {
        formData.attachments.forEach((file) => {
          formDataToSend.append("attachments", file);
        });
      }
      // Dispatch the action to create lab work
      // Using unwrap to handle errors directly
      await dispatch(createLabWork(formDataToSend)).unwrap();

      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("[SUBMIT_LABWORK_ERROR]", err.message);
      } else {
        console.error("[SUBMIT_LABWORK_ERROR]", err);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formattedTeethOptions = teethOptions.map((tooth) => ({
    label: tooth,
    value: tooth,
  }));

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 max-h-[500px] overflow-y-auto px-5"
    >
      {/* Patient ID */}
      <div className="relative">
        <Label>Patient</Label>
        <Input
          value={patientQuery}
          onChange={handlePatientChange}
          placeholder="Search by Patient ID or Name"
        />
        {filteredSuggestions.length > 0 && (
          <ul className="absolute bg-white z-10 w-full border rounded mt-2 max-h-40 overflow-y-auto">
            {filteredSuggestions.map((p) => (
              <li
                key={p._id}
                className="p-2 cursor-pointer hover:bg-gray-200"
                onClick={() => handleSelectPatient(p)}
              >
                {p.fullName} ({p.PatientId})
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Lab Name */}
      <div>
        <Label>Lab Name</Label>
        <Input
          name="labName"
          value={formData.labName}
          onChange={handleChange}
          placeholder="Lab name"
        />
        {errors.labName && (
          <p className="text-red-500 text-sm">{errors.labName}</p>
        )}
      </div>

      {/* Order Type */}
      <div>
        <Label>Order Type</Label>
        <Select
          onValueChange={(val) =>
            setFormData((prev) => ({ ...prev, orderType: val }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select order type" />
          </SelectTrigger>
          <SelectContent>
            {orderTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.orderType && (
          <p className="text-red-500 text-sm">{errors.orderType}</p>
        )}
      </div>

      {/* Others Text */}
      {formData.orderType === "Others" && (
        <div>
          <Label>Other Type Description</Label>
          <Input
            name="othersText"
            value={formData.othersText}
            onChange={handleChange}
            placeholder="Describe the order"
          />
          {errors.othersText && (
            <p className="text-red-500 text-sm">{errors.othersText}</p>
          )}
        </div>
      )}

      {/* Tooth Numbers */}
      <div>
        <Label>Tooth Numbers</Label>
        <MultiSelect
          options={formattedTeethOptions}
          value={formData.toothNumbers}
          onValueChange={(val) =>
            setFormData((prev) => ({ ...prev, toothNumbers: val }))
          }
          placeholder="Select teeth"
          maxCount={4}
          animation={0.3}
        />
        {errors.toothNumbers && (
          <p className="text-red-500 text-sm">{errors.toothNumbers}</p>
        )}
      </div>

      {/* Shade */}
      <div>
        <Label>Shade</Label>
        <Input
          name="shade"
          value={formData.shade}
          onChange={handleChange}
          placeholder="Shade color"
        />
      </div>

      {/* Material */}
      {formData.orderType && (
        <div>
          <Label>Material</Label>
          <Select
            onValueChange={(val) =>
              setFormData((prev) => ({ ...prev, material: val }))
            }
            value={formData.material}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select material" />
            </SelectTrigger>
            <SelectContent>
              {(materialByOrderType[formData.orderType] || []).map(
                (material) => (
                  <SelectItem key={material} value={material}>
                    {material}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Impressions Taken On */}
      <div>
        <Label>Impressions Taken On</Label>
        <Input
          type="date"
          name="impressionsTakenOn"
          value={formData.impressionsTakenOn}
          onChange={handleChange}
        />
      </div>

      {/* Delivery Date */}
      <div>
        <Label>Expected Delivery Date</Label>
        <Input
          type="date"
          name="expectedDeliveryDate"
          value={formData.expectedDeliveryDate}
          onChange={handleChange}
        />
        {errors.expectedDeliveryDate && (
          <p className="text-red-500 text-sm">{errors.expectedDeliveryDate}</p>
        )}
      </div>

      {/* Remarks */}
      <div>
        <Label>Remarks</Label>
        <Textarea
          name="remarks"
          value={formData.remarks}
          onChange={handleChange}
          placeholder="Any notes"
        />
      </div>

      {/* Attachments */}
      <div>
        <Label>Attachments (Images/PDF)</Label>
        <div className="flex items-center gap-2">
          <Label
            htmlFor="attachments"
            className="flex items-center gap-1 px-4 py-2 border rounded-md cursor-pointer bg-gray-50 hover:bg-gray-100"
          >
            <FilePlus2 size={16} /> Add Files
          </Label>
          <Input
            id="attachments"
            type="file"
            multiple
            accept="image/*, application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />
          {formData.attachments.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() =>
                setFormData((prev) => ({ ...prev, attachments: [] }))
              }
            >
              <X size={16} />
            </Button>
          )}
        </div>
        {formData.attachments.length > 0 && (
          <ul className="mt-2">
            {formData.attachments.map((file, index) => (
              <li
                key={index}
                className="flex items-center justify-between text-sm text-gray-600"
              >
                <span>
                  {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFile(index)}
                >
                  <X size={14} />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" type="button" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Submit"
          )}
        </Button>
      </div>
    </form>
  );
};

export default AddLabWorkForm;
