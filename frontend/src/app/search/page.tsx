"use client";

import { Suspense, useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getH1BData } from "@/lib/api";
import { detectStateInQuery } from "@/lib/states";
import { SearchFilters } from "@/components/search-filters";
import { DataTable } from "@/components/data-table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronUp, Lightbulb } from "lucide-react";

const PAGE_SIZE = 25;

interface FilterState {
  employer_name: string;
  job_title: string;
  location: string;
  pw_wage_level: string;
  wage_min: string;
  wage_max: string;
}

const emptyFilters: FilterState = {
  employer_name: "",
  job_title: "",
  location: "",
  pw_wage_level: "",
  wage_min: "",
  wage_max: "",
};

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showFilters, setShowFilters] = useState(true);

  // Initialize from URL params
  const [filters, setFilters] = useState<FilterState>(() => ({
    employer_name: searchParams.get("employer") || "",
    job_title: searchParams.get("job") || "",
    location: searchParams.get("location") || "",
    pw_wage_level: searchParams.get("level") || "",
    wage_min: searchParams.get("wage_min") || "",
    wage_max: searchParams.get("wage_max") || "",
  }));

  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("q") || ""
  );
  const [page, setPage] = useState(0);
  const [sortField, setSortField] = useState(
    searchParams.get("sort")?.split(".")[0] || "wage_rate_of_pay_from"
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">(
    (searchParams.get("sort")?.split(".")[1] as "asc" | "desc") || "desc"
  );

  // Build API query
  const apiFilters = {
    employer_name: filters.employer_name || undefined,
    job_title: filters.job_title || undefined,
    worksite_address: filters.location || undefined,
    pw_wage_level: filters.pw_wage_level || undefined,
    wage_min: filters.wage_min ? parseInt(filters.wage_min) : undefined,
    wage_max: filters.wage_max ? parseInt(filters.wage_max) : undefined,
    search: searchQuery || undefined,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
    order: `${sortField}.${sortDirection}`,
  };

  const { data, isLoading } = useQuery({
    queryKey: ["h1b-search", apiFilters],
    queryFn: () => getH1BData(apiFilters),
    placeholderData: (previousData) => previousData,
  });

  // Detect state names in search/location for helpful hints
  const stateHint = useMemo(() => {
    const terms = [searchQuery, filters.location].filter(Boolean);
    for (const term of terms) {
      const detected = detectStateInQuery(term);
      if (detected) {
        return detected;
      }
    }
    return null;
  }, [searchQuery, filters.location]);

  // Update URL when filters change (debounced)
  const updateURL = useCallback(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (filters.employer_name) params.set("employer", filters.employer_name);
    if (filters.job_title) params.set("job", filters.job_title);
    if (filters.location) params.set("location", filters.location);
    if (filters.pw_wage_level) params.set("level", filters.pw_wage_level);
    if (filters.wage_min) params.set("wage_min", filters.wage_min);
    if (filters.wage_max) params.set("wage_max", filters.wage_max);
    if (sortField !== "wage_rate_of_pay_from" || sortDirection !== "desc") {
      params.set("sort", `${sortField}.${sortDirection}`);
    }
    const qs = params.toString();
    router.replace(`/search${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [searchQuery, filters, sortField, sortDirection, router]);

  useEffect(() => {
    const timer = setTimeout(updateURL, 500);
    return () => clearTimeout(timer);
  }, [updateURL]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [searchQuery, filters, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const handleClearFilters = () => {
    setFilters(emptyFilters);
    setSearchQuery("");
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Page heading */}
      <div className="flex items-center gap-3">
        <div className="h-6 w-1 bg-[#1B2A4A] rounded-full" />
        <h1 className="text-2xl font-bold text-[#1B2A4A]">Search H1B Data</h1>
      </div>

      {/* Filters toggle */}
      <div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2 border-[#1B2A4A]/20 hover:bg-[#1B2A4A] hover:text-white"
        >
          {showFilters ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
          {showFilters ? "Hide Filters" : "Show Filters"}
        </Button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <Card className="border-t-2 border-t-[#C4A35A]">
          <CardContent className="pt-6">
            <SearchFilters
              filters={filters}
              onFilterChange={(newFilters) => setFilters(newFilters)}
              onClear={handleClearFilters}
            />
          </CardContent>
        </Card>
      )}

      <Separator className="bg-[#E0DCD4]" />

      {/* State name hint banner */}
      {stateHint && (
        <div className="flex items-start gap-3 rounded-xl border border-[#C4A35A]/30 bg-[#C4A35A]/5 px-4 py-3">
          <Lightbulb className="h-5 w-5 text-[#C4A35A] shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="text-[#1B2A4A]">
              <span className="font-semibold">Tip:</span> The dataset stores{" "}
              <span className="font-semibold">{stateHint.stateName}</span> as{" "}
              <span className="font-mono font-bold text-[#C41E3A]">{stateHint.stateAbbrev}</span>.
              We&apos;re automatically searching for both forms to give you the best results.
            </p>
          </div>
        </div>
      )}

      {/* Results table */}
      <DataTable
        data={data?.data || []}
        isLoading={isLoading}
        totalCount={data?.count || 0}
        page={page}
        pageSize={PAGE_SIZE}
        sortField={sortField}
        sortDirection={sortDirection}
        onPageChange={setPage}
        onSort={handleSort}
      />
    </div>
  );
}
