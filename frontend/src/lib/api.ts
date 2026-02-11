import { H1BRecord, H1BStats, SearchFilters } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

async function fetchAPI<T>(
  endpoint: string,
  params?: Record<string, string>,
  headers?: Record<string, string>
): Promise<{ data: T; count?: number }> {
  const url = new URL(`${API_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value);
    });
  }

  const requestHeaders: Record<string, string> = {
    Accept: "application/json",
    ...headers,
  };

  // Request exact count from PostgREST for pagination
  if (headers?.Prefer === "count=exact") {
    requestHeaders["Prefer"] = "count=exact";
  }

  const res = await fetch(url.toString(), { headers: requestHeaders });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as T;

  // Extract total count from Content-Range header
  const contentRange = res.headers.get("Content-Range");
  let count: number | undefined;
  if (contentRange) {
    const match = contentRange.match(/\/(\d+|\*)/);
    if (match && match[1] !== "*") {
      count = parseInt(match[1], 10);
    }
  }

  return { data, count };
}

export async function getH1BData(
  filters: SearchFilters
): Promise<{ data: H1BRecord[]; count: number }> {
  const params: Record<string, string> = {};

  if (filters.employer_name) {
    params["employer_name"] = `ilike.*${filters.employer_name}*`;
  }
  if (filters.job_title) {
    params["job_title"] = `ilike.*${filters.job_title}*`;
  }
  if (filters.worksite_address) {
    params["worksite_address"] = `ilike.*${filters.worksite_address}*`;
  }
  if (filters.pw_wage_level) {
    params["pw_wage_level"] = `eq.${filters.pw_wage_level}`;
  }
  if (filters.wage_min) {
    params["wage_rate_of_pay_from"] = `gte.${filters.wage_min}`;
  }
  if (filters.wage_max) {
    // Use a PostgREST "and" filter for range
    if (filters.wage_min) {
      params["wage_rate_of_pay_from"] = `gte.${filters.wage_min}`;
      // Add wage_max as a separate filter using the 'and' syntax
      params["and"] = `(wage_rate_of_pay_from.lte.${filters.wage_max})`;
    } else {
      params["wage_rate_of_pay_from"] = `lte.${filters.wage_max}`;
    }
  }
  if (filters.search) {
    // Full text search across employer and job title using PostgREST 'or'
    params["or"] = `(employer_name.ilike.*${filters.search}*,job_title.ilike.*${filters.search}*,worksite_address.ilike.*${filters.search}*)`;
  }

  params["limit"] = String(filters.limit || 25);
  params["offset"] = String(filters.offset || 0);
  params["order"] = filters.order || "wage_rate_of_pay_from.desc";

  // Select specific columns to reduce payload
  params["select"] = "id,job_title,soc_code,soc_title,employer_name,worksite_address,wage_rate_of_pay_from,wage_rate_of_pay_to,prevailing_wage,pw_wage_level";

  const result = await fetchAPI<H1BRecord[]>("/h1b_lca_data", params, {
    Prefer: "count=exact",
  });

  return { data: result.data, count: result.count || 0 };
}

export async function getH1BStats(): Promise<H1BStats> {
  const result = await fetchAPI<H1BStats[]>("/h1b_lca_stats");
  return result.data[0];
}

export async function getTopEmployers(
  limit: number = 10
): Promise<{ employer_name: string; count: number; avg_wage: number }[]> {
  // Use PostgREST RPC or a custom view - for now we'll fetch and aggregate client-side
  // This is a workaround since PostgREST doesn't support GROUP BY directly
  const result = await fetchAPI<H1BRecord[]>("/h1b_lca_data", {
    select: "employer_name,wage_rate_of_pay_from",
    order: "employer_name.asc",
    limit: "5000",
  });

  const employerMap = new Map<
    string,
    { count: number; totalWage: number }
  >();

  result.data.forEach((record) => {
    const existing = employerMap.get(record.employer_name);
    const wage = record.wage_rate_of_pay_from || 0;
    if (existing) {
      existing.count += 1;
      existing.totalWage += wage;
    } else {
      employerMap.set(record.employer_name, { count: 1, totalWage: wage });
    }
  });

  return Array.from(employerMap.entries())
    .map(([employer_name, { count, totalWage }]) => ({
      employer_name,
      count,
      avg_wage: Math.round(totalWage / count),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export async function getDistinctValues(
  column: string,
  search?: string,
  limit: number = 20
): Promise<string[]> {
  const params: Record<string, string> = {
    select: column,
    order: `${column}.asc`,
    limit: String(limit),
  };
  if (search) {
    params[column] = `ilike.*${search}*`;
  }

  const result = await fetchAPI<Record<string, string>[]>(
    "/h1b_lca_data",
    params
  );

  // Deduplicate
  const unique = [...new Set(result.data.map((r) => r[column]).filter(Boolean))];
  return unique.slice(0, limit);
}
