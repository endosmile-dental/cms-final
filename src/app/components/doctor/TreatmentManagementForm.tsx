import React, { useState, useEffect } from "react";
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
import { useAppSelector } from "@/app/redux/store/hooks";
import { selectActiveTreatments } from "@/app/redux/slices/treatmentSlice";

// Define treatment interface locally
interface ITreatment {
  _id: string;
  name: string;
  category: string;
  description?: string;
  defaultPrice?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TreatmentManagementFormProps {
  treatment: ITreatment | null;
  onSuccess: () => void;
  onCancel: () => void;
  isEditing?: boolean; // New prop to control edit mode
}

const TreatmentManagementForm: React.FC<TreatmentManagementFormProps> = ({
  treatment,
  onSuccess,
  onCancel,
  isEditing = false,
}) => {
  const [formData, setFormData] = useState({
    name: treatment?.name || "",
    category: treatment?.category || "Other",
    description: treatment?.description || "",
    defaultPrice: treatment?.defaultPrice || 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTreatmentId, setSelectedTreatmentId] = useState<string>("");
  const [isFormEnabled, setIsFormEnabled] = useState(!isEditing);
  const activeTreatments = useAppSelector(selectActiveTreatments);

  // Initialize form data when treatment prop changes
  useEffect(() => {
    if (treatment) {
      setFormData({
        name: treatment.name || "",
        category: treatment.category || "Other",
        description: treatment.description || "",
        defaultPrice: treatment.defaultPrice || 0,
      });
      if (isEditing) {
        setSelectedTreatmentId(treatment._id);
        setIsFormEnabled(true);
      }
    }
  }, [treatment, isEditing]);

  // Handle treatment selection for edit mode
  const handleTreatmentSelect = (treatmentId: string) => {
    setSelectedTreatmentId(treatmentId);
    const selectedTreatment = activeTreatments.find(t => t._id === treatmentId);
    if (selectedTreatment) {
      setFormData({
        name: selectedTreatment.name || "",
        category: selectedTreatment.category || "Other",
        description: selectedTreatment.description || "",
        defaultPrice: selectedTreatment.defaultPrice || 0,
      });
      setIsFormEnabled(true);
    } else {
      setFormData({
        name: "",
        category: "Other",
        description: "",
        defaultPrice: 0,
      });
      setIsFormEnabled(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = treatment
        ? `/api/admin/treatments/${treatment._id}`
        : "/api/admin/treatments";
      const method = treatment ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save treatment");
      }

      onSuccess();
    } catch (error) {
      console.error("Error saving treatment:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to save treatment. Please try again.";
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!treatment) return;

    if (!confirm("Are you sure you want to delete this treatment?")) return;

    setIsLoading(true);

    try {
      const response = await fetch(`/api/admin/treatments/${treatment._id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete treatment");
      }

      onSuccess();
    } catch (error) {
      console.error("Error deleting treatment:", error);
      alert("Failed to delete treatment. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Treatment Selection Dropdown for Edit Mode */}
      {isEditing && (
        <div>
          <Label htmlFor="treatmentSelect">Select Treatment to Edit</Label>
          <Select
            value={selectedTreatmentId}
            onValueChange={handleTreatmentSelect}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a treatment to edit" />
            </SelectTrigger>
            <SelectContent>
              {activeTreatments.map((treatment) => (
                <SelectItem key={treatment._id} value={treatment._id}>
                  {treatment.name} - {treatment.category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Form Fields */}
      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label htmlFor="name">Treatment Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            placeholder="Enter treatment name"
            required
            disabled={!isFormEnabled}
            className={!isFormEnabled ? "opacity-50 cursor-not-allowed" : ""}
          />
        </div>

        <div>
          <Label htmlFor="category">Category</Label>
          <Select
            value={formData.category}
            onValueChange={(value) =>
              setFormData({ ...formData, category: value })
            }
            disabled={!isFormEnabled}
          >
            <SelectTrigger disabled={!isFormEnabled}>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Consultation">Consultation</SelectItem>
              <SelectItem value="Diagnostic">Diagnostic</SelectItem>
              <SelectItem value="Restorative">Restorative</SelectItem>
              <SelectItem value="Prosthodontics">Prosthodontics</SelectItem>
              <SelectItem value="Orthodontics">Orthodontics</SelectItem>
              <SelectItem value="Surgical">Surgical</SelectItem>
              <SelectItem value="Cosmetic">Cosmetic</SelectItem>
              <SelectItem value="Preventive">Preventive</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Enter treatment description (optional)"
            rows={3}
            disabled={!isFormEnabled}
            className={!isFormEnabled ? "opacity-50 cursor-not-allowed" : ""}
          />
        </div>

        <div>
          <Label htmlFor="defaultPrice">Default Price (₹)</Label>
          <Input
            id="defaultPrice"
            type="number"
            min="0"
            value={formData.defaultPrice}
            onChange={(e) =>
              setFormData({
                ...formData,
                defaultPrice: Number(e.target.value),
              })
            }
            placeholder="0"
            disabled={!isFormEnabled}
            className={!isFormEnabled ? "opacity-50 cursor-not-allowed" : ""}
          />
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <div className="flex gap-2">
          <Button type="submit" disabled={isLoading || (!isFormEnabled && isEditing)}>
            {isLoading ? "Saving..." : treatment ? "Update Treatment" : "Add Treatment"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
        
        {treatment && isFormEnabled && (
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            Delete Treatment
          </Button>
        )}
      </div>
    </form>
  );
};

export default TreatmentManagementForm;