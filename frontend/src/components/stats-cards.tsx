"use client";

import { useQuery } from "@tanstack/react-query";
import { getH1BStats } from "@/lib/api";
import { formatCurrency, formatNumber } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Briefcase, DollarSign, TrendingUp } from "lucide-react";

export function StatsCards() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["h1b-stats"],
    queryFn: getH1BStats,
  });

  const cards = [
    {
      title: "Total Records",
      value: stats ? formatNumber(stats.total_records) : "",
      icon: Briefcase,
      description: "H1B LCA applications",
      iconColor: "#1B2A4A",
      iconBg: "bg-[#1B2A4A]/10",
      borderColor: "#1B2A4A",
    },
    {
      title: "Unique Employers",
      value: stats ? formatNumber(stats.unique_employers) : "",
      icon: Building2,
      description: "Companies sponsoring H1B",
      iconColor: "#C41E3A",
      iconBg: "bg-[#C41E3A]/10",
      borderColor: "#C41E3A",
    },
    {
      title: "Average Wage",
      value: stats ? formatCurrency(stats.avg_wage_from) : "",
      icon: DollarSign,
      description: "Mean base salary offered",
      iconColor: "#2B7A78",
      iconBg: "bg-[#2B7A78]/10",
      borderColor: "#2B7A78",
    },
    {
      title: "Highest Wage",
      value: stats ? formatCurrency(stats.max_wage_from) : "",
      icon: TrendingUp,
      description: "Maximum salary in dataset",
      iconColor: "#C4A35A",
      iconBg: "bg-[#C4A35A]/15",
      borderColor: "#C4A35A",
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card
            key={card.title}
            className="border-l-4 hover:shadow-md transition-shadow"
            style={{ borderLeftColor: card.borderColor }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.iconBg}`}>
                <Icon className="h-4 w-4" style={{ color: card.iconColor }} />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-[#1B2A4A]">
                    {card.value}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {card.description}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
