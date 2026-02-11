"use client";

import { useQuery } from "@tanstack/react-query";
import { getH1BStats, getH1BData } from "@/lib/api";
import { formatCurrency, formatNumber } from "@/lib/format";
import { StatsCards } from "@/components/stats-cards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const formatTooltip = (value: any) => [formatNumber(Number(value)), "Records"];

const LEVEL_COLORS = {
  I: "#3b82f6",
  II: "#22c55e",
  III: "#a855f7",
  IV: "#f97316",
};

export default function StatsPage() {
  // Fetch by wage level
  const { data: levelI } = useQuery({
    queryKey: ["stats-level-I"],
    queryFn: () => getH1BData({ pw_wage_level: "I", limit: 1 }),
  });
  const { data: levelII } = useQuery({
    queryKey: ["stats-level-II"],
    queryFn: () => getH1BData({ pw_wage_level: "II", limit: 1 }),
  });
  const { data: levelIII } = useQuery({
    queryKey: ["stats-level-III"],
    queryFn: () => getH1BData({ pw_wage_level: "III", limit: 1 }),
  });
  const { data: levelIV } = useQuery({
    queryKey: ["stats-level-IV"],
    queryFn: () => getH1BData({ pw_wage_level: "IV", limit: 1 }),
  });

  const wageLevelData = [
    {
      name: "Level I (Entry)",
      count: levelI?.count || 0,
      color: LEVEL_COLORS.I,
    },
    {
      name: "Level II (Qualified)",
      count: levelII?.count || 0,
      color: LEVEL_COLORS.II,
    },
    {
      name: "Level III (Experienced)",
      count: levelIII?.count || 0,
      color: LEVEL_COLORS.III,
    },
    {
      name: "Level IV (Expert)",
      count: levelIV?.count || 0,
      color: LEVEL_COLORS.IV,
    },
  ];

  // Fetch salary distribution data
  const { data: range1 } = useQuery({
    queryKey: ["stats-range", 0, 75000],
    queryFn: () => getH1BData({ wage_min: 0, wage_max: 75000, limit: 1 }),
  });
  const { data: range2 } = useQuery({
    queryKey: ["stats-range", 75000, 100000],
    queryFn: () => getH1BData({ wage_min: 75000, wage_max: 100000, limit: 1 }),
  });
  const { data: range3 } = useQuery({
    queryKey: ["stats-range", 100000, 125000],
    queryFn: () => getH1BData({ wage_min: 100000, wage_max: 125000, limit: 1 }),
  });
  const { data: range4 } = useQuery({
    queryKey: ["stats-range", 125000, 150000],
    queryFn: () => getH1BData({ wage_min: 125000, wage_max: 150000, limit: 1 }),
  });
  const { data: range5 } = useQuery({
    queryKey: ["stats-range", 150000, 200000],
    queryFn: () => getH1BData({ wage_min: 150000, wage_max: 200000, limit: 1 }),
  });
  const { data: range6 } = useQuery({
    queryKey: ["stats-range", 200000, 10000000],
    queryFn: () => getH1BData({ wage_min: 200000, wage_max: 10000000, limit: 1 }),
  });

  const salaryDistribution = [
    { range: "< $75K", count: range1?.count || 0 },
    { range: "$75K-$100K", count: range2?.count || 0 },
    { range: "$100K-$125K", count: range3?.count || 0 },
    { range: "$125K-$150K", count: range4?.count || 0 },
    { range: "$150K-$200K", count: range5?.count || 0 },
    { range: "$200K+", count: range6?.count || 0 },
  ];

  const isLoadingCharts =
    !range1 || !range2 || !range3 || !range4 || !range5 || !range6 ||
    !levelI || !levelII || !levelIII || !levelIV;

  // Top companies by frequency
  const { data: topCompaniesData } = useQuery({
    queryKey: ["top-companies-stats"],
    queryFn: async () => {
      const companies = [
        "Infosys",
        "Tata Consultancy",
        "Cognizant",
        "Amazon",
        "Google",
        "Microsoft",
        "Meta",
        "Apple",
        "Deloitte",
        "Wipro",
      ];
      const results = await Promise.all(
        companies.map(async (name) => {
          const result = await getH1BData({
            employer_name: name,
            limit: 1,
          });
          return { name, count: result.count };
        })
      );
      return results.sort((a, b) => b.count - a.count);
    },
  });

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">H1B Statistics Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Aggregate insights from the H1B LCA disclosure dataset
        </p>
      </div>

      <StatsCards />

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Salary Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Salary Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingCharts ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salaryDistribution}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    dataKey="range"
                    tick={{ fontSize: 11 }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) =>
                      v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v
                    }
                  />
                  <Tooltip formatter={formatTooltip} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Wage Level Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Wage Level Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingCharts ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={wageLevelData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="count"
                      nameKey="name"
                      label={({ name, percent }) =>
                        `${(name || "").split(" ")[0]} ${(name || "").split(" ")[1]} ${((percent || 0) * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                    >
                      {wageLevelData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={formatTooltip} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  {wageLevelData.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center gap-1.5 text-xs"
                    >
                      <div
                        className="w-3 h-3 rounded-sm"
                        style={{ backgroundColor: item.color }}
                      />
                      <span>
                        {item.name}: {formatNumber(item.count)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Companies */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">
              Top H1B Sponsoring Companies
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!topCompaniesData ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart
                  data={topCompaniesData}
                  layout="vertical"
                  margin={{ left: 100 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) =>
                      v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v
                    }
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    width={100}
                  />
                  <Tooltip formatter={(value: unknown) => [formatNumber(Number(value)), "H1B Filings"]} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
