"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { getH1BData } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { SearchBar } from "@/components/search-bar";
import { StatsCards } from "@/components/stats-cards";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowRight,
  Building2,
  TrendingUp,
  MapPin,
  AlertTriangle,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();

  const { data: topPaying, isLoading: topPayingLoading } = useQuery({
    queryKey: ["top-paying"],
    queryFn: () =>
      getH1BData({
        limit: 10,
        order: "wage_rate_of_pay_from.desc",
      }),
  });

  const popularSearches = [
    { label: "Google LLC", param: "employer", value: "Google LLC" },
    { label: "Amazon.com Services LLC", param: "employer", value: "Amazon.com Services LLC" },
    { label: "Microsoft Corporation", param: "employer", value: "Microsoft Corporation" },
    { label: "Meta Platforms Inc", param: "employer", value: "Meta Platforms Inc" },
    { label: "Apple Inc", param: "employer", value: "Apple Inc" },
    { label: "Accenture LLP", param: "employer", value: "Accenture LLP" },
    { label: "Software Engineer", param: "job", value: "Software Engineer" },
    { label: "Data Scientist", param: "job", value: "Data Scientist" },
    { label: "Data Engineer", param: "job", value: "Data Engineer" },
    { label: "AI Engineer", param: "job", value: "AI Engineer" },
    { label: "Product Manager", param: "job", value: "Product Manager" },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section - Navy gradient inspired by visa */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1B2A4A] via-[#243560] to-[#1B2A4A]" />
        {/* Subtle decorative pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
        <div className="relative container mx-auto px-4 py-20 md:py-28">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            {/* Gold accent line */}
            <div className="flex justify-center">
              <div className="h-1 w-16 bg-[#C4A35A] rounded-full" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white">
              H1B Wages{" "}
              <span className="text-[#C4A35A]">Explorer</span>
            </h1>
            <p className="text-lg text-blue-100/80 max-w-2xl mx-auto leading-relaxed">
              Search and explore H1B visa salary data across{" "}
              <span className="text-[#C4A35A] font-semibold">450,000+</span> LCA
              records. Find wages by company, job title, and location.
            </p>
            <div className="max-w-2xl mx-auto pt-2">
              <SearchBar size="large" />
            </div>
            <div className="flex flex-wrap justify-center gap-2 pt-3">
              {popularSearches.map((item) => (
                <Badge
                  key={item.label}
                  variant="outline"
                  className="cursor-pointer border-white/20 text-white/70 hover:bg-white/10 hover:text-white hover:border-[#C4A35A]/50 transition-all duration-200 text-xs"
                  onClick={() =>
                    router.push(`/search?${item.param}=${encodeURIComponent(item.value)}`)
                  }
                >
                  {item.label}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        {/* Bottom wave separator */}
        <div className="relative h-6 -mb-1">
          <svg viewBox="0 0 1440 48" className="absolute bottom-0 w-full h-12 text-background fill-current">
            <path d="M0,48L80,42C160,36,320,24,480,20C640,16,800,20,960,26C1120,32,1280,40,1360,44L1440,48V48H0Z" />
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-6 w-1 bg-[#C4A35A] rounded-full" />
          <h2 className="text-xl font-bold text-[#1B2A4A]">Dataset Overview</h2>
        </div>
        <StatsCards />
      </section>

      {/* Top Paying Section */}
      <section className="container mx-auto px-4 py-8 pb-12">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-6 w-1 bg-[#C41E3A] rounded-full" />
            <h2 className="text-xl font-bold text-[#1B2A4A] flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#C41E3A]" />
              Highest Reported Salaries
            </h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-[#1B2A4A]/20 text-[#1B2A4A] hover:bg-[#1B2A4A] hover:text-white transition-colors"
            onClick={() =>
              router.push("/search?sort=wage_rate_of_pay_from.desc")
            }
          >
            View all <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {/* Data disclaimer */}
        <div className="flex items-start gap-2.5 rounded-lg border border-[#C4A35A]/30 bg-[#C4A35A]/5 px-4 py-3 mb-6">
          <AlertTriangle className="h-4 w-4 text-[#C4A35A] shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-semibold text-[#1B2A4A]">Disclaimer:</span>{" "}
            Data is directly sourced from LCA / U.S. Department of Labor disclosure files.
            Some figures may be incorrect due to manual data entry errors by employers.
            This information is for reference purposes only.
          </p>
        </div>

        <div className="grid gap-3">
          {topPayingLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))
            : topPaying?.data.map((record, index) => (
                <Card
                  key={record.id}
                  className="hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 hover:translate-x-1"
                  style={{
                    borderLeftColor: index === 0 ? '#C4A35A' : index === 1 ? '#A0A0A0' : index === 2 ? '#CD7F32' : '#E0DCD4'
                  }}
                  onClick={() =>
                    router.push(
                      `/search?employer=${encodeURIComponent(record.employer_name)}`
                    )
                  }
                >
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-[#1B2A4A]/5 text-[#1B2A4A] text-sm font-bold shrink-0">
                        #{index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-[#1B2A4A] shrink-0" />
                          <p className="font-semibold text-[#1B2A4A] truncate">
                            {record.employer_name}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground truncate mt-0.5">
                          {record.job_title}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3 text-[#C41E3A]/60" />
                          <p className="text-xs text-muted-foreground truncate">
                            {record.worksite_address}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right ml-4 shrink-0">
                      <p className="text-lg font-bold font-mono text-[#1B2A4A]">
                        {formatCurrency(record.wage_rate_of_pay_from)}
                      </p>
                      {record.pw_wage_level && (
                        <Badge className="text-xs mt-1 bg-[#1B2A4A]/10 text-[#1B2A4A] hover:bg-[#1B2A4A]/15 border-0">
                          Level {record.pw_wage_level}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
        </div>
      </section>

    </div>
  );
}
