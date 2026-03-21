import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, AlertCircle } from "lucide-react";

interface DeleteBillingModalProps {
  open: boolean;
  billing: {
    _id: string;
    invoiceId: string;
    patientName: string;
    totalAmount: number;
  } | null;
  onClose: () => void;
  onConfirm: (billingId: string) => void;
  isLoading?: boolean;
}

export default function DeleteBillingModal({
  open,
  billing,
  onClose,
  onConfirm,
  isLoading = false,
}: DeleteBillingModalProps) {
  const handleConfirm = () => {
    if (billing) {
      onConfirm(billing._id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle size={24} />
            Delete Billing Record
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this billing record? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {billing && (
          <div className="space-y-3 p-4 bg-muted rounded-lg">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">Invoice ID:</div>
              <div className="font-medium">{billing.invoiceId}</div>
              
              <div className="text-muted-foreground">Patient:</div>
              <div className="font-medium">{billing.patientName}</div>
              
              <div className="text-muted-foreground">Amount:</div>
              <div className="font-medium">₹{billing.totalAmount.toLocaleString()}</div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Trash2 size={16} />
            {isLoading ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}