"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { H1BRecord } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";

interface DataTableProps {
  data: H1BRecord[];
  isLoading: boolean;
  totalCount: number;
  page: number;
  pageSize: number;
  sortField: string;
  sortDirection: "asc" | "desc";
  onPageChange: (page: number) => void;
  onSort: (field: string) => void;
}

const wageLevelStyles: Record<string, string> = {
  I: "bg-blue-50 text-blue-700 border-blue-200",
  II: "bg-emerald-50 text-emerald-700 border-emerald-200",
  III: "bg-purple-50 text-purple-700 border-purple-200",
  IV: "bg-amber-50 text-amber-700 border-amber-200",
};

export function DataTable({
  data,
  isLoading,
  totalCount,
  page,
  pageSize,
  sortField,
  sortDirection,
  onPageChange,
  onSort,
}: DataTableProps) {
  const totalPages = Math.ceil(totalCount / pageSize);
  const startRecord = page * pageSize + 1;
  const endRecord = Math.min((page + 1) * pageSize, totalCount);

  const SortableHeader = ({
    field,
    children,
    className = "",
  }: {
    field: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <TableHead className={className}>
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 gap-1 text-xs font-semibold text-white/90 hover:text-white hover:bg-white/10"
        onClick={() => onSort(field)}
      >
        {children}
        <ArrowUpDown className="h-3 w-3" />
        {sortField === field && (
          <span className="text-[#C4A35A] text-[10px] font-bold">
            {sortDirection === "asc" ? "ASC" : "DESC"}
          </span>
        )}
      </Button>
    </TableHead>
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#1B2A4A]/5 mb-4">
          <span className="text-2xl">0</span>
        </div>
        <p className="text-lg font-medium text-[#1B2A4A]">No results found</p>
        <p className="text-sm mt-1 text-muted-foreground">
          Try adjusting your search or filter criteria
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Results count */}
      <div className="flex items-center justify-between text-sm">
        <p className="text-muted-foreground">
          Showing{" "}
          <span className="font-semibold text-[#1B2A4A]">
            {startRecord.toLocaleString()}-{endRecord.toLocaleString()}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-[#1B2A4A]">
            {totalCount.toLocaleString()}
          </span>{" "}
          results
        </p>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#1B2A4A] hover:bg-[#1B2A4A]">
              <SortableHeader field="employer_name">Employer</SortableHeader>
              <SortableHeader field="job_title">Job Title</SortableHeader>
              <TableHead className="hidden lg:table-cell">
                <span className="text-xs font-semibold text-white/90">Location</span>
              </TableHead>
              <SortableHeader field="wage_rate_of_pay_from" className="text-right">
                Base Salary
              </SortableHeader>
              <SortableHeader field="prevailing_wage" className="text-right hidden md:table-cell">
                Prevailing Wage
              </SortableHeader>
              <TableHead className="hidden sm:table-cell">
                <span className="text-xs font-semibold text-white/90">Level</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((record, index) => (
              <TableRow
                key={record.id}
                className={`hover:bg-[#1B2A4A]/[0.03] transition-colors ${
                  index % 2 === 0 ? "bg-white" : "bg-[#FAF7F0]/50"
                }`}
              >
                <TableCell className="font-medium max-w-[200px] truncate text-[#1B2A4A]">
                  {record.employer_name}
                </TableCell>
                <TableCell className="max-w-[200px]">
                  <div className="truncate font-medium">{record.job_title}</div>
                  <div className="text-xs text-muted-foreground truncate mt-0.5">
                    {record.soc_title}
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell text-sm max-w-[180px] truncate text-muted-foreground">
                  {record.worksite_address}
                </TableCell>
                <TableCell className="text-right font-mono font-semibold whitespace-nowrap text-[#1B2A4A]">
                  {formatCurrency(record.wage_rate_of_pay_from)}
                  {record.wage_rate_of_pay_to && (
                    <div className="text-xs text-muted-foreground font-normal">
                      to {formatCurrency(record.wage_rate_of_pay_to)}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right font-mono text-sm hidden md:table-cell text-muted-foreground whitespace-nowrap">
                  {formatCurrency(record.prevailing_wage)}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {record.pw_wage_level && (
                    <Badge
                      variant="outline"
                      className={`text-xs font-semibold ${
                        wageLevelStyles[record.pw_wage_level] || "bg-gray-50 text-gray-700 border-gray-200"
                      }`}
                    >
                      {record.pw_wage_level}
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Page <span className="font-semibold text-[#1B2A4A]">{page + 1}</span> of{" "}
          <span className="font-semibold text-[#1B2A4A]">{totalPages.toLocaleString()}</span>
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 0}
            className="border-[#1B2A4A]/20 hover:bg-[#1B2A4A] hover:text-white disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages - 1}
            className="border-[#1B2A4A]/20 hover:bg-[#1B2A4A] hover:text-white disabled:opacity-40"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
