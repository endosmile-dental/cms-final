"use client";

import React, { useState, useEffect } from "react";
import {
  StickyNote,
  Plus,
  Edit,
  Clock,
  User,
  AlertCircle,
  Lock,
  Tag,
  X,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import SectionHeader from "../SectionHeader";
import { useAppDispatch, useAppSelector } from "@/app/redux/store/hooks";
import {
  fetchNotes,
  addNote,
  updateNote,
  deleteNote,
  INote,
  selectNotes,
  selectNotesLoading,
  selectNotesError,
} from "@/app/redux/slices/noteSlice";
import { useSession } from "next-auth/react";
import DeleteNoteModal from "./DeleteNoteModal";

interface PatientNotesSectionProps {
  patientId: string;
  doctorId: string;
  clinicId: string;
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

const PRIORITY_BORDER_COLORS: Record<INote["priority"], string> = {
  Low: "border-gray-400",
  Medium: "border-blue-400",
  High: "border-orange-400",
  Urgent: "border-red-500",
};

export default function PatientNotesSection({
  patientId,
  doctorId,
  clinicId,
}: PatientNotesSectionProps) {
  const dispatch = useAppDispatch();
  useSession();
  const notes = useAppSelector(selectNotes);
  const loading = useAppSelector(selectNotesLoading);
  const error = useAppSelector(selectNotesError);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<INote | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<INote | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "Clinical" as INote["category"],
    priority: "Medium" as INote["priority"],
    isPrivate: false,
    tags: [] as string[],
  });
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    if (patientId) {
      dispatch(fetchNotes({ patientId, doctorId }));
    }
  }, [dispatch, patientId, doctorId]);

  const handleOpenAddDialog = () => {
    setFormData({
      title: "",
      content: "",
      category: "Clinical",
      priority: "Medium",
      isPrivate: false,
      tags: [],
    });
    setIsAddDialogOpen(true);
  };

  const handleOpenEditDialog = (note: INote) => {
    setFormData({
      title: note.title,
      content: note.content,
      category: note.category,
      priority: note.priority,
      isPrivate: note.isPrivate,
      tags: note.tags || [],
    });
    setEditingNote(note);
  };

  const handleCloseDialogs = () => {
    setIsAddDialogOpen(false);
    setEditingNote(null);
    setFormData({
      title: "",
      content: "",
      category: "Clinical",
      priority: "Medium",
      isPrivate: false,
      tags: [],
    });
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.content.trim()) return;

    try {
      if (editingNote) {
        await dispatch(
          updateNote({
            noteId: editingNote._id,
            title: formData.title,
            content: formData.content,
            category: formData.category,
            priority: formData.priority,
            isPrivate: formData.isPrivate,
            tags: formData.tags,
          })
        ).unwrap();
      } else {
        await dispatch(
          addNote({
            patientId,
            doctorId: doctorId as unknown as { _id: string; fullName: string },
            clinicId,
            title: formData.title,
            content: formData.content,
            category: formData.category,
            priority: formData.priority,
            isPrivate: formData.isPrivate,
            tags: formData.tags,
          })
        ).unwrap();
      }
      handleCloseDialogs();
    } catch (err) {
      console.error("Failed to save note:", err);
    }
  };

  const handleOpenDeleteDialog = (note: INote) => {
    setNoteToDelete(note);
  };

  const handleCloseDeleteDialog = () => {
    setNoteToDelete(null);
  };

  const handleConfirmDelete = async (noteId: string) => {
    setIsDeleting(true);
    try {
      await dispatch(deleteNote(noteId)).unwrap();
      handleCloseDeleteDialog();
    } catch (err) {
      console.error("Failed to delete note:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredNotes = notes.filter((note) => {
    if (filterCategory !== "all" && note.category !== filterCategory)
      return false;
    if (filterPriority !== "all" && note.priority !== filterPriority)
      return false;
    if (
      searchQuery &&
      !note.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !note.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <div className="bg-card border-border p-6 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <SectionHeader
          icon={<StickyNote className="text-amber-500" size={20} />}
          title="Patient Notes"
        />
        <Button onClick={handleOpenAddDialog} className="flex items-center gap-2">
          <Plus size={16} />
          Add Note
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="Clinical">Clinical</SelectItem>
            <SelectItem value="Personal">Personal</SelectItem>
            <SelectItem value="Reminder">Reminder</SelectItem>
            <SelectItem value="Follow-up">Follow-up</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="Urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading && notes.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading notes...
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-500 flex items-center justify-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <StickyNote size={48} className="mx-auto mb-4 opacity-50" />
          <p>No notes found for this patient.</p>
          <p className="text-sm mt-2">Click &#34;Add Note&#34; to create the first note.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredNotes.map((note) => (
            <Card
              key={note._id}
              className={`border-l-4 ${PRIORITY_BORDER_COLORS[note.priority]}`}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{note.title}</h3>
                      {note.isPrivate && (
                        <Lock size={14} className="text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
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
                      {note.tags && note.tags.length > 0 && (
                        <>
                          <Tag size={14} className="text-muted-foreground" />
                          {note.tags.map((tag, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEditDialog(note)}
                    >
                      <Edit size={14} />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleOpenDeleteDialog(note)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        <line x1="10" x2="10" y1="11" y2="17" />
                        <line x1="14" x2="14" y1="11" y2="17" />
                      </svg>
                    </Button>
                  </div>
                </div>
                <p className="text-muted-foreground whitespace-pre-wrap mb-3">
                  {note.content}
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock size={12} />
                    {format(new Date(note.createdAt), "MMM d, yyyy h:mm a")}
                  </div>
                  {note.doctorId && typeof note.doctorId === "object" && "fullName" in note.doctorId && (
                    <div className="flex items-center gap-1">
                      <User size={12} />
                      {note.doctorId.fullName}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Note Dialog */}
      <Dialog open={isAddDialogOpen || !!editingNote} onOpenChange={handleCloseDialogs}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingNote ? "Edit Note" : "Add New Note"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Title</label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Enter note title"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Content</label>
              <Textarea
                value={formData.content}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, content: e.target.value }))
                }
                placeholder="Enter note content"
                rows={6}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <Select
                  value={formData.category}
                  onValueChange={(value: INote["category"]) =>
                    setFormData((prev) => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Clinical">Clinical</SelectItem>
                    <SelectItem value="Personal">Personal</SelectItem>
                    <SelectItem value="Reminder">Reminder</SelectItem>
                    <SelectItem value="Follow-up">Follow-up</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Priority</label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: INote["priority"]) =>
                    setFormData((prev) => ({ ...prev, priority: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPrivate"
                checked={formData.isPrivate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, isPrivate: e.target.checked }))
                }
                className="rounded border-gray-300"
              />
              <label htmlFor="isPrivate" className="text-sm">
                Private note (only visible to you)
              </label>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Tags</label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Enter tag and press + to add"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={handleAddTag}>
                  <Plus size={16} />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, idx) => (
                  <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X size={12} />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={handleCloseDialogs}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} className="flex items-center gap-2">
                <Save size={16} />
                {editingNote ? "Update Note" : "Save Note"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Note Confirmation Modal */}
      <DeleteNoteModal
        open={!!noteToDelete}
        onClose={handleCloseDeleteDialog}
        note={noteToDelete}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}
