"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface DeleteLabWorkModalProps {
  open: boolean;
  onClose: () => void;
  labWork: {
    _id: string;
    labName: string;
    orderType: string;
    patientName: string;
  };
  onConfirm: (labWorkId: string) => void;
  isLoading?: boolean;
}

const DeleteLabWorkModal: React.FC<DeleteLabWorkModalProps> = ({
  open,
  onClose,
  labWork,
  onConfirm,
  isLoading = false,
}) => {
  const handleDelete = async () => {
    if (labWork._id) {
      onConfirm(labWork._id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Delete Lab Work
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this lab work order? This action cannot be undone.
          </p>

          <div className="bg-muted p-3 rounded-md">
            <p className="text-sm font-medium">Lab Work Details:</p>
            <p className="text-sm text-muted-foreground mt-1">
              <span className="font-medium">Lab Name:</span>{" "}
              {labWork.labName}
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Order Type:</span>{" "}
              {labWork.orderType}
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Patient:</span>{" "}
              {labWork.patientName}
            </p>
          </div>

          <p className="text-sm text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded-md">
            <span className="font-medium">Warning:</span> This will permanently delete the lab work order.
          </p>
        </div>

        <DialogFooter>
          <div className="flex justify-between w-full">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Trash2 size={16} />
              {isLoading ? "Deleting..." : "Delete Lab Work"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteLabWorkModal;