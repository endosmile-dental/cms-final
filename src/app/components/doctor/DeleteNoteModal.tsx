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
import { Badge } from "@/components/ui/badge";
import { Trash2, StickyNote, Clock, Tag } from "lucide-react";
import { format } from "date-fns";

interface INote {
  _id: string;
  title: string;
  content: string;
  category: "Clinical" | "Personal" | "Reminder" | "Follow-up" | "Other";
  priority: "Low" | "Medium" | "High" | "Urgent";
  isPrivate: boolean;
  tags: string[];
  createdAt: string | Date;
  updatedAt: string | Date;
}

const CATEGORY_COLORS: Record<INote["category"], string> = {
  Clinical: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  Personal: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  Reminder: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  "Follow-up": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  Other: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

const PRIORITY_COLORS: Record<INote["priority"], string> = {
  Low: "bg-gray-400",
  Medium: "bg-blue-400",
  High: "bg-orange-400",
  Urgent: "bg-red-500",
};

interface DeleteNoteModalProps {
  open: boolean;
  onClose: () => void;
  note: INote | null;
  onConfirm: (noteId: string) => void;
  isLoading?: boolean;
}

const DeleteNoteModal: React.FC<DeleteNoteModalProps> = ({
  open,
  onClose,
  note,
  onConfirm,
  isLoading = false,
}) => {
  const handleDelete = async () => {
    if (note?._id) {
      onConfirm(note._id);
    }
  };

  if (!note) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Delete Note
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this note? This action cannot be undone.
          </p>

          <div className="bg-muted p-3 rounded-md space-y-3">
            <div>
              <p className="text-sm font-medium">Note Details:</p>
            </div>

            <div className="flex items-center gap-2">
              <StickyNote className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-semibold">{note.title}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge className={CATEGORY_COLORS[note.category]}>
                {note.category}
              </Badge>
              <div className="flex items-center gap-1">
                <div
                  className={`w-3 h-3 rounded-full ${PRIORITY_COLORS[note.priority]}`}
                />
                <span className="text-sm text-muted-foreground">
                  {note.priority}
                </span>
              </div>
              {note.isPrivate && (
                <Badge variant="outline" className="text-xs">
                  Private
                </Badge>
              )}
            </div>

            {note.tags && note.tags.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <Tag className="h-4 w-4 text-muted-foreground" />
                {note.tags.map((tag, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-4 w-4" />
              Created: {format(new Date(note.createdAt), "MMM d, yyyy h:mm a")}
            </div>
          </div>

          <p className="text-sm text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded-md">
            <span className="font-medium">Warning:</span> This will permanently delete the note.
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
              {isLoading ? "Deleting..." : "Delete Note"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteNoteModal;