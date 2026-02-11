export interface H1BRecord {
  id: number;
  sq_nm: number;
  job_title: string;
  soc_code: string;
  soc_title: string;
  employer_name: string;
  employer_address: string;
  worksite_address: string;
  wage_rate_of_pay_from: number | null;
  wage_rate_of_pay_to: number | null;
  prevailing_wage: number | null;
  pw_wage_level: string | null;
}

export interface H1BStats {
  total_records: number;
  unique_employers: number;
  unique_job_titles: number;
  avg_wage_from: number;
  min_wage_from: number;
  max_wage_from: number;
}

export interface StateStats {
  state_code: string;
  filing_count: number;
  employer_count: number;
  avg_wage: number;
}

export interface SearchFilters {
  employer_name?: string;
  job_title?: string;
  soc_code?: string;
  worksite_address?: string;
  state_code?: string; // 2-letter state code for precise state-level filtering
  pw_wage_level?: string;
  wage_min?: number;
  wage_max?: number;
  search?: string;
  limit?: number;
  offset?: number;
  order?: string;
}
