"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BillingRecord } from "@/app/redux/slices/billingSlice";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EditBillingDialogProps {
  open: boolean;
  onClose: () => void;
  billing: BillingRecord | null;
  onSave: (updated: Partial<BillingRecord>) => void;
}

const EditBillingDialog: React.FC<EditBillingDialogProps> = ({
  open,
  onClose,
  billing,
  onSave,
}) => {
  const [form, setForm] = useState<BillingRecord | null>(null);
  const [initialForm, setInitialForm] = useState<BillingRecord | null>(null);

  useEffect(() => {
    if (billing) {
      setForm(billing);
      setInitialForm(billing);
    }
  }, [billing]);

  const handleChange = <K extends keyof BillingRecord>(
    key: K,
    value: BillingRecord[K]
  ) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : null));
  };

  const getUpdatedFields = (): Partial<BillingRecord> => {
    if (!form || !initialForm) return {};

    const updated: Partial<BillingRecord> = {};

    (Object.keys(form) as (keyof BillingRecord)[]).forEach((key) => {
      const oldValue = initialForm[key];
      const newValue = form[key];

      const isEqual = JSON.stringify(oldValue) === JSON.stringify(newValue);

      if (!isEqual) {
        (
          updated as Record<
            keyof BillingRecord,
            BillingRecord[keyof BillingRecord]
          >
        )[key] = newValue;
      }
    });

    if (initialForm._id) {
      updated._id = initialForm._id;
    }

    return updated;
  };

  const handleSubmit = () => {
    if (form && initialForm) {
      const updatedFields = getUpdatedFields();
      if (Object.keys(updatedFields).length > 0) {
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
          <DialogTitle>Edit Bill - {form.invoiceId}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Mode of Payment</Label>
            <Select
              value={form.modeOfPayment}
              onValueChange={(value) => handleChange("modeOfPayment", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select mode of payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Debit/Credit">Debit/Credit</SelectItem>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="UPI">UPI</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Amount Received</Label>
            <Input
              value={form.amountReceived}
              onChange={(e) =>
                handleChange("amountReceived", Number(e.target.value))
              }
              placeholder="Amount Received"
              type="number"
            />
          </div>

          <div className="space-y-1">
            <Label>Discount</Label>
            <Input
              value={form.discount}
              onChange={(e) => handleChange("discount", Number(e.target.value))}
              placeholder="Discount"
              type="number"
            />
          </div>

          <div className="space-y-1">
            <Label>Address</Label>
            <Input
              value={form.address ?? ""}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="Address"
            />
          </div>

          <div className="space-y-1">
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={(value) =>
                handleChange("status", value as BillingRecord["status"])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Partial">Partial</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit}>Save</Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditBillingDialog;
