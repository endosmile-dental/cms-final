// src/app/components/doctor/labwork/EditLabWorkForm.tsx
import React, { useEffect, useState } from "react";
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
import { useAppDispatch } from "@/app/redux/store/hooks";
import { updateLabWork } from "@/app/redux/slices/labWorkSlice";
import { LabWorkItem } from "@/app/dashboard/pages/Doctor/labWork/page";
import { Attachment } from "@/app/model/LabWork.model";
import { FilePlus2, Loader2, Trash2, X } from "lucide-react";

// Define a type for the editable fields in your form
type EditableLabWorkFields = {
  id?: string; // Add ID to track changes
  orderType: string;
  status: "Pending" | "Received" | "Fitted" | "Cancelled" | "Rework";
  expectedDeliveryDate?: Date | string | null;
  toothNumbers?: (string | number)[] | string | null;
  shade?: string | null;
  material?: string | null;
  remarks?: string | null;
  othersText?: string | null;
};

interface EditLabWorkFormProps {
  labWork: LabWorkItem | null;
  onCancel: () => void;
  onSuccess: () => void;
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

const EditLabWorkForm: React.FC<EditLabWorkFormProps> = ({
  labWork,
  onCancel,
  onSuccess,
}) => {
  const dispatch = useAppDispatch();

  const [formData, setFormData] = useState<EditableLabWorkFields>({
    orderType: "",
    status: "Pending",
    expectedDeliveryDate: "",
    toothNumbers: [],
    shade: "",
    material: "",
    remarks: "",
    othersText: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // State for attachments
  const [existingAttachments, setExistingAttachments] = useState<Attachment[]>(
    []
  );
  const [newAttachments, setNewAttachments] = useState<File[]>([]);
  const [deletedAttachments, setDeletedAttachments] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form data when labWork changes
  useEffect(() => {
    if (labWork) {
      setFormData({
        id: labWork.id,
        orderType: labWork.orderType || "",
        status: labWork.status || "Pending",
        expectedDeliveryDate: labWork.expectedDeliveryDate
          ? new Date(labWork.expectedDeliveryDate).toISOString().split("T")[0]
          : "",
        toothNumbers: labWork.toothNumbers || [],
        shade: labWork.shade || "",
        material: labWork.material || "",
        remarks: labWork.remarks || "",
        othersText: labWork.othersText || "",
      });

      // Initialize attachments
      setExistingAttachments(labWork.attachments || []);
      setNewAttachments([]);
      setDeletedAttachments([]);
    }
  }, [labWork]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setNewAttachments((prev) => [...prev, ...files]);
    }
  };

  const handleRemoveNewFile = (index: number) => {
    setNewAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingFile = (publicId: string) => {
    setDeletedAttachments((prev) => [...prev, publicId]);
    setExistingAttachments((prev) =>
      prev.filter((a) => a.public_id !== publicId)
    );
  };

  const handleUndoDelete = (attachment: Attachment) => {
    setDeletedAttachments((prev) =>
      prev.filter((id) => id !== attachment.public_id)
    );
    setExistingAttachments((prev) => [...prev, attachment]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate form
    const newErrors: Record<string, string> = {};
    if (!formData.orderType) newErrors.orderType = "Order type is required";
    if (formData.orderType === "Others" && !formData.othersText) {
      newErrors.othersText = "Description is required for 'Others'";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!labWork) return;

    try {
      // Replace the problematic code in handleSubmit
      const toothNumbersValue = formData.toothNumbers;
      let toothNumbersArray: (string | number)[] = [];

      if (typeof toothNumbersValue === "string") {
        toothNumbersArray = toothNumbersValue
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
      } else if (Array.isArray(toothNumbersValue)) {
        toothNumbersArray = toothNumbersValue;
      }

      const updates = {
        ...formData,
        toothNumbers: toothNumbersArray,
        deletedAttachments,
      };

      // Create FormData for files
      const formDataToSend = new FormData();
      newAttachments.forEach((file) => {
        formDataToSend.append("attachments", file);
      });

      // Append JSON data
      formDataToSend.append("updates", JSON.stringify(updates));

      // Dispatch update action
      await dispatch(
        updateLabWork({
          id: labWork.id,
          updates: formDataToSend,
        })
      ).unwrap();

      onSuccess();
    } catch (error) {
      console.error("Failed to update lab work:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!labWork) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Edit Lab Work</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Status */}
        <div>
          <Label>Status</Label>
          <Select
            value={formData.status}
            onValueChange={(val) =>
              setFormData((prev) => ({
                ...prev,
                status: val as EditableLabWorkFields["status"],
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Received">Received</SelectItem>
              <SelectItem value="Rework">Rework</SelectItem>
              <SelectItem value="Fitted">Fitted</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Expected Delivery Date */}
        <div>
          <Label>Expected Delivery Date</Label>
          <Input
            type="date"
            name="expectedDeliveryDate"
            value={(formData.expectedDeliveryDate as string) || ""}
            onChange={handleChange}
          />
        </div>

        {/* Order Type */}
        <div>
          <Label>Order Type</Label>
          <Select
            key={`order-type-${formData.orderType}`} // Force re-render when value changes
            value={formData.orderType}
            onValueChange={(val) =>
              setFormData((prev) => ({ ...prev, orderType: val }))
            }
          >
            <SelectTrigger>
              {/* Show the current value if it exists */}
              <SelectValue
                placeholder={formData.orderType || "Select order type"}
              />
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
              value={formData.othersText || ""} // Add fallback to empty string
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
          <Label>Tooth Numbers (comma separated)</Label>
          <Input
            name="toothNumbers"
            value={
              Array.isArray(formData.toothNumbers)
                ? formData.toothNumbers.join(", ")
                : formData.toothNumbers || ""
            }
            onChange={handleChange}
            placeholder="e.g., 12, 13, 14"
          />
        </div>

        {/* Shade */}
        <div>
          <Label>Shade</Label>
          <Input
            name="shade"
            value={formData.shade || ""}
            onChange={handleChange}
            placeholder="Enter shade"
          />
        </div>

        {/* Material - Simplified */}
        {formData.orderType && (
          <div>
            <Label>Material</Label>
            <Select
              value={formData.material || ""}
              onValueChange={(val) =>
                setFormData((prev) => ({ ...prev, material: val }))
              }
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

        {/* Remarks */}
        <div>
          <Label>Remarks</Label>
          <Input
            name="remarks"
            value={formData.remarks || ""}
            onChange={handleChange}
            placeholder="Enter remarks"
          />
        </div>
        {/* Attachments Section */}
        <div className="mt-6">
          <Label>Attachments</Label>

          {/* Existing Attachments */}
          {existingAttachments.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2">Current Attachments</h3>
              <ul className="space-y-2">
                {existingAttachments.map((attachment) => (
                  <li
                    key={attachment.public_id}
                    className="flex items-center justify-between border p-2 rounded"
                  >
                    <div className="flex items-center">
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {attachment.original_filename}
                      </a>
                      <span className="text-xs text-gray-500 ml-2">
                        ({Math.round(attachment.bytes / 1024)} KB)
                      </span>
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() =>
                        handleRemoveExistingFile(attachment.public_id)
                      }
                    >
                      <Trash2 size={16} />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Deleted Attachments */}
          {deletedAttachments.length > 0 && (
            <div className="mb-4 bg-yellow-50 p-3 rounded">
              <h3 className="text-sm font-medium mb-2">Removed Attachments</h3>
              <ul className="space-y-2">
                {labWork.attachments
                  ?.filter((a) => deletedAttachments.includes(a.public_id))
                  .map((attachment) => (
                    <li
                      key={attachment.public_id}
                      className="flex items-center justify-between border p-2 rounded"
                    >
                      <div>
                        {attachment.original_filename}
                        <span className="text-xs text-gray-500 ml-2">
                          ({Math.round(attachment.bytes / 1024)} KB)
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUndoDelete(attachment)}
                      >
                        Undo
                      </Button>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {/* New Attachments */}
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2">Add New Attachments</h3>
            <div className="flex items-center gap-2 mb-2">
              <Label
                htmlFor="new-attachments"
                className="flex items-center gap-1 px-4 py-2 border rounded-md cursor-pointer bg-gray-50 hover:bg-gray-100"
              >
                <FilePlus2 size={16} /> Add Files
              </Label>
              <Input
                id="new-attachments"
                type="file"
                multiple
                accept="image/*, application/pdf"
                className="hidden"
                onChange={handleAddFiles}
              />
            </div>

            {newAttachments.length > 0 && (
              <ul className="space-y-2">
                {newAttachments.map((file, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between border p-2 rounded"
                  >
                    <div>
                      {file.name}
                      <span className="text-xs text-gray-500 ml-2">
                        ({(file.size / 1024).toFixed(2)} KB)
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveNewFile(index)}
                    >
                      <X size={16} />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            type="button"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditLabWorkForm;
