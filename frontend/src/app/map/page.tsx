"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import { getStateStats, getStateEmployers, getH1BStats } from "@/lib/api";
import { ABBREV_TO_NAME } from "@/lib/states";
import { formatCurrency, formatNumber } from "@/lib/format";
import { StateStats } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2,
  MapPin,
  DollarSign,
  FileText,
  X,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Briefcase,
} from "lucide-react";

const GEO_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

// FIPS code → state abbreviation
const FIPS_TO_STATE: Record<string, string> = {
  "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA",
  "08": "CO", "09": "CT", "10": "DE", "11": "DC", "12": "FL",
  "13": "GA", "15": "HI", "16": "ID", "17": "IL", "18": "IN",
  "19": "IA", "20": "KS", "21": "KY", "22": "LA", "23": "ME",
  "24": "MD", "25": "MA", "26": "MI", "27": "MN", "28": "MS",
  "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH",
  "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND",
  "39": "OH", "40": "OK", "41": "OR", "42": "PA", "44": "RI",
  "45": "SC", "46": "SD", "47": "TN", "48": "TX", "49": "UT",
  "50": "VT", "51": "VA", "53": "WA", "54": "WV", "55": "WI",
  "56": "WY", "72": "PR",
};

// Color scale using site theme colors
function getHeatColor(value: number, max: number): string {
  if (value === 0) return "#F5F0E8"; // cream/empty
  const ratio = Math.log(value + 1) / Math.log(max + 1);
  if (ratio < 0.15) return "#E8E0D0";
  if (ratio < 0.3) return "#C4D4E8";
  if (ratio < 0.45) return "#8BAFD0";
  if (ratio < 0.6) return "#5A8AB8";
  if (ratio < 0.75) return "#3568A0";
  if (ratio < 0.9) return "#264980";
  return "#1B2A4A";
}

const DEFAULT_CENTER: [number, number] = [-96, 38];
const DEFAULT_ZOOM = 1;
const MIN_ZOOM = 1;
const MAX_ZOOM = 8;

