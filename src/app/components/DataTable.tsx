"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type ColumnDef<T, K extends keyof T = keyof T> = {
  header: string;
  accessorKey: K;
  sortable?: boolean;
  render?: (value: T[K] | undefined, row: T) => React.ReactNode;
};

type DataTableProps<T> = {
  data: T[];
  title: string;
  columns: ColumnDef<T>[];
  searchFields?: (keyof T)[];
  itemsPerPage?: number;
  showSearch?: boolean;
  enableDateFilter?: boolean;
  dateField?: keyof T;
  filterMode?: "this month" | "this year" | "past year" | "all";
  onRowClick?: (row: T) => void;
};

const DataTable = <T extends object>({
  data,
  title,
  columns,
  searchFields,
  showSearch = true,
  itemsPerPage = 10,
  onRowClick,
  enableDateFilter = false,
  dateField,
}: DataTableProps<T>) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState<
    "this month" | "this year" | "past year" | "all"
  >("all");

  // Helper function to parse dd/mm/yyyy format
  const parseDate = (val: unknown): Date | null => {
    if (val == null) return null;

    if (typeof val === "string") {
      // Handle dd/mm/yyyy format
      const match = val.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
      if (match) {
        const [, day, month, year] = match;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }

      // Try parsing as ISO or other date formats
      const date = new Date(val);
      return isNaN(date.getTime()) ? null : date;
    }

    if (val instanceof Date) {
      return isNaN(val.getTime()) ? null : val;
    }

    return null;
  };

  const filteredData = useMemo(() => {
    let result = [...data];

    // Search implementation
    if (search) {
      const searchTerm = search.toLowerCase();
      result = result.filter((item) =>
        (searchFields ?? columns.map((c) => c.accessorKey)).some((key) =>
          String(item[key]).toLowerCase().includes(searchTerm)
        )
      );
    }

    // Date filtering implementation
    if (enableDateFilter && dateField) {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth(); // 0-indexed (0 = January)

      result = result.filter((item) => {
        const itemDate = parseDate(item[dateField]);
        if (!itemDate) return filterMode === "all"; // Include if no date and filter is "all"

        const itemYear = itemDate.getFullYear();
        const itemMonth = itemDate.getMonth();

        if (filterMode === "this month") {
          return itemMonth === currentMonth && itemYear === currentYear;
        }
        if (filterMode === "this year") {
          return itemYear === currentYear;
        }
        if (filterMode === "past year") {
          return itemYear === currentYear - 1;
        }
        return true; // "all"
      });
    }

    // Sorting implementation
    if (sortKey) {
      result.sort((a, b) => {
        const valA = a[sortKey];
        const valB = b[sortKey];

        // For date sorting, parse the dates
        if (sortKey === dateField) {
          const dateA = parseDate(valA)?.getTime() || 0;
          const dateB = parseDate(valB)?.getTime() || 0;
          return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
        }

        // Numeric comparison
        if (typeof valA === "number" && typeof valB === "number") {
          return sortOrder === "asc" ? valA - valB : valB - valA;
        }

        // String comparison (fallback)
        const strA = String(valA ?? "").toLowerCase();
        const strB = String(valB ?? "").toLowerCase();
        return sortOrder === "asc"
          ? strA.localeCompare(strB)
          : strB.localeCompare(strA);
      });
    }

    return result;
  }, [
    data,
    search,
    sortKey,
    sortOrder,
    searchFields,
    columns,
    enableDateFilter,
    dateField,
    filterMode,
  ]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const handleSort = (key: keyof T) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterMode]);

  return (
    <div className="space-y-4 bg-white p-4 rounded-lg shadow-lg">
      <div className="flex justify-between items-center gap-x-2">
        {/* Conditionally render search bar */}
        <div className="flex gap-x-1">
          {showSearch && (
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full max-w-sm"
            />
          )}
          {enableDateFilter && (
            <Select
              value={filterMode}
              onValueChange={(
                v: "this month" | "this year" | "past year" | "all"
              ) => setFilterMode(v)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="this month">This Month</SelectItem>
                <SelectItem value="this year">This Year</SelectItem>
                <SelectItem value="past year">Past Year</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        {title && (
          <h2 className="text-base md:text-xl font-semibold">{title}</h2>
        )}
      </div>

      <div className="w-full overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={String(column.accessorKey)}
                  className={column.sortable ? "cursor-pointer" : ""}
                  onClick={() =>
                    column.sortable && handleSort(column.accessorKey)
                  }
                >
                  <div className="flex items-center gap-1">
                    {column.header}
                    {column.sortable && sortKey === column.accessorKey && (
                      <span className="text-muted-foreground font-semibold">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((row, index) => (
              <TableRow
                key={index}
                className={onRowClick ? "hover:bg-muted cursor-pointer" : ""}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => (
                  <TableCell
                    key={String(column.accessorKey)}
                    className="min-w-[120px]"
                  >
                    {column.render
                      ? column.render(row[column.accessorKey], row)
                      : String(row[column.accessorKey] ?? "N/A")}
                  </TableCell>
                ))}
              </TableRow>
            ))}

            {paginatedData.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center text-gray-500 py-4"
                >
                  No records found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

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

export default DataTable;
