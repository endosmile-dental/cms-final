"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Patient } from "@/app/redux/slices/patientSlice";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  patients: Patient[];
  onSelect: (patient: Patient) => void;
};

const ITEMS_PER_PAGE = 10;

const PatientTable = ({ patients, onSelect }: Props) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<keyof Patient>("fullName");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [search, setSearch] = useState("");

  const filteredPatients = useMemo(() => {
    return patients
      .filter(
        (p) =>
          p.fullName.toLowerCase().includes(search.toLowerCase()) ||
          p.PatientId.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => {
        const valA = a[sortKey]?.toString().toLowerCase() || "";
        const valB = b[sortKey]?.toString().toLowerCase() || "";

        if (valA < valB) return sortOrder === "asc" ? -1 : 1;
        if (valA > valB) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
  }, [patients, search, sortKey, sortOrder]);

  const totalPages = Math.ceil(filteredPatients.length / ITEMS_PER_PAGE);

  const paginatedPatients = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPatients.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPatients, currentPage]);

  const toggleSort = (key: keyof Patient) => {
    if (key === sortKey) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex justify-between items-center">
        <Input
          placeholder="Search by name or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm"
        />
      </div>

      {/* Table */}
      <div className="w-full overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer"
                onClick={() => toggleSort("fullName")}
              >
                Full Name{" "}
                {sortKey === "fullName" && (sortOrder === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => toggleSort("PatientId")}
              >
                Patient ID{" "}
                {sortKey === "PatientId" && (sortOrder === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => toggleSort("contactNumber")}
              >
                Contact
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => toggleSort("gender")}
              >
                Gender{" "}
                {sortKey === "gender" && (sortOrder === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedPatients.map((patient) => (
              <TableRow
                key={patient._id}
                className="hover:bg-muted cursor-pointer"
                onClick={() => onSelect(patient)}
              >
                <TableCell>{patient.fullName}</TableCell>
                <TableCell>{patient.PatientId}</TableCell>
                <TableCell>{patient.contactNumber || "NA"}</TableCell>
                <TableCell>{patient.gender || "NA"}</TableCell>
                <TableCell className="text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(patient);
                    }}
                    className="text-sm text-primary hover:underline"
                  >
                    View
                  </button>
                </TableCell>
              </TableRow>
            ))}

            {paginatedPatients.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-gray-500 py-8"
                >
                  No patients found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-2">
        <span className="text-sm text-gray-600">
          Page {currentPage} of {totalPages}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={16} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PatientTable;
