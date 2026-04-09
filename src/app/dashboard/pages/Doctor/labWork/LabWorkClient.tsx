"use client";
import React, { useState, useMemo, useEffect } from "react";
import {
  FlaskConical,
  PlusCircle,
  Search,
  Calendar,
  FileText,
  ChevronRight,
  ChevronLeft,
  Edit,
  Trash2,
  ImageIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import DashboardLayout from "@/app/dashboard/layout/DashboardLayout";
import AddLabWorkForm from "@/app/components/doctor/AddLabWorkForm";
import { useAppDispatch, useAppSelector } from "@/app/redux/store/hooks";
import {
  deleteLabWork,
  fetchLabWorks,
  selectAllLabWorks,
  hydrateLabWorks,
  LabWorkPatient,
  ILabWork,
} from "@/app/redux/slices/labWorkSlice";
import Modal from "@/app/components/Modal";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import EditLabWorkForm from "@/app/components/doctor/EditLabWorkForm";
import LabDashboardAnalytics from "@/app/components/doctor/LabDashboardAnalytics";
import { Attachment } from "@/app/model/LabWork.model";
import ViewAttachment from "@/app/components/doctor/ViewAttachment";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { DateRangeFilter } from "@/app/components/DateRangeFilter";

// Update interface to match actual data structure
export interface LabWorkItem {
  id: string;
  patientId: string;
  patientName: string;
  orderType: string;
  labName: string;
  status: "Pending" | "Received" | "Fitted" | "Rework" | "Cancelled";
  expectedDeliveryDate?: Date | string | null;
  reWorkSentDate?: Date | string | null; // Add reWorkSentDate
  othersText?: string | null; // Add null here
  toothNumbers?: (string | number)[] | null; // Allow numbers too if needed
  shade?: string | null;
  material?: string | null;
  impressionsTakenOn?: Date | string | null;
  sentToLabOn?: Date | string | null;
  receivedFromLabOn?: Date | string | null;
  fittedOn?: Date | string | null;
  remarks?: string | null;
  attachments?: Attachment[] | null;
}

type LabWorkStatus = LabWorkItem["status"];

export interface LabAnalytics {
  totalLabWorks: number;
  pendingLabWorks: number;
  receivedLabWorks: number;
  fittedLabWorks: number;
  cancelledLabWorks: number;
  reworkLabWorks: number;
  labWorkByType: Record<string, number>;
  labWorkByLab: Record<string, number>;
  monthlyLabWorks: Record<string, number>;
  averageTurnaroundTime: number;
}


const STATUS_PRIORITY: Record<LabWorkStatus, number> = {
  Pending: 1,
  Received: 2,
  Rework: 3,
  Fitted: 99,
  Cancelled: 100,
};

const isCompleted = (status: LabWorkItem["status"]) =>
  status === "Fitted" || status === "Cancelled";

// Helper to get the most relevant date for a given status (for within-group sorting)
const getRelevantDateForStatus = (item: LabWorkItem): number => {
  switch (item.status) {
    case 'Fitted':
      return new Date(item.fittedOn ?? item.receivedFromLabOn ?? item.sentToLabOn ?? 0).getTime();
    case 'Cancelled':
      return new Date(item.fittedOn ?? item.receivedFromLabOn ?? item.sentToLabOn ?? 0).getTime();
    case 'Pending':
      return new Date(item.sentToLabOn ?? item.impressionsTakenOn ?? 0).getTime();
    case 'Received':
      return new Date(item.receivedFromLabOn ?? item.sentToLabOn ?? 0).getTime();
    case 'Rework':
      return new Date(item.reWorkSentDate ?? item.sentToLabOn ?? 0).getTime();
    default:
      return new Date(item.sentToLabOn ?? 0).getTime();
  }
};

const advancedSortFn = (a: LabWorkItem, b: LabWorkItem): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getExpectedTime = (item: LabWorkItem) =>
    item.expectedDeliveryDate
      ? new Date(item.expectedDeliveryDate).setHours(0, 0, 0, 0)
      : Infinity;

  const aExpected = getExpectedTime(a);
  const bExpected = getExpectedTime(b);

  const aCompleted = isCompleted(a.status);
  const bCompleted = isCompleted(b.status);

  // 1️⃣ Push completed (Fitted / Cancelled) to bottom
  if (aCompleted && !bCompleted) return 1;
  if (!aCompleted && bCompleted) return -1;

  // 2️⃣ Overdue active work (before today)
  const aOverdue = aExpected < today.getTime();
  const bOverdue = bExpected < today.getTime();

  if (aOverdue && !bOverdue) return -1;
  if (!aOverdue && bOverdue) return 1;

  // 3️⃣ Expected today
  const aToday = aExpected === today.getTime();
  const bToday = bExpected === today.getTime();

  if (aToday && !bToday) return -1;
  if (!aToday && bToday) return 1;

  // 4️⃣ Future expected (earlier first)
  if (aExpected !== bExpected) {
    return aExpected - bExpected;
  }

  // 5️⃣ Status priority
  const statusDiff =
    STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status];

  if (statusDiff !== 0) return statusDiff;

  // 6️⃣ Within same status group → sort by relevant date descending (latest first)
  const aRelevantDate = getRelevantDateForStatus(a);
  const bRelevantDate = getRelevantDateForStatus(b);
  if (aRelevantDate !== bRelevantDate) {
    return bRelevantDate - aRelevantDate; // Descending: latest first
  }

  // 7️⃣ Final fallback → most recent sentToLabOn
  return (
    new Date(b.sentToLabOn ?? 0).getTime() -
    new Date(a.sentToLabOn ?? 0).getTime()
  );
};

const statusColor = {
  Pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
  Received: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  Fitted: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  Cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  Rework: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
};

const LabWork: React.FC<{
  initialLabWorks?: ILabWork[];
  initialAnalytics?: LabAnalytics;
  initialPatients?: LabWorkPatient[];
}> = ({ initialLabWorks }) => {
  const { data: session } = useSession();

  const dispatch = useAppDispatch();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6); // 6 items per page for grid of 3x2

  const [selectedLabWork, setSelectedLabWork] = useState<LabWorkItem | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isEditMode, setIsEditMode] = useState(false);

  // Add new state for attachment modal
  const [selectedAttachment, setSelectedAttachment] =
    useState<Attachment | null>(null);
  const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false);
  const [isDeletingAttachment, setIsDeletingAttachment] = useState(false);

  // Add state for date range filter
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  // Get actual data from Redux store
  const labWorks = useAppSelector(selectAllLabWorks);

  // Debug: Log all data states
  console.log("=== LABWORK DEBUG ===");
  console.log("1. initialLabWorks prop:", initialLabWorks);
  console.log("2. initialLabWorks length:", initialLabWorks?.length);
  console.log("3. Redux labWorks:", labWorks);
  console.log("4. Redux labWorks length:", labWorks?.length);
  console.log("5. Session:", session);

  // Hydrate Redux store with initial data if provided (SSR + Redux pattern)
  // Always hydrate with SSR data when available - SSR data is fresh from server
  React.useEffect(() => {
    console.log("=== HYDRATION EFFECT ===");
    console.log("SSR Data received:", initialLabWorks?.length, "items");
    console.log("SSR Data content:", JSON.stringify(initialLabWorks, null, 2));
    console.log("Redux labWorks before hydration:", labWorks.length, "items");
    // Always hydrate Redux store, even with empty array to ensure state is synchronized
    if (initialLabWorks !== undefined && initialLabWorks !== null) {
      console.log("Hydrating Redux with SSR data:", initialLabWorks);
      dispatch(hydrateLabWorks(initialLabWorks));
    } else {
      console.log("NOT hydrating - initialLabWorks is undefined or null");
    }
  }, [initialLabWorks, dispatch]);


  // Update handleDelete
  const handleDelete = () => {
    setShowConfirm(true);
  };

  // Transform and filter data
  const filteredData = useMemo(() => {
    console.log("=== FILTERED DATA TRANSFORMATION ===");
    console.log("6. labWorks from Redux:", labWorks);
    console.log("7. labWorks length:", labWorks?.length);
    console.log("8. searchTerm:", searchTerm);
    console.log("9. statusFilter:", statusFilter);
    console.log("10. startDate:", startDate);
    console.log("11. endDate:", endDate);
    
    if (!labWorks || labWorks.length === 0) {
      console.log("12. NO LABWORKS - returning empty array");
      return [];
    }
    
    const mapped = labWorks.map((work, index) => {
      console.log(`13. Mapping work ${index}:`, work);
      console.log(`14. work._id:`, work._id);
      console.log(`15. work.patientId:`, work.patientId);
      console.log(`16. work.patientId.fullName:`, work.patientId?.fullName);
      
      return {
        id: work._id.toString(), // Convert ObjectId to string
        patientId: work.patientId?._id || "",
        patientName: work.patientId?.fullName || "Unknown",
        orderType: work.orderType,
        labName: work.labName,
        status: work.status as LabWorkItem["status"],
        expectedDeliveryDate: work.expectedDeliveryDate,
        othersText: work?.othersText,
        toothNumbers: work?.toothNumbers,
        shade: work?.shade,
        material: work?.material,
        impressionsTakenOn: work?.impressionsTakenOn,
        sentToLabOn: work?.sentToLabOn,
        receivedFromLabOn: work?.receivedFromLabOn,
        fittedOn: work?.fittedOn,
        remarks: work?.remarks,
        attachments: work?.attachments,
      };
    });
    
    console.log("17. Mapped data:", mapped);
    
    const filteredBySearch = mapped.filter((item) =>
      item.patientName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    console.log("18. After search filter:", filteredBySearch);
    
    const filteredByStatus = filteredBySearch.filter((item) => statusFilter === "All" || item.status === statusFilter);
    console.log("19. After status filter:", filteredByStatus);
    
    // Apply date range filter on impressionsTakenOn
    const filteredByDate = filteredByStatus.filter((item) => {
      // If no date filters are set, include all items
      if (!startDate && !endDate) return true;
      
      // If item has no impressionsTakenOn date, exclude it when date filter is active
      if (!item.impressionsTakenOn) return false;
      
      const itemDate = new Date(item.impressionsTakenOn).setHours(0, 0, 0, 0);
      
      // Check start date (inclusive)
      if (startDate) {
        const startDateTime = new Date(startDate).setHours(0, 0, 0, 0);
        if (itemDate < startDateTime) return false;
      }
      
      // Check end date (inclusive)
      if (endDate) {
        const endDateTime = new Date(endDate).setHours(0, 0, 0, 0);
        if (itemDate > endDateTime) return false;
      }
      
      return true;
    });
    console.log("20. After date filter:", filteredByDate);
    
    const sorted = filteredByDate.sort(advancedSortFn);
    console.log("21. Final filteredData:", sorted);
    
    return sorted;
  }, [labWorks, searchTerm, statusFilter, startDate, endDate]);

  // Calculate pagination
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Get current items
  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const items = filteredData.slice(startIndex, startIndex + itemsPerPage);
    console.log("=== CURRENT ITEMS (Pagination) ===");
    console.log("19. currentPage:", currentPage);
    console.log("20. itemsPerPage:", itemsPerPage);
    console.log("21. startIndex:", startIndex);
    console.log("22. filteredData.length:", filteredData.length);
    console.log("23. currentItems:", items);
    console.log("24. currentItems.length:", items.length);
    return items;
  }, [currentPage, filteredData, itemsPerPage]);

  // Only fetch from API if we don't have SSR data
  useEffect(() => {
    if (session && (!initialLabWorks || initialLabWorks.length === 0)) {
      const { id, role } = session.user;
      if (role === "Doctor" || role === "Patient") {
        dispatch(fetchLabWorks({ userId: id, role }));
      } else {
        console.warn("Unsupported role:", role);
      }
    }
  }, [session, dispatch, initialLabWorks]);

  // Fetch data on component mount
  // useEffect(() => {
  //   dispatch(fetchLabWorks({}));
  // }, [dispatch]);

  // Handle page change
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = startPage + maxVisiblePages - 1;

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  const handleCardClick = (item: Omit<LabWorkItem, "attachments">) => {
    // Find the full labwork item with attachments from currentItems
    const fullItem = currentItems.find(lw => lw.id === item.id);
    if (fullItem) {
      setSelectedLabWork(fullItem);
      setIsModalOpen(true);
      setIsEditMode(false);
    }
  };

  const handleEdit = () => {
    setIsEditMode(true);
  };

  const handleConfirm = () => {
    if (!selectedLabWork) return;

    try {
      dispatch(deleteLabWork(selectedLabWork.id)).unwrap();
      setIsModalOpen(false);
      setShowConfirm(false);
      // Optional: Show success notification
    } catch (error) {
      console.error("Error deleting lab work:", error);
      // Optional: Show error notification
    }
  };

  // Add new function to handle attachment deletion
  const handleDeleteAttachment = async (publicId: string) => {
    if (!selectedLabWork) return;

    setIsDeletingAttachment(true);

    try {
      // Make API call to delete attachment
      const response = await fetch(`/api/doctor/labWork/deleteAttachments`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          labWorkId: selectedLabWork.id,
          publicId,
          format: selectedLabWork.attachments?.find(
            (a) => a.public_id === publicId
          )?.format, // Default to jpg if format not found
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete attachment");
      }

      // Update the selected lab work in state
      setSelectedLabWork((prev) => {
        if (!prev) return null;
        const updatedAttachments =
          prev.attachments?.filter((a) => a.public_id !== publicId) || [];
        return {
          ...prev,
          attachments: updatedAttachments,
        };
      });

      // Close the attachment modal
      setIsAttachmentModalOpen(false);

      // Show success message
      // (You can implement a toast notification here)
    } catch (error) {
      console.error("Error deleting attachment:", error);
      // Show error message
    } finally {
      setIsDeletingAttachment(false);
    }
  };

  // Loading and error states
  // if (loading) return <div>Loading lab works...</div>;
  // if (error) return <div>Error: {error}</div>;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          {/* Left Section */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FlaskConical className="text-purple-600" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Lab Work Orders
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Manage and track all patient lab work orders efficiently
              </p>
            </div>
          </div>

          {/* Right Section */}
          <Button
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
            onClick={() => setIsAddModalOpen(true)}
          >
            <PlusCircle size={18} />
            <span className="hidden sm:inline">Add Lab Work</span>
          </Button>

          {/* Modal */}
          <Modal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
          >
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Add New Lab Work</h2>
              <AddLabWorkForm
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={() => {
                  setIsAddModalOpen(false);
                }}
              />
            </div>
          </Modal>
        </div>

        {/* Search Bar and Filters */}
        <div className="w-full px-5 md:px-0 flex flex-col space-y-4">
          {/* First row: Search */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="w-full md:w-1/2 flex gap-2 items-center">
              <Search size={18} />
              <Input
                placeholder="Search by patient name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <Label>Status:</Label>
                <Select
                  value={statusFilter}
                  onValueChange={(value) => setStatusFilter(value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Received">Received</SelectItem>
                    <SelectItem value="Fitted">Fitted</SelectItem>
                    <SelectItem value="Rework">Rework</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Items per page selector */}
              <div className="flex items-center gap-2">
                <Label>Items per page:</Label>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => {
                    setItemsPerPage(Number(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6</SelectItem>
                    <SelectItem value="12">12</SelectItem>
                    <SelectItem value="18">18</SelectItem>
                    <SelectItem value="24">24</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Second row: Date Range Filter */}
          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            label="Impressions Date:"
          />
        </div>

        {/* Lab Work Cards */}
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {currentItems.map((item) => (
            <Card
              key={item.id}
              className="shadow-sm hover:shadow-md transition cursor-pointer"
              onClick={() => handleCardClick(item)}
            >
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <div className="font-semibold text-lg">
                    {item.patientName}
                  </div>
                  <Badge
                    className={cn(
                      "text-sm px-2 py-1 rounded-full",
                      statusColor[item.status]
                    )}
                  >
                    {item.status}
                  </Badge>
                </div>

                <div className="text-sm text-muted-foreground">
                  <FileText className="inline-block mr-1" size={16} />
                  {item.orderType} — {item.labName}
                </div>

                <div className="flex justify-between items-center text-xs mt-2">
                  <div className="flex items-center gap-1 text-gray-500">
                    <Calendar size={14} />
                    Expected:{" "}
                    <span className="font-medium text-gray-700">
                      {item.expectedDeliveryDate
                        ? new Date(
                          item.expectedDeliveryDate
                        ).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                  <div className="text-gray-400">#{item.id.slice(-6)}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
            <div className="text-sm text-muted-foreground">
              Showing {Math.min(currentItems.length, itemsPerPage)} of{" "}
              {totalItems} items
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} />
              </Button>

              {getPageNumbers().map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="icon"
                  onClick={() => goToPage(page)}
                >
                  {page}
                </Button>
              ))}

              <Button
                variant="outline"
                size="icon"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={16} />
              </Button>
            </div>

            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
          </div>
        )}

        {/* No results */}
        {filteredData.length === 0 && (
          <div className="text-center text-muted-foreground text-sm mt-8">
            {searchTerm
              ? `No lab work found for "${searchTerm}"`
              : "No lab work orders available"}
          </div>
        )}
      </div>

      {/* Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setIsEditMode(false);
          setSelectedLabWork(null);
        }}
      >
        <div className="p-2 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
          {isEditMode ? (
          <EditLabWorkForm
            labWork={selectedLabWork}
            onCancel={() => setIsEditMode(false)}
            onSuccess={() => {
              setIsEditMode(false);
              setIsModalOpen(false);
              setSelectedLabWork(null);
              // Fetch fresh data to ensure UI is updated
              if (session?.user) {
                const { id, role } = session.user;
                if (role === "Doctor" || role === "Patient") {
                  dispatch(fetchLabWorks({ userId: id, role }));
                }
              }
            }}
          />
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Lab Work Details
                </h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={handleEdit}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={handleDelete}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {selectedLabWork && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                  {/* Basic Information */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Patient Name
                    </h4>
                    <p className="text-gray-800 dark:text-gray-200">
                      {selectedLabWork.patientName}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Status
                    </h4>
                    <Badge className={cn(statusColor[selectedLabWork.status])}>
                      {selectedLabWork.status}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Order Type
                    </h4>
                    <p className="text-gray-800 dark:text-gray-200">
                      {selectedLabWork.orderType}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Lab Name
                    </h4>
                    <p className="text-gray-800 dark:text-gray-200">
                      {selectedLabWork.labName}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Expected Delivery
                    </h4>
                    <p className="text-gray-800 dark:text-gray-200">
                      {selectedLabWork.expectedDeliveryDate
                        ? new Date(
                          selectedLabWork.expectedDeliveryDate
                        ).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Work ID
                    </h4>
                    <p className="text-gray-800 dark:text-gray-200">
                      #{selectedLabWork.id.slice(-6)}
                    </p>
                  </div>

                  {/* Dental Details */}
                  <div className="md:col-span-2 mt-4 pt-4 border-t">
                    <h3 className="font-semibold mb-2 text-gray-800 dark:text-white">
                      Dental Details
                    </h3>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Tooth Numbers
                    </h4>
                    <p className="text-gray-800 dark:text-gray-200">
                      {selectedLabWork.toothNumbers &&
                        selectedLabWork.toothNumbers.length > 0
                        ? selectedLabWork.toothNumbers.join(", ")
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Shade
                    </h4>
                    <p className="text-gray-800 dark:text-gray-200">
                      {selectedLabWork.shade || "N/A"}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Material
                    </h4>
                    <p className="text-gray-800 dark:text-gray-200">
                      {selectedLabWork.material || "N/A"}
                    </p>
                  </div>
                  {selectedLabWork.orderType === "Others" && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        Other Details
                      </h4>
                      <p className="text-gray-800 dark:text-gray-200">
                        {selectedLabWork.othersText || "N/A"}
                      </p>
                    </div>
                  )}

                  {/* Timeline */}
                  <div className="md:col-span-2 mt-4 pt-4 border-t">
                    <h3 className="font-semibold mb-2 text-gray-800 dark:text-white">
                      Timeline
                    </h3>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Impressions Taken On
                    </h4>
                    <p className="text-gray-800 dark:text-gray-200">
                      {selectedLabWork.impressionsTakenOn
                        ? new Date(
                          selectedLabWork.impressionsTakenOn
                        ).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Sent To Lab On
                    </h4>
                    <p className="text-gray-800 dark:text-gray-200">
                      {selectedLabWork.sentToLabOn
                        ? new Date(
                          selectedLabWork.sentToLabOn
                        ).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Received From Lab On
                    </h4>
                    <p className="text-gray-800 dark:text-gray-200">
                      {selectedLabWork.receivedFromLabOn
                        ? new Date(
                          selectedLabWork.receivedFromLabOn
                        ).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Rework Sent On
                    </h4>
                    <p className="text-gray-800 dark:text-gray-200">
                      {selectedLabWork.reWorkSentDate
                        ? new Date(
                          selectedLabWork.reWorkSentDate
                        ).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Fitted On
                    </h4>
                    <p className="text-gray-800 dark:text-gray-200">
                      {selectedLabWork.fittedOn
                        ? new Date(
                          selectedLabWork.fittedOn
                        ).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>

                  {/* Additional Information */}
                  <div className="md:col-span-2 mt-4 pt-4 border-t">
                    <h3 className="font-semibold mb-2 text-gray-800 dark:text-white">
                      Additional Information
                    </h3>
                  </div>
                  <div className="md:col-span-2">
                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Remarks
                    </h4>
                    <p className="text-gray-800 dark:text-gray-200">
                      {selectedLabWork.remarks || "N/A"}
                    </p>
                  </div>
                  {selectedLabWork.attachments &&
                    selectedLabWork.attachments.length > 0 && (
                      <div className="md:col-span-2">
                        <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          Attachments
                        </h4>
                        <div className="grid grid-cols-3 gap-3 mt-2">
                          {selectedLabWork.attachments.map(
                            (attachment, index) => {
                              const isImage = [
                                "jpg",
                                "jpeg",
                                "png",
                                "webp",
                              ].includes(attachment.format.toLowerCase());
                              const isPDF =
                                attachment.format.toLowerCase() === "pdf";

                              return (
                                <div
                                  key={index}
                                  className="relative group border rounded-md overflow-hidden"
                                  onClick={() => {
                                    if (isImage) {
                                      setSelectedAttachment(attachment);
                                      setIsAttachmentModalOpen(true);
                                    } else if (isPDF) {
                                      window.open(attachment.url, "_blank");
                                    } else {
                                      // Download other file types
                                      const a = document.createElement("a");
                                      a.href = attachment.url;
                                      a.download = attachment.original_filename;
                                      a.click();
                                    }
                                  }}
                                >
                                  {isImage ? (
                                    <Image
                                      src={attachment.url}
                                      alt={attachment.original_filename}
                                      className="w-full h-24 object-cover cursor-pointer"
                                    />
                                  ) : (
                                    <div className="bg-gray-100 h-24 flex flex-col items-center justify-center p-2">
                                      <FileText className="h-8 w-8 text-gray-500" />
                                      <span className="text-xs mt-1 text-center truncate w-full px-1">
                                        {attachment.original_filename}
                                      </span>
                                    </div>
                                  )}
                                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                                    {isImage ? (
                                      <ImageIcon className="h-6 w-6 text-white opacity-0 group-hover:opacity-100" />
                                    ) : (
                                      <FileText className="h-6 w-6 text-white opacity-0 group-hover:opacity-100" />
                                    )}
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </div>
                      </div>
                    )}
                </div>
              )}
            </>
          )}
        </div>
      </Modal>

      {/* Attachment Viewing Modal */}
      <Modal
        isOpen={isAttachmentModalOpen}
        onClose={() => setIsAttachmentModalOpen(false)}
      >
        <div className="bg-white p-4 w-full max-w-4xl max-h-[90vh]">
          {selectedAttachment && (
            <ViewAttachment
              attachment={selectedAttachment}
              onDelete={handleDeleteAttachment}
              isDeleting={isDeletingAttachment}
            />
          )}
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showConfirm} onClose={() => setShowConfirm(false)}>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Confirm Deletion</h3>
          <p>Are you sure you want to delete this lab work?</p>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirm}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      <LabDashboardAnalytics />
    </DashboardLayout>
  );
};

export default LabWork;
