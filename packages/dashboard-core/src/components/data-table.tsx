import React from "react";
import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableFooter,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Loader2 } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./ui/pagination";

interface Column<T> {
  key: keyof T;
  label: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
  align?: "left" | "center" | "right";
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

interface TableProps<T> {
  data?: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  pagination?: PaginationProps;
  onRowClick?: (row: T) => void;
}

const alignClass = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
} as const;

export function DataTable<T>({
  data,
  columns,
  isLoading,
  pagination,
  onRowClick,
}: TableProps<T>) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableHead
              key={String(col.key)}
              className={`p-4 ${alignClass[col.align ?? "left"]}`}
            >
              {col.label}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell colSpan={columns.length} className="text-center py-6">
              <Loader2 className="animate-spin h-6 w-6 text-primary mx-auto scale-110" />
            </TableCell>
          </TableRow>
        ) : (
          (data || []).map((row, rowIndex) => (
            <TableRow
              key={rowIndex}
              onClick={() => onRowClick?.(row)}
              className="cursor-pointer hover:bg-gray-100"
            >
              {columns.map((col) => (
                <TableCell
                  key={String(col.key)}
                  className={`p-4 ${alignClass[col.align ?? "left"]}`}
                >
                  {col.render
                    ? col.render(row[col.key], row)
                    : String(row[col.key])}
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
      {pagination && (
        <TableFooter className="bg-transparent">
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={columns.length} className="text-right px-4">
              {pagination && <PaginationTable {...pagination} />}
            </TableCell>
          </TableRow>
        </TableFooter>
      )}
    </Table>
  );
}

export function PaginationTable({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  const { t } = useTranslation("components");

  const maxVisiblePages = 5;
  const pages: (number | string)[] = [];

  if (totalPages <= maxVisiblePages) {
    pages.push(...Array.from({ length: totalPages }, (_, i) => i + 1));
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("...");
    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(totalPages - 1, currentPage + 1);
      i++
    ) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="flex w-full justify-between items-center py-2 ">
      <div className="text-muted-foreground text-sm w-full flex justify-start">
        {t("pagination.pageInfo", { current: currentPage, total: totalPages })}
      </div>

      <Pagination className="justify-end">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
              className={`cursor-pointer ${currentPage === 1 ? "text-muted-foreground pointer-events-none" : ""}`}
            >
              {t("pagination.previous")}
            </PaginationPrevious>
          </PaginationItem>

          {pages.map((page, index) => (
            <PaginationItem key={index}>
              {page === "..." ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink
                  isActive={page === currentPage}
                  onClick={() => typeof page === "number" && onPageChange(page)}
                >
                  {page}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext
              onClick={() =>
                currentPage < totalPages && onPageChange(currentPage + 1)
              }
              className={`cursor-pointer ${currentPage === totalPages ? "text-muted-foreground pointer-events-none" : ""}`}
            >
              {t("pagination.next")}
            </PaginationNext>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
