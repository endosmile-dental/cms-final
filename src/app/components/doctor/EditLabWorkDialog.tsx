"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { MultiSelect } from "@/components/ui/multi-select";
import { Trash2 } from "lucide-react";
import { ILabWork } from "@/app/redux/slices/labWorkSlice";

interface EditLabWorkDialogProps {
  open: boolean;
  onClose: () => void;
  labWork: ILabWork | null;
  onSave: (updated: Partial<ILabWork>) => void;
  onDelete?: (labWorkId: string) => void;
}

const EditLabWorkDialog: React.FC<EditLabWorkDialogProps> = ({
  open,
  onClose,
  labWork,
  onSave,
  onDelete,
}) => {
  const [form, setForm] = useState<ILabWork | null>(null);
  const [initialForm, setInitialForm] = useState<ILabWork | null>(null);

  useEffect(() => {
    if (labWork) {
      setForm(labWork);
      setInitialForm(labWork);
    }
  }, [labWork]);

  // Teeth options for MultiSelect
  const teethOptions = useMemo(
    () => [
      "11", "12", "13", "14", "15", "16", "17", "18",
      "21", "22", "23", "24", "25", "26", "27", "28",
      "31", "32", "33", "34", "35", "36", "37", "38",
      "41", "42", "43", "44", "45", "46", "47", "48",
      "51", "52", "53", "54", "55",
      "61", "62", "63", "64", "65",
      "71", "72", "73", "74", "75",
      "81", "82", "83", "84", "85"
    ].map(option => ({ label: option, value: option })),
    []
  );

  const handleMultiSelectChange = (field: keyof ILabWork, values: string[]) => {
    setForm((prev) => (prev ? { ...prev, [field]: values } : null));
  };

  const handleChange = <K extends keyof ILabWork>(
    key: K,
    value: ILabWork[K]
  ) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : null));
  };

  const getUpdatedFields = (): ILabWork => {
    if (!form || !initialForm) {
      // Return a default lab work if form or initialForm is null
      return {
        _id: "",
        labName: "",
        orderType: "Crown",
        material: "Zirconia",
        shade: "",
        toothNumbers: [],
        impressionsTakenOn: new Date(),
        expectedDeliveryDate: new Date(),
        status: "Pending",
        remarks: "",
        patientId: { _id: "", fullName: "", contactNumber: "" },
        doctorId: { _id: "", fullName: "", specialization: "" },
        createdAt: "",
        updatedAt: "",
      };
    }

    const updated: ILabWork = { ...form };

    (Object.keys(form) as (keyof ILabWork)[]).forEach((key) => {
      const oldValue = initialForm[key];
      const newValue = form[key];

      const isEqual = JSON.stringify(oldValue) === JSON.stringify(newValue);

      if (!isEqual) {
        (
          updated as Record<
            keyof ILabWork,
            ILabWork[keyof ILabWork]
          >
        )[key] = newValue;
      }
    });

    return updated;
  };

  const handleSubmit = () => {
    if (form && initialForm) {
      const updatedFields = getUpdatedFields();
      // Only save if there are actual changes
      const hasChanges = Object.keys(form).some(key => {
        const k = key as keyof ILabWork;
        return JSON.stringify(form[k]) !== JSON.stringify(initialForm[k]);
      });
      
      if (hasChanges) {
        onSave(updatedFields);
      }
      onClose();
    }
  };

  if (!form) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Edit Lab Work - {form._id.slice(-5)}
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-4">
          <div className="space-y-1">
            <Label>Lab Name</Label>
            <Input
              value={form.labName || ""}
              onChange={(e) => handleChange("labName", e.target.value)}
              placeholder="Lab Name"
            />
          </div>

          <div className="space-y-1">
            <Label>Order Type</Label>
            <Select
              value={form.orderType || "Crown"}
              onValueChange={(value) => handleChange("orderType", value as ILabWork["orderType"])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select order type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Crown">Crown</SelectItem>
                <SelectItem value="Bridge">Bridge</SelectItem>
                <SelectItem value="Veneer">Veneer</SelectItem>
                <SelectItem value="Inlay/Onlay">Inlay/Onlay</SelectItem>
                <SelectItem value="Denture">Denture</SelectItem>
                <SelectItem value="Others">Others</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Material</Label>
            <Select
              value={form.material || "Zirconia"}
              onValueChange={(value) => handleChange("material", value as ILabWork["material"])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select material" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Zirconia">Zirconia</SelectItem>
                <SelectItem value="Porcelain">Porcelain</SelectItem>
                <SelectItem value="Metal">Metal</SelectItem>
                <SelectItem value="Acrylic">Acrylic</SelectItem>
                <SelectItem value="Composite">Composite</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Shade</Label>
            <Input
              value={form.shade || ""}
              onChange={(e) => handleChange("shade", e.target.value)}
              placeholder="Shade"
            />
          </div>

          <div className="space-y-1">
            <Label>Tooth Numbers</Label>
            <MultiSelect
              options={teethOptions}
              onValueChange={(values) => handleMultiSelectChange("toothNumbers", values)}
              defaultValue={Array.isArray(form.toothNumbers) ? form.toothNumbers : []}
              placeholder="Select tooth numbers..."
              variant="secondary"
              maxCount={8}
            />
          </div>

          <div className="space-y-1">
            <Label>Impressions Taken On</Label>
            <Input
              type="date"
              value={form.impressionsTakenOn ? 
                (form.impressionsTakenOn instanceof Date ? 
                  form.impressionsTakenOn.toISOString().split('T')[0] : 
                  new Date(form.impressionsTakenOn).toISOString().split('T')[0]) 
                : ""}
              onChange={(e) => handleChange("impressionsTakenOn", new Date(e.target.value))}
            />
          </div>

          <div className="space-y-1">
            <Label>Expected Delivery Date</Label>
            <Input
              type="date"
              value={form.expectedDeliveryDate ? 
                (form.expectedDeliveryDate instanceof Date ? 
                  form.expectedDeliveryDate.toISOString().split('T')[0] : 
                  new Date(form.expectedDeliveryDate).toISOString().split('T')[0]) 
                : ""}
              onChange={(e) => handleChange("expectedDeliveryDate", new Date(e.target.value))}
            />
          </div>

          <div className="space-y-1">
            <Label>Status</Label>
            <Select
              value={form.status || "Pending"}
              onValueChange={(value) => handleChange("status", value as ILabWork["status"])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Received">Received</SelectItem>
                <SelectItem value="Fitted">Fitted</SelectItem>
                <SelectItem value="Rework">Rework</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Remarks</Label>
            <Input
              value={form.remarks || ""}
              onChange={(e) => handleChange("remarks", e.target.value)}
              placeholder="Additional remarks"
            />
          </div>
        </div>

        <DialogFooter>
          <div className="flex justify-between w-full">
            <div className="flex gap-2">
              <Button onClick={handleSubmit}>Save</Button>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
            <Button
              variant="destructive"
              onClick={() => {
                if (form?._id) {
                  // Trigger delete functionality
                  if (onDelete) {
                    onDelete(form._id);
                  }
                  onClose();
                }
              }}
              className="flex items-center gap-2"
            >
              <Trash2 size={16} />
              Delete
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditLabWorkDialog;