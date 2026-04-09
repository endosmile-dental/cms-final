"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BillingRecord } from "@/app/redux/slices/billingSlice";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, X, Receipt, CreditCard, Edit3 } from "lucide-react";

interface EditBillingDialogProps {
  open: boolean;
  onClose: () => void;
  billing: BillingRecord | null;
  onSave: (updated: Partial<BillingRecord>) => void;
  onDelete?: (billingId: string) => void;
}

const EditBillingDialog: React.FC<EditBillingDialogProps> = ({
  open,
  onClose,
  billing,
  onSave,
  onDelete,
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

  const handleDelete = () => {
    if (form?._id) {
      if (onDelete) {
        onDelete(form._id);
      }
      onClose();
    }
  };

  // Disable background scrolling when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [open]);

  if (!open || !form) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="edit-billing-title"
      className="fixed z-50 inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm transition-all duration-300"
    >
      <div className="relative bg-card border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-100">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-green-500/10 to-transparent border-b border-border p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-500/10 rounded-full">
                <Edit3 className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <h2 id="edit-billing-title" className="text-2xl font-bold text-foreground">
                  Edit Billing Invoice
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Invoice ID: {form.invoiceId}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-muted transition-colors duration-200"
              aria-label="Close modal"
            >
              <X className="h-6 w-6 text-foreground" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
          {/* Payment Mode & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-foreground">
                <CreditCard className="h-4 w-4" />
                <span>Mode of Payment</span>
              </label>
              <Select
                value={form.modeOfPayment}
                onValueChange={(value) => handleChange("modeOfPayment", value)}
              >
                <SelectTrigger className="w-full">
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

            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-foreground">
                <span>Status</span>
              </label>
              <Select
                value={form.status}
                onValueChange={(value) =>
                  handleChange("status", value as BillingRecord["status"])
                }
              >
                <SelectTrigger className="w-full">
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

          {/* Amount Received & Discount */}
          <div className="border-t border-border pt-6">
            <div className="flex items-center space-x-3 mb-4">
              <Receipt className="h-5 w-5 text-green-500" />
              <h3 className="text-lg font-semibold text-foreground">Payment Details</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-medium text-foreground">
                  <span>Amount Received</span>
                </label>
                <Input
                  value={form.amountReceived}
                  onChange={(e) =>
                    handleChange("amountReceived", Number(e.target.value))
                  }
                  placeholder="Amount Received"
                  type="number"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-medium text-foreground">
                  <span>Discount</span>
                </label>
                <Input
                  value={form.discount}
                  onChange={(e) => handleChange("discount", Number(e.target.value))}
                  placeholder="Discount"
                  type="number"
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="border-t border-border pt-6">
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-foreground">
                <span>Address</span>
              </label>
              <Input
                value={form.address ?? ""}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="Address"
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-muted/50 border-t border-border p-6">
          <div className="flex justify-between items-center">
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="flex items-center gap-2"
            >
              <Trash2 size={16} />
              Delete
            </Button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-foreground bg-muted rounded-lg hover:bg-muted/80 transition-all duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditBillingDialog;