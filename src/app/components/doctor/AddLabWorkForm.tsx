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
import { useAppDispatch } from "@/app/redux/store/hooks";
import { FilePlus2, Loader2, Search, X } from "lucide-react";
import { createLabWork } from "@/app/redux/slices/labWorkSlice";
import Link from "next/link";

// Patient type for this component
interface Patient {
  _id: string;
  PatientId: string;
  fullName: string;
  contactNumber?: string;
}

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

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [patientQuery, setPatientQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

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


  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Search patients using API
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      const response = await fetch(`/api/doctor/searchPatients?query=${encodeURIComponent(query)}`);
      const data = await response.json();
      setSearchResults(data.patients || []);
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search effect
  useEffect(() => {
    // Only perform search if patient is not selected
    if (!selectedPatient) {
      setHasSearched(false);
      const timeoutId = setTimeout(() => {
        performSearch(patientQuery);
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [patientQuery, performSearch, selectedPatient]);

  const filteredSuggestions = useMemo(() => {
    if (!hasSearched) {
      return [];
    }
    return searchResults;
  }, [hasSearched, searchResults]);

  // When a patient is selected
  const handleSelectSuggestion = (patient: Patient) => {
    setSelectedPatient(patient);
    setPatientQuery(`${patient.fullName} (${patient.PatientId})`);
    setFormData((prev) => ({
      ...prev,
      patientId: patient._id,
    }));
    setSearchResults([]);
    setHasSearched(false);
  };

  // Handle patient search input change
  const handlePatientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPatientQuery(value);

    // Clear selection when typing
    if (selectedPatient) {
      setSelectedPatient(null);
      setFormData((prev) => ({
        ...prev,
        patientId: "",
      }));
    }
  };

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
    <div className="space-y-4">
      {/* Search Section - Similar to Billing Page */}
      <div className="border rounded-lg p-4 bg-card">
        <Label className="text-base font-semibold">Search Patient</Label>
        <div className="relative mt-2">
          <Search
            className="absolute left-3 top-3 text-muted-foreground"
            size={18}
          />
          <Input
            type="text"
            placeholder="Search patients by name, ID, or phone..."
            value={patientQuery}
            onChange={handlePatientChange}
            className="pl-10 pr-4 py-2 w-full"
            disabled={!!selectedPatient}
          />

          {isSearching && (
            <div className="absolute right-10 top-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Search Results Dropdown */}
          {hasSearched && !selectedPatient && (
            <ul className="absolute z-10 w-full bg-background border rounded-md mt-1 shadow-lg max-h-60 overflow-auto">
              <li className="px-4 py-2 border-b bg-muted/50 text-sm text-muted-foreground">
                {isSearching ? (
                  'Searching...'
                ) : filteredSuggestions.length === 0 ? (
                  'No patients found'
                ) : (
                  `Showing ${filteredSuggestions.length} result${filteredSuggestions.length !== 1 ? 's' : ''}`
                )}
              </li>
              {filteredSuggestions.map((patient) => (
                <li
                  key={patient._id}
                  className="px-4 py-3 hover:bg-accent border-b last:border-b-0 cursor-pointer transition-colors"
                  onClick={() => handleSelectSuggestion(patient)}
                >
                  <div className="font-medium">{patient.fullName}</div>
                  <div className="text-sm text-muted-foreground">
                    ID: {patient.PatientId}
                    {patient.contactNumber && ` • ${patient.contactNumber}`}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* No Results Fallback */}
          {!selectedPatient &&
            hasSearched &&
            filteredSuggestions.length === 0 &&
            !isSearching &&
            patientQuery.trim() !== "" && (
              <div className="mt-2 border border-dashed rounded-lg p-4 text-center">
                <div className="flex items-center justify-center w-8 h-8 mx-auto mb-2 bg-muted/50 rounded-full">
                  <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <p className="text-sm text-muted-foreground mb-3">Patient not found</p>
                <Link href="/dashboard/pages/Doctor/patientRecords/patientRegistrationForm">
                  <Button
                    type="button"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
                  >
                    Register New Patient
                  </Button>
                </Link>
              </div>
            )}
        </div>

        {/* Selected Patient Display */}
        {selectedPatient && (
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-blue-800 dark:text-blue-200">
                  Selected: {selectedPatient.fullName}
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-300">
                  ID: {selectedPatient.PatientId}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedPatient(null);
                  setPatientQuery("");
                  setFormData((prev) => ({
                    ...prev,
                    patientId: "",
                  }));
                }}
              >
                Change
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Lab Work Form - Only show when patient is selected */}
      {selectedPatient && (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 max-h-[380px] overflow-y-auto pb-8"
        >
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
                className="flex items-center gap-1 px-4 py-2 border border-border rounded-md cursor-pointer bg-accent hover:bg-accent/80 transition-colors"
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
                    className="flex items-center justify-between text-sm text-muted-foreground"
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
      )}

      {/* Show message if no patient selected */}
      {!selectedPatient && (
        <div className="text-center py-8 text-muted-foreground">
          <p>Please search and select a patient to add lab work.</p>
        </div>
      )}
    </div>
  );
};

export default AddLabWorkForm;