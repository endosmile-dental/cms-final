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
  showSearch?: boolean; // Add this prop
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
}: DataTableProps<T>) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [search, setSearch] = useState("");

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

    // Sorting implementation
    if (sortKey) {
      result.sort((a, b) => {
        const valA = a[sortKey];
        const valB = b[sortKey];

        // Determine type of value for dynamic comparison
        const isNumber = typeof valA === "number" && typeof valB === "number";
        const isDate = valA instanceof Date && valB instanceof Date;

        if (isNumber) {
          return sortOrder === "asc"
            ? (valA as number) - (valB as number)
            : (valB as number) - (valA as number);
        } else if (isDate) {
          return sortOrder === "asc"
            ? (valA as Date).getTime() - (valB as Date).getTime()
            : (valB as Date).getTime() - (valA as Date).getTime();
        } else {
          const strA = String(valA).toLowerCase();
          const strB = String(valB).toLowerCase();
          return sortOrder === "asc"
            ? strA.localeCompare(strB)
            : strB.localeCompare(strA);
        }
      });
    }

    return result;
  }, [data, search, sortKey, sortOrder, searchFields, columns]);

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
  }, [search]);

  return (
    <div className="space-y-4 bg-white p-4 rounded-lg shadow-lg">
      <div className="flex justify-between items-center gap-x-2">
        {/* Conditionally render search bar */}
        {showSearch && (
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-sm"
          />
        )}
        {title && <h2 className="text-base md:text-xl font-semibold">{title}</h2>}
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
                      : String(row[column.accessorKey])}
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
