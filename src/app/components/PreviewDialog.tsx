"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading: boolean;
  error: string | null;
  title: string;
  description: string;
  confirmButtonText?: string;
  children: React.ReactNode;
}

export const PreviewDialog = ({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
  error,
  title,
  description,
  confirmButtonText = "Confirm Registration",
  children,
}: PreviewDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-4 bg-red-100 text-red-700 rounded">{error}</div>
        )}

        <div className="space-y-4 p-2 md:p-5">{children}</div>

        <div className="flex justify-end gap-4 mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Edit
          </Button>
          <Button onClick={onConfirm} disabled={isLoading}>
            {isLoading ? "Confirming..." : confirmButtonText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
