"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-medium text-sm">Filters</h3>
          {activeFilterCount > 0 && (
            <Badge variant="secondary">{activeFilterCount} active</Badge>
          )}
        </div>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            <X className="h-3 w-3 mr-1" />
            Clear all
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="employer" className="text-xs">
            Company / Employer
          </Label>
          <Input
            id="employer"
            placeholder="e.g. Google, Amazon..."
            value={filters.employer_name}
            onChange={(e) => updateFilter("employer_name", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="job_title" className="text-xs">
            Job Title / Role
          </Label>
          <Input
            id="job_title"
            placeholder="e.g. Software Engineer..."
            value={filters.job_title}
            onChange={(e) => updateFilter("job_title", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="location" className="text-xs">
            City / State / Location
          </Label>
          <Input
            id="location"
            placeholder="e.g. San Francisco, CA..."
            value={filters.location}
            onChange={(e) => updateFilter("location", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="wage_level" className="text-xs">
            Wage Level
          </Label>
          <select
            id="wage_level"
            value={filters.pw_wage_level}
            onChange={(e) => updateFilter("pw_wage_level", e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {wageLevels.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="wage_min" className="text-xs">
            Min Salary ($)
          </Label>
          <Input
            id="wage_min"
            type="number"
            placeholder="e.g. 100000"
            value={filters.wage_min}
            onChange={(e) => updateFilter("wage_min", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="wage_max" className="text-xs">
            Max Salary ($)
          </Label>
          <Input
            id="wage_max"
            type="number"
            placeholder="e.g. 250000"
            value={filters.wage_max}
            onChange={(e) => updateFilter("wage_max", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