export default function MapPage() {
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER);

  const { data: stateStats = [], isLoading } = useQuery({
    queryKey: ["state-stats"],
    queryFn: getStateStats,
  });

  const { data: globalStats } = useQuery({
    queryKey: ["h1b-stats"],
    queryFn: getH1BStats,
  });

  const { data: stateEmployers = [], isFetching: employersFetching } =
    useQuery({
      queryKey: ["state-employers", selectedState],
      queryFn: () => getStateEmployers(selectedState!, 20),
      enabled: !!selectedState,
    });

  const statsMap = useMemo(() => {
    const map: Record<string, StateStats> = {};
    stateStats.forEach((s) => {
      if (s.state_code) map[s.state_code] = s;
    });
    return map;
  }, [stateStats]);

  const maxFilings = useMemo(
    () => Math.max(...stateStats.map((s) => s.filing_count), 1),
    [stateStats]
  );

  const hoveredData = hoveredState ? statsMap[hoveredState] : null;
  const selectedData = selectedState ? statsMap[selectedState] : null;

  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(z * 1.5, MAX_ZOOM));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(z / 1.5, MIN_ZOOM));
  }, []);

  const handleReset = useCallback(() => {
    setZoom(DEFAULT_ZOOM);
    setCenter(DEFAULT_CENTER);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Page heading */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-6 w-1 bg-[#1B2A4A] rounded-full" />
          <div>
            <h1 className="text-2xl font-bold text-[#1B2A4A]">
              H1B Filing Map Year 2025
            </h1>
            <p className="text-sm text-muted-foreground">
              Geographic distribution of H1B LCA filings across the United
              States
            </p>
          </div>
        </div>
        {globalStats && (
          <div className="hidden md:flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Total Filings</div>
              <div className="text-sm font-bold text-[#1B2A4A]">
                {formatNumber(globalStats.total_records)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Employers</div>
              <div className="text-sm font-bold text-[#1B2A4A]">
                {formatNumber(globalStats.unique_employers)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">
                States/Territories
              </div>
              <div className="text-sm font-bold text-[#1B2A4A]">
                {stateStats.length}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-6">
        {/* Map card */}
        <Card className="flex-1 border-t-2 border-t-[#1B2A4A] overflow-hidden">
          <CardContent className="p-0 relative">
            {/* Loading */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center z-20 bg-background/80">
                <div className="flex flex-col items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <span className="text-sm text-muted-foreground">
                    Loading map data...
                  </span>
                </div>
              </div>
            )}

            {/* Hover tooltip */}
            {hoveredState && hoveredData && !selectedState && (
              <div className="absolute top-4 left-4 z-20 bg-white border border-[#E0DCD4] rounded-lg px-4 py-3 shadow-lg min-w-[240px]">
                <div className="text-xs text-muted-foreground uppercase tracking-wider">
                  Hover
                </div>
                <div className="text-lg font-bold text-[#1B2A4A] mt-0.5">
                  {ABBREV_TO_NAME[hoveredState] || hoveredState}
                  <span className="text-muted-foreground text-sm font-normal ml-1.5">
                    ({hoveredState})
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-2 text-xs">
                  <div>
                    <div className="text-muted-foreground">Filings</div>
                    <div className="font-bold text-[#1B2A4A]">
                      {formatNumber(hoveredData.filing_count)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Employers</div>
                    <div className="font-bold text-[#1B2A4A]">
                      {formatNumber(hoveredData.employer_count)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Avg Wage</div>
                    <div className="font-bold text-[#C4A35A]">
                      {formatCurrency(hoveredData.avg_wage)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Zoom controls */}
            <div className="absolute top-4 right-4 z-20 flex flex-col gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 bg-white/90 border-[#E0DCD4] hover:bg-[#1B2A4A] hover:text-white"
                onClick={handleZoomIn}
                disabled={zoom >= MAX_ZOOM}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 bg-white/90 border-[#E0DCD4] hover:bg-[#1B2A4A] hover:text-white"
                onClick={handleZoomOut}
                disabled={zoom <= MIN_ZOOM}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 bg-white/90 border-[#E0DCD4] hover:bg-[#1B2A4A] hover:text-white"
                onClick={handleReset}
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* The map */}
            <div className="w-full bg-[#FAF7F0]" style={{ height: "560px" }}>
              <ComposableMap
                projection="geoAlbersUsa"
                width={800}
                height={500}
                style={{ width: "100%", height: "100%" }}
              >
                <ZoomableGroup
                  center={center}
                  zoom={zoom}
                  onMoveEnd={({ coordinates, zoom: z }) => {
                    setCenter(coordinates as [number, number]);
                    setZoom(z);
                  }}
                  minZoom={MIN_ZOOM}
                  maxZoom={MAX_ZOOM}
                >
                  <Geographies geography={GEO_URL}>
                    {({ geographies }) =>
                      geographies.map((geo) => {
                        const fips = geo.id;
                        const stateCode =
                          FIPS_TO_STATE[String(fips).padStart(2, "0")];
                        const stateData = stateCode
                          ? statsMap[stateCode]
                          : null;
                        const filings = stateData?.filing_count || 0;
                        const isHovered = hoveredState === stateCode;
                        const isSelected = selectedState === stateCode;

                        return (
                          <Geography
                            key={geo.rsmKey}
                            geography={geo}
                            fill={
                              isSelected
                                ? "#C4A35A"
                                : isHovered
                                ? "#C41E3A"
                                : getHeatColor(filings, maxFilings)
                            }
                            stroke={
                              isSelected
                                ? "#1B2A4A"
                                : isHovered
                                ? "#C41E3A"
                                : "#ffffff"
                            }
                            strokeWidth={
                              isSelected ? 1.5 : isHovered ? 1 : 0.5
                            }
                            style={{
                              default: { outline: "none" },
                              hover: {
                                outline: "none",
                                cursor: "pointer",
                              },
                              pressed: { outline: "none" },
                            }}
                            onMouseEnter={() =>
                              setHoveredState(stateCode || null)
                            }
                            onMouseLeave={() => setHoveredState(null)}
                            onClick={() => {
                              if (stateCode) {
                                setSelectedState(
                                  selectedState === stateCode
                                    ? null
                                    : stateCode
                                );
                              }
                            }}
                          />
                        );
                      })
                    }
                  </Geographies>
                </ZoomableGroup>
              </ComposableMap>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#FAF7F0] border-t border-[#E0DCD4]">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Low</span>
                {[
                  "#E8E0D0",
                  "#C4D4E8",
                  "#8BAFD0",
                  "#5A8AB8",
                  "#3568A0",
                  "#264980",
                  "#1B2A4A",
                ].map((c) => (
                  <div
                    key={c}
                    className="w-8 h-3 rounded-sm border border-white/50"
                    style={{ backgroundColor: c }}
                  />
                ))}
                <span className="text-xs text-muted-foreground">High</span>
              </div>
              <span className="text-xs text-muted-foreground">
                Click a state to view details
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Side panel — state detail */}
        {selectedState && selectedData && (
          <Card className="w-[380px] shrink-0 border-t-2 border-t-[#C4A35A] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 flex items-center justify-between border-b border-[#E0DCD4]">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">
                  State Detail
                </div>
                <h2 className="text-xl font-bold text-[#1B2A4A] mt-0.5">
                  {ABBREV_TO_NAME[selectedState] || selectedState}
                  <span className="text-muted-foreground text-sm font-normal ml-2">
                    ({selectedState})
                  </span>
                </h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-[#C41E3A]"
                onClick={() => setSelectedState(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 border-b border-[#E0DCD4] bg-[#FAF7F0]">
              <div className="px-3 py-3 border-r border-[#E0DCD4] text-center">
                <FileText className="h-4 w-4 text-[#1B2A4A] mx-auto mb-1" />
                <div className="text-lg font-bold text-[#1B2A4A]">
                  {formatNumber(selectedData.filing_count)}
                </div>
                <div className="text-[10px] text-muted-foreground uppercase">
                  Filings
                </div>
              </div>
              <div className="px-3 py-3 border-r border-[#E0DCD4] text-center">
                <Building2 className="h-4 w-4 text-[#C41E3A] mx-auto mb-1" />
                <div className="text-lg font-bold text-[#1B2A4A]">
                  {formatNumber(selectedData.employer_count)}
                </div>
                <div className="text-[10px] text-muted-foreground uppercase">
                  Employers
                </div>
              </div>
              <div className="px-3 py-3 text-center">
                <DollarSign className="h-4 w-4 text-[#C4A35A] mx-auto mb-1" />
                <div className="text-lg font-bold text-[#C4A35A]">
                  {formatCurrency(selectedData.avg_wage)}
                </div>
                <div className="text-[10px] text-muted-foreground uppercase">
                  Avg Wage
                </div>
              </div>
            </div>

            {/* National rank bar */}
            <div className="px-5 py-3 border-b border-[#E0DCD4]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">National Rank</span>
                <Badge className="bg-[#1B2A4A] text-white text-xs">
                  #{stateStats.findIndex(
                    (s) => s.state_code === selectedState
                  ) + 1}{" "}
                  of {stateStats.length}
                </Badge>
              </div>
              <div className="mt-2 h-2 bg-[#E0DCD4] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#1B2A4A] to-[#C4A35A] rounded-full transition-all duration-500"
                  style={{
                    width: `${(selectedData.filing_count / maxFilings) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Employer list */}
            <div className="flex-1 overflow-y-auto" style={{ maxHeight: "320px" }}>
              <div className="px-5 py-2 border-b border-[#E0DCD4] sticky top-0 bg-white z-10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-3.5 w-3.5 text-[#C4A35A]" />
                  <span className="text-xs font-medium text-[#1B2A4A] uppercase tracking-wider">
                    Top Positions
                  </span>
                </div>
                {employersFetching && (
                  <div className="h-3 w-3 border-2 border-[#C4A35A] border-t-transparent rounded-full animate-spin" />
                )}
              </div>

              {stateEmployers.map((record, i) => (
                <div
                  key={record.id}
                  className="px-5 py-3 border-b border-[#E0DCD4]/50 hover:bg-[#FAF7F0] transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-xs text-muted-foreground mt-0.5 w-4 shrink-0 text-right font-mono">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3 w-3 text-[#1B2A4A] shrink-0" />
                        <span className="text-sm font-semibold text-[#1B2A4A] truncate">
                          {record.employer_name}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {record.job_title}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin className="h-2.5 w-2.5 text-[#C41E3A]/60" />
                        <span className="text-[10px] text-muted-foreground truncate">
                          {record.worksite_address}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold font-mono text-[#1B2A4A]">
                        {formatCurrency(record.wage_rate_of_pay_from)}
                      </div>
                      {record.pw_wage_level && (
                        <Badge
                          variant="outline"
                          className="text-[10px] mt-0.5 border-[#E0DCD4]"
                        >
                          Level {record.pw_wage_level}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {stateEmployers.length > 0 && (
                <div className="px-5 py-4 text-center">
                  <a
                    href={`/search?state=${selectedState}`}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1B2A4A] hover:text-[#C41E3A] transition-colors"
                  >
                    View all filings in{" "}
                    {ABBREV_TO_NAME[selectedState] || selectedState}
                    <ChevronRight className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Top states table */}
      <Card className="border-t-2 border-t-[#C4A35A]">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-4 w-4 text-[#C4A35A]" />
            <h3 className="font-semibold text-[#1B2A4A]">
              All States &amp; Territories by H1B Filings
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E0DCD4] bg-[#FAF7F0]">
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground uppercase">
                    Rank
                  </th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground uppercase">
                    State
                  </th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground uppercase">
                    Filings
                  </th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground uppercase">
                    Employers
                  </th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground uppercase">
                    Avg Wage
                  </th>
                  <th className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase w-48">
                    Share
                  </th>
                </tr>
              </thead>
              <tbody>
                {stateStats.map((state, i) => {
                  const totalFilings = stateStats.reduce(
                    (s, st) => s + st.filing_count,
                    0
                  );
                  const share = (state.filing_count / totalFilings) * 100;
                  return (
                    <tr
                      key={state.state_code}
                      className={`border-b border-[#E0DCD4]/50 hover:bg-[#FAF7F0] cursor-pointer transition-colors ${
                        selectedState === state.state_code
                          ? "bg-[#C4A35A]/10"
                          : ""
                      }`}
                      onClick={() =>
                        setSelectedState(
                          selectedState === state.state_code
                            ? null
                            : state.state_code
                        )
                      }
                    >
                      <td className="px-3 py-2.5 font-mono text-muted-foreground">
                        {i + 1}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="font-semibold text-[#1B2A4A]">
                          {ABBREV_TO_NAME[state.state_code] ||
                            state.state_code}
                        </span>
                        <span className="text-muted-foreground ml-1.5 text-xs">
                          ({state.state_code})
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-medium text-[#1B2A4A]">
                        {formatNumber(state.filing_count)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-muted-foreground">
                        {formatNumber(state.employer_count)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-medium text-[#C4A35A]">
                        {formatCurrency(state.avg_wage)}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-[#E0DCD4] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#1B2A4A] rounded-full"
                              style={{ width: `${share}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground font-mono w-12 text-right">
                            {share.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
