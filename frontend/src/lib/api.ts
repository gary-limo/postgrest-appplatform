import { H1BRecord, H1BStats, StateStats, SearchFilters } from "./types";
import { expandLocationSearch } from "./states";

// Always use /api prefix - Next.js rewrites to backend (localhost dev, internal service prod)
const API_URL = "/api";

async function fetchAPI<T>(
  endpoint: string,
  params?: Record<string, string>,
  headers?: Record<string, string>
): Promise<{ data: T; count?: number }> {
  // Build URL with query params
  let url = `${API_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) searchParams.set(key, value);
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const requestHeaders: Record<string, string> = {
    Accept: "application/json",
    ...headers,
  };

  // Request exact count from PostgREST for pagination
  if (headers?.Prefer === "count=exact") {
    requestHeaders["Prefer"] = "count=exact";
  }

  const res = await fetch(url, { headers: requestHeaders });
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

/**
 * Build a PostgREST OR clause for a location search that expands
 * state names to abbreviations and vice versa.
 *
 * "Connecticut" → (worksite_address.ilike.*Connecticut*,worksite_address.ilike.*CT*)
 */
function buildLocationFilter(term: string): string {
  const expanded = expandLocationSearch(term);
  if (expanded.length === 1) {
    return `worksite_address.ilike.*${expanded[0]}*`;
  }
  // Multiple terms: OR them together
  return expanded.map((t) => `worksite_address.ilike.*${t}*`).join(",");
}

/**
 * Build a global search OR clause that expands state names/abbreviations
 * across employer_name, job_title, and worksite_address.
 */
function buildGlobalSearchFilter(search: string): string {
  const expanded = expandLocationSearch(search);
  const clauses: string[] = [];

  // Always search the original term across all fields
  clauses.push(`employer_name.ilike.*${search}*`);
  clauses.push(`job_title.ilike.*${search}*`);
  clauses.push(`worksite_address.ilike.*${search}*`);

  // If we detected a state, also search the alternate form in worksite_address
  if (expanded.length > 1) {
    for (let i = 1; i < expanded.length; i++) {
      clauses.push(`worksite_address.ilike.*${expanded[i]}*`);
    }
  }

  return `(${clauses.join(",")})`;
}

export async function getH1BData(
  filters: SearchFilters
): Promise<{ data: H1BRecord[]; count: number }> {
  const params: Record<string, string> = {};
  const orClauses: string[] = [];

  if (filters.employer_name) {
    params["employer_name"] = `ilike.*${filters.employer_name}*`;
  }
  if (filters.job_title) {
    params["job_title"] = `ilike.*${filters.job_title}*`;
  }
  if (filters.worksite_address) {
    // Expand state names ↔ abbreviations for location filter
    const expanded = expandLocationSearch(filters.worksite_address);
    if (expanded.length === 1) {
      params["worksite_address"] = `ilike.*${expanded[0]}*`;
    } else {
      // Need to use OR for multiple location terms
      const locationOr = expanded
        .map((t) => `worksite_address.ilike.*${t}*`)
        .join(",");
      orClauses.push(locationOr);
    }
  }
  // Precise state-level filter using the same regex as h1b_state_stats view
  if (filters.state_code) {
    // Use POSIX regex match: 2-letter state code before a 5-digit ZIP
    params["worksite_address"] = `match..*\\s${filters.state_code}\\s\\d{5}`;
  }
  if (filters.pw_wage_level) {
    params["pw_wage_level"] = `eq.${filters.pw_wage_level}`;
  }
  if (filters.wage_min) {
    params["wage_rate_of_pay_from"] = `gte.${filters.wage_min}`;
  }
  if (filters.wage_max) {
    if (filters.wage_min) {
      params["wage_rate_of_pay_from"] = `gte.${filters.wage_min}`;
      params["and"] = `(wage_rate_of_pay_from.lte.${filters.wage_max})`;
    } else {
      params["wage_rate_of_pay_from"] = `lte.${filters.wage_max}`;
    }
  }
  if (filters.search) {
    // Global search with state name expansion
    params["or"] = buildGlobalSearchFilter(filters.search);
  }

  // If we have location OR clauses from state expansion and no global search,
  // merge them into the 'or' param
  if (orClauses.length > 0 && !filters.search) {
    params["or"] = `(${orClauses.join(",")})`;
  }

  params["limit"] = String(filters.limit || 25);
  params["offset"] = String(filters.offset || 0);
  params["order"] = filters.order || "wage_rate_of_pay_from.desc";

  params["select"] =
    "id,job_title,soc_code,soc_title,employer_name,worksite_address,wage_rate_of_pay_from,wage_rate_of_pay_to,prevailing_wage,pw_wage_level";

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
  const result = await fetchAPI<H1BRecord[]>("/h1b_lca_data", {
    select: "employer_name,wage_rate_of_pay_from",
    order: "employer_name.asc",
    limit: "5000",
  });

  const employerMap = new Map<string, { count: number; totalWage: number }>();

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

/**
 * Fetch H1B filing stats aggregated by US state.
 */
export async function getStateStats(): Promise<StateStats[]> {
  const result = await fetchAPI<StateStats[]>("/h1b_state_stats", {
    order: "filing_count.desc",
  });
  return result.data;
}

/**
 * Fetch top employers in a specific state using the same regex as h1b_state_stats.
 * Uses POSIX regex match to ensure state_code is the 2-letter code before ZIP.
 */
export async function getStateEmployers(
  stateCode: string,
  limit: number = 20
): Promise<H1BRecord[]> {
  const result = await fetchAPI<H1BRecord[]>("/h1b_lca_data", {
    select:
      "id,employer_name,job_title,worksite_address,wage_rate_of_pay_from,pw_wage_level",
    worksite_address: `match..*\\s${stateCode}\\s\\d{5}`,
    order: "wage_rate_of_pay_from.desc",
    limit: String(limit),
  });
  return result.data;
}

/**
 * Fetch employer name suggestions from the DISTINCT view.
 * Uses /h1b_distinct_employers which returns pre-deduplicated results
 * so every row is a unique employer — no client-side deduplication needed.
 */
export async function getEmployerSuggestions(
  search: string
): Promise<string[]> {
  if (!search || search.length < 2) return [];

  const result = await fetchAPI<{ employer_name: string }[]>(
    "/h1b_distinct_employers",
    {
      select: "employer_name",
      employer_name: `ilike.*${search}*`,
      order: "filing_count.desc",
      limit: "15",
    }
  );

  return result.data.map((r) => r.employer_name).filter(Boolean);
}

/**
 * Fetch job title suggestions from the DISTINCT view.
 * Uses /h1b_distinct_jobs which stores unique (employer, job_title) pairs.
 * Optionally scoped to a specific employer for relevant results.
 *
 * When an employer is provided, an empty search returns the top roles
 * at that company (sorted by filing count) — enabling a "browse all roles" dropdown.
 */
export async function getJobTitleSuggestions(
  search: string,
  employerName?: string
): Promise<string[]> {
  // Without an employer, require at least 2 chars to avoid huge unscoped queries
  if (!employerName && (!search || search.length < 2)) return [];

  const params: Record<string, string> = {
    select: "job_title",
    order: "filing_count.desc",
    // When scoped to an employer, return ALL roles (no limit)
    // When unscoped, cap at 15 to keep suggestions concise
    ...(!employerName && { limit: "15" }),
  };

  if (search) {
    params.job_title = `ilike.*${search}*`;
  }

  if (employerName) {
    params.employer_name = `ilike.*${employerName}*`;
  }

  const result = await fetchAPI<{ job_title: string }[]>(
    "/h1b_distinct_jobs",
    params
  );

  return result.data.map((r) => r.job_title).filter(Boolean);
}

/**
 * Fetch location suggestions from the DISTINCT view.
 * Uses /h1b_distinct_locations which stores unique (employer, worksite_address) pairs.
 * Also expands state names to abbreviations for better matching.
 * Optionally scoped to a specific employer.
 *
 * When an employer is provided, an empty search returns the top locations
 * for that company — enabling a "browse all locations" dropdown.
 */
export async function getLocationSuggestions(
  search: string,
  employerName?: string
): Promise<string[]> {
  // Without an employer, require at least 2 chars
  if (!employerName && (!search || search.length < 2)) return [];

  // No search term and employer provided → return ALL locations for employer
  if (!search && employerName) {
    const params: Record<string, string> = {
      select: "worksite_address",
      employer_name: `ilike.*${employerName}*`,
      order: "filing_count.desc",
    };

    const result = await fetchAPI<{ worksite_address: string }[]>(
      "/h1b_distinct_locations",
      params
    );

    return result.data.map((r) => r.worksite_address).filter(Boolean);
  }

  const expanded = expandLocationSearch(search);
  const allResults: string[] = [];

  for (const term of expanded) {
    const params: Record<string, string> = {
      select: "worksite_address",
      worksite_address: `ilike.*${term}*`,
      order: "filing_count.desc",
      limit: "10",
    };

    if (employerName) {
      params.employer_name = `ilike.*${employerName}*`;
    }

    const result = await fetchAPI<{ worksite_address: string }[]>(
      "/h1b_distinct_locations",
      params
    );

    allResults.push(
      ...result.data.map((r) => r.worksite_address).filter(Boolean)
    );
  }

  const unique = [...new Set(allResults)];
  return unique.slice(0, 15);
}
