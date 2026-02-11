"use client";

import { useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AutocompleteInput } from "@/components/autocomplete-input";
import {
  getEmployerSuggestions,
  getJobTitleSuggestions,
  getLocationSuggestions,
} from "@/lib/api";
import { X, SlidersHorizontal } from "lucide-react";

interface FilterState {
  employer_name: string;
  job_title: string;
  location: string;
  pw_wage_level: string;
  wage_min: string;
  wage_max: string;
}

interface SearchFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onClear: () => void;
}

const wageLevels = [
  { value: "", label: "All Levels" },
  { value: "I", label: "Level I (Entry)" },
  { value: "II", label: "Level II (Qualified)" },
  { value: "III", label: "Level III (Experienced)" },
  { value: "IV", label: "Level IV (Expert)" },
];

export function SearchFilters({
  filters,
  onFilterChange,
  onClear,
}: SearchFiltersProps) {
  const activeFilterCount = Object.values(filters).filter(
    (v) => v !== ""
  ).length;

  const updateFilter = (key: keyof FilterState, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  // Scoped suggestion fetchers: job titles and locations narrow
  // based on the currently selected employer
  const currentEmployer = filters.employer_name;

  const fetchJobSuggestions = useCallback(
    (query: string) => getJobTitleSuggestions(query, currentEmployer || undefined),
    [currentEmployer]
  );

  const fetchLocationSuggestions = useCallback(
    (query: string) => getLocationSuggestions(query, currentEmployer || undefined),
    [currentEmployer]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-[#C4A35A]" />
          <h3 className="font-medium text-sm text-[#1B2A4A]">Filters</h3>
          {activeFilterCount > 0 && (
            <Badge className="bg-[#1B2A4A] text-white hover:bg-[#2B3F6B] text-xs">
              {activeFilterCount} active
            </Badge>
          )}
        </div>
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="text-[#C41E3A] hover:text-[#C41E3A] hover:bg-[#C41E3A]/5"
          >
            <X className="h-3 w-3 mr-1" />
            Clear all
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="employer" className="text-xs text-muted-foreground">
            Company / Employer
          </Label>
          <AutocompleteInput
            id="employer"
            placeholder="e.g. Google, Amazon..."
            value={filters.employer_name}
            onChange={(val) => updateFilter("employer_name", val)}
            fetchSuggestions={getEmployerSuggestions}
            queryKeyPrefix="suggest-employer"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="job_title" className="text-xs text-muted-foreground">
            Job Title / Role
            {currentEmployer && (
              <span className="ml-1 text-[#C41E3A]">
                (at {currentEmployer})
              </span>
            )}
          </Label>
          <AutocompleteInput
            id="job_title"
            placeholder={
              currentEmployer
                ? `Browse or type roles at ${currentEmployer}...`
                : "e.g. Software Engineer..."
            }
            value={filters.job_title}
            onChange={(val) => updateFilter("job_title", val)}
            fetchSuggestions={fetchJobSuggestions}
            queryKeyPrefix={`suggest-jobtitle-${currentEmployer || "all"}`}
            showAllOnFocus={!!currentEmployer}
            dropdownLabel="roles"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="location" className="text-xs text-muted-foreground">
            City / State / Location
            {currentEmployer && (
              <span className="ml-1 text-[#C41E3A]">
                (at {currentEmployer})
              </span>
            )}
          </Label>
          <AutocompleteInput
            id="location"
            placeholder={
              currentEmployer
                ? `Browse or type locations for ${currentEmployer}...`
                : "e.g. San Francisco, CA..."
            }
            value={filters.location}
            onChange={(val) => updateFilter("location", val)}
            fetchSuggestions={fetchLocationSuggestions}
            queryKeyPrefix={`suggest-location-${currentEmployer || "all"}`}
            showAllOnFocus={!!currentEmployer}
            dropdownLabel="locations"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="wage_level" className="text-xs text-muted-foreground">
            Wage Level
          </Label>
          <select
            id="wage_level"
            value={filters.pw_wage_level}
            onChange={(e) => updateFilter("pw_wage_level", e.target.value)}
            className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              filters.pw_wage_level
                ? "font-semibold text-[#1B2A4A] border-[#1B2A4A]/30 bg-[#1B2A4A]/[0.02]"
                : "border-input"
            }`}
          >
            {wageLevels.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="wage_min" className="text-xs text-muted-foreground">
            Min Salary ($)
          </Label>
          <Input
            id="wage_min"
            type="number"
            placeholder="e.g. 100000"
            value={filters.wage_min}
            onChange={(e) => updateFilter("wage_min", e.target.value)}
            className={
              filters.wage_min
                ? "font-semibold text-[#1B2A4A] border-[#1B2A4A]/30 bg-[#1B2A4A]/[0.02]"
                : ""
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="wage_max" className="text-xs text-muted-foreground">
            Max Salary ($)
          </Label>
          <Input
            id="wage_max"
            type="number"
            placeholder="e.g. 250000"
            value={filters.wage_max}
            onChange={(e) => updateFilter("wage_max", e.target.value)}
            className={
              filters.wage_max
                ? "font-semibold text-[#1B2A4A] border-[#1B2A4A]/30 bg-[#1B2A4A]/[0.02]"
                : ""
            }
          />
        </div>
      </div>
    </div>
  );
}
