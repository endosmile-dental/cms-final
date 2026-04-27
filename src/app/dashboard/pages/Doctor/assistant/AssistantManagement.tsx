"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/app/dashboard/layout/DashboardLayout";
import Loading from "@/app/components/loading/Loading";
import {
  Plus,
  Edit,
  Trash2,
  Check,
  AlertCircle,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  User,
  Calendar,
} from "lucide-react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface IAssistant {
  _id: string;
  fullName: string;
  email: string;
  contactNumber: string;
  specialization: string;
  bio?: string;
  profileImageUrl?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
  };
  qualifications?: string[];
  experienceYears: number;
  gender?: string;
  status: "Active" | "Inactive";
  joinDate: string;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  fullName: string;
  email: string;
  password: string;
  contactNumber: string;
  specialization: string;
  bio: string;
  experienceYears: number;
  gender: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
  };
  qualifications: string;
}

export default function AssistantManagement() {
  const [assistants, setAssistants] = useState<IAssistant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    password: "",
    contactNumber: "",
    specialization: "",
    bio: "",
    experienceYears: 0,
    gender: "Male",
    address: {
      street: "",
      city: "",
      state: "",
      postalCode: "",
    },
    qualifications: "",
  });

  // Fetch assistants on mount
  useEffect(() => {
    fetchAssistants();
  }, []);

  const fetchAssistants = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/doctor/assistant");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch assistants");
      }

      setAssistants(data.assistants || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch assistants");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    if (name.startsWith("address.")) {
      const addressField = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: name === "experienceYears" ? Number(value) : value,
      }));
    }
  };

  const handleOpenModal = (assistant?: IAssistant) => {
    // Check if trying to create a new assistant when one already exists
    if (!assistant && assistants.length > 0) {
      setError("Only one assistant can be added. Delete the existing assistant to add a new one.");
      return;
    }

    if (assistant) {
      setEditingId(assistant._id);
      setFormData({
        fullName: assistant.fullName,
        email: assistant.email,
        password: "",
        contactNumber: assistant.contactNumber,
        specialization: assistant.specialization,
        bio: assistant.bio || "",
        experienceYears: assistant.experienceYears,
        gender: assistant.gender || "Male",
        address: assistant.address || {
          street: "",
          city: "",
          state: "",
          postalCode: "",
        },
        qualifications: assistant.qualifications?.join(", ") || "",
      });
    } else {
      setEditingId(null);
      setFormData({
        fullName: "",
        email: "",
        password: "",
        contactNumber: "",
        specialization: "",
        bio: "",
        experienceYears: 0,
        gender: "Male",
        address: {
          street: "",
          city: "",
          state: "",
          postalCode: "",
        },
        qualifications: "",
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        qualifications: formData.qualifications
          .split(",")
          .map((q) => q.trim())
          .filter((q) => q),
        ...(editingId && { assistantId: editingId }),
      };

      const response = await fetch("/api/doctor/assistant", {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save assistant");
      }

      setSuccess(
        editingId
          ? "Assistant updated successfully!"
          : "Assistant created successfully!"
      );

      fetchAssistants();
      handleCloseModal();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save assistant");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteConfirmId(id);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/doctor/assistant?id=${deleteConfirmId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete assistant");
      }

      setSuccess("Assistant deleted successfully!");
      fetchAssistants();
      setShowDeleteConfirm(false);
      setDeleteConfirmId(null);

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete assistant");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Loading />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Header Section */}
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              👥 Manage Assistants
            </h1>
            <p className="mt-1 text-slate-600 dark:text-slate-300">
              Manage your clinical assistants and team members
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={() => handleOpenModal()}
              disabled={assistants.length > 0}
              title={assistants.length > 0 ? "Only one assistant can be added" : "Add a new assistant"}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 font-semibold shadow-lg transition ${
                assistants.length > 0
                  ? "cursor-not-allowed bg-gray-400 text-gray-600 opacity-50 dark:bg-gray-600 dark:text-gray-400"
                  : "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 hover:shadow-xl"
              }`}
            >
              <Plus size={20} />
              Add Assistant
            </button>
            {assistants.length > 0 && (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                One assistant already registered
              </span>
            )}
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="flex items-center gap-3 rounded-lg bg-green-100 p-4 text-green-800 dark:bg-green-900 dark:text-green-100">
            <Check size={20} />
            <span>{success}</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-3 rounded-lg bg-red-100 p-4 text-red-800 dark:bg-red-900 dark:text-red-100">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Assistants Grid */}
        {assistants.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg bg-slate-50 py-16 dark:bg-slate-800">
            <User size={48} className="mb-4 text-slate-400" />
            <p className="text-slate-600 dark:text-slate-300">
              No assistants yet. Add one to get started!
            </p>
            <button
              onClick={() => handleOpenModal()}
              className="mt-4 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Add your first assistant
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 py-5">
            {assistants.map((assistant) => (
              <div
                key={assistant._id}
                className="group relative overflow-hidden rounded-2xl bg-white shadow-lg transition duration-300 hover:shadow-2xl dark:bg-slate-800"
              >
                {/* Status Badge */}
                <div
                  className={`absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-semibold ${
                    assistant.status === "Active"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                  }`}
                >
                  {assistant.status}
                </div>

                {/* Profile Image */}
                <div className="h-32 bg-gradient-to-r from-blue-500 to-blue-600">
                  {assistant.profileImageUrl ? (
                    <Image
                      src={assistant.profileImageUrl}
                      alt={assistant.fullName}
                      width={300}
                      height={128}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-r from-blue-500 to-teal-500">
                      <User size={48} className="text-white opacity-50" />
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <div className="relative -mt-8 px-6 pb-6 pt-4">
                  {/* Avatar Circle */}
                  <div className="mb-4 flex justify-center">
                    <div className="rounded-full border-4 border-white bg-gradient-to-r from-blue-400 to-teal-400 p-1 dark:border-slate-800">
                      {assistant.profileImageUrl ? (
                        <Image
                          src={assistant.profileImageUrl}
                          alt={assistant.fullName}
                          width={80}
                          height={80}
                          className="h-20 w-20 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-blue-400 to-teal-400">
                          <span className="text-2xl font-bold text-white">
                            {assistant.fullName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Name and Title */}
                  <h3 className="text-center text-xl font-bold text-slate-900 dark:text-white">
                    {assistant.fullName}
                  </h3>
                  <p className="text-center text-sm text-blue-600 dark:text-blue-400">
                    {assistant.specialization}
                  </p>

                  {/* Details Grid */}
                  <div className="mt-4 space-y-2 border-t border-slate-200 pt-4 dark:border-slate-700">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <Mail size={16} />
                      <span className="truncate">{assistant.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <Phone size={16} />
                      <span>{assistant.contactNumber}</span>
                    </div>
                    {assistant.address?.city && (
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <MapPin size={16} />
                        <span>
                          {assistant.address.city}
                          {assistant.address.state && `, ${assistant.address.state}`}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <Briefcase size={16} />
                      <span>{assistant.experienceYears} years exp.</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <Calendar size={16} />
                      <span>
                        Joined{" "}
                        {new Date(assistant.joinDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Bio */}
                  {assistant.bio && (
                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                      &#34;{assistant.bio}&#34;
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => handleOpenModal(assistant)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-100 px-3 py-2 font-semibold text-blue-700 transition hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-100 dark:hover:bg-blue-800"
                    >
                      <Edit size={16} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(assistant._id)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-100 px-3 py-2 font-semibold text-red-700 transition hover:bg-red-200 dark:bg-red-900 dark:text-red-100 dark:hover:bg-red-800"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Modal */}
        <Dialog open={showModal} onOpenChange={handleCloseModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                {editingId ? "Edit Assistant" : "Add New Assistant"}
              </DialogTitle>
            </DialogHeader>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name and Email Row */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                    className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    placeholder="john@clinic.com"
                  />
                </div>
              </div>

              {/* Password and Contact Row */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Password {!editingId && "*"}
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required={!editingId}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    placeholder="Enter password"
                  />
                  {editingId && (
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Leave empty to keep current password
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Contact Number *
                  </label>
                  <input
                    type="tel"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleInputChange}
                    required
                    className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    placeholder="+91 1234567890"
                  />
                </div>
              </div>

              {/* Specialization Row */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Specialization *
                </label>
                <input
                  type="text"
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleInputChange}
                  required
                  className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                  placeholder="Dental Assistant"
                />
              </div>

              {/* Experience and Gender Row */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Experience (Years)
                  </label>
                  <input
                    type="number"
                    name="experienceYears"
                    value={formData.experienceYears}
                    onChange={handleInputChange}
                    min="0"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    placeholder="5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                  placeholder="Brief bio..."
                  rows={3}
                />
              </div>

              {/* Qualifications */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Qualifications (comma-separated)
                </label>
                <input
                  type="text"
                  name="qualifications"
                  value={formData.qualifications}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                  placeholder="BDS, Dental Hygiene Certificate"
                />
              </div>

              {/* Address Section */}
              <div className="border-t border-slate-200 pt-4 dark:border-slate-700">
                <h3 className="mb-3 font-semibold text-slate-900 dark:text-white">
                  Address
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <input
                    type="text"
                    name="address.street"
                    value={formData.address.street}
                    onChange={handleInputChange}
                    placeholder="Street"
                    className="rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                  />
                  <input
                    type="text"
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleInputChange}
                    placeholder="City"
                    className="rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                  />
                  <input
                    type="text"
                    name="address.state"
                    value={formData.address.state}
                    onChange={handleInputChange}
                    placeholder="State"
                    className="rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                  />
                  <input
                    type="text"
                    name="address.postalCode"
                    value={formData.address.postalCode}
                    onChange={handleInputChange}
                    placeholder="Postal Code"
                    className="rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseModal}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2"
                >
                  <Check size={18} />
                  {submitting ? "Saving..." : "Save Assistant"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={showDeleteConfirm} onOpenChange={(open) => {
          if (!open) {
            setShowDeleteConfirm(false);
            setDeleteConfirmId(null);
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="h-5 w-5" />
                Delete Assistant
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Are you sure you want to delete this assistant? This action cannot be undone.
              </p>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmId(null);
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={submitting}
                className="flex items-center gap-2"
              >
                <Trash2 size={16} />
                {submitting ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
