// US State name ↔ abbreviation mapping
// Used to auto-expand searches so users can type either form

const STATE_MAP: Record<string, string> = {
  "alabama": "AL",
  "alaska": "AK",
  "arizona": "AZ",
  "arkansas": "AR",
  "california": "CA",
  "colorado": "CO",
  "connecticut": "CT",
  "delaware": "DE",
  "florida": "FL",
  "georgia": "GA",
  "hawaii": "HI",
  "idaho": "ID",
  "illinois": "IL",
  "indiana": "IN",
  "iowa": "IA",
  "kansas": "KS",
  "kentucky": "KY",
  "louisiana": "LA",
  "maine": "ME",
  "maryland": "MD",
  "massachusetts": "MA",
  "michigan": "MI",
  "minnesota": "MN",
  "mississippi": "MS",
  "missouri": "MO",
  "montana": "MT",
  "nebraska": "NE",
  "nevada": "NV",
  "new hampshire": "NH",
  "new jersey": "NJ",
  "new mexico": "NM",
  "new york": "NY",
  "north carolina": "NC",
  "north dakota": "ND",
  "ohio": "OH",
  "oklahoma": "OK",
  "oregon": "OR",
  "pennsylvania": "PA",
  "rhode island": "RI",
  "south carolina": "SC",
  "south dakota": "SD",
  "tennessee": "TN",
  "texas": "TX",
  "utah": "UT",
  "vermont": "VT",
  "virginia": "VA",
  "washington": "WA",
  "west virginia": "WV",
  "wisconsin": "WI",
  "wyoming": "WY",
  "district of columbia": "DC",
  "puerto rico": "PR",
  "guam": "GU",
  "virgin islands": "VI",
};

// Reverse map: abbreviation → full name
const ABBREV_TO_NAME: Record<string, string> = {};
for (const [name, abbrev] of Object.entries(STATE_MAP)) {
  ABBREV_TO_NAME[abbrev] = name
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Given a search term, detect if it contains a state name or abbreviation
 * and return the alternate form(s) to also search for.
 *
 * Examples:
 *   "Connecticut"  → { original: "Connecticut", alternate: "CT", type: "name_to_abbrev" }
 *   "CT"           → { original: "CT", alternate: "Connecticut", type: "abbrev_to_name" }
 *   "San Francisco" → null (not a state)
 */
export function detectStateInQuery(query: string): {
  original: string;
  alternate: string;
  stateName: string;
  stateAbbrev: string;
} | null {
  const trimmed = query.trim();
  const lower = trimmed.toLowerCase();

  // Check if the entire query or the last word(s) match a state name
  // First check full match
  if (STATE_MAP[lower]) {
    return {
      original: trimmed,
      alternate: STATE_MAP[lower],
      stateName: ABBREV_TO_NAME[STATE_MAP[lower]],
      stateAbbrev: STATE_MAP[lower],
    };
  }

  // Check if it's a 2-letter abbreviation
  const upper = trimmed.toUpperCase();
  if (upper.length === 2 && ABBREV_TO_NAME[upper]) {
    return {
      original: trimmed,
      alternate: ABBREV_TO_NAME[upper],
      stateName: ABBREV_TO_NAME[upper],
      stateAbbrev: upper,
    };
  }

  // Check if the query ends with a state name (e.g., "jobs in Connecticut")
  for (const [name, abbrev] of Object.entries(STATE_MAP)) {
    if (lower.endsWith(name)) {
      return {
        original: trimmed,
        alternate: trimmed.slice(0, -name.length) + abbrev,
        stateName: ABBREV_TO_NAME[abbrev],
        stateAbbrev: abbrev,
      };
    }
  }

  // Check if query contains a state name as a whole word
  for (const [name, abbrev] of Object.entries(STATE_MAP)) {
    const regex = new RegExp(`\\b${name}\\b`, "i");
    if (regex.test(lower)) {
      return {
        original: trimmed,
        alternate: trimmed.replace(regex, abbrev),
        stateName: ABBREV_TO_NAME[abbrev],
        stateAbbrev: abbrev,
      };
    }
  }

  return null;
}

/**
 * Expand a location search term to include both state name and abbreviation.
 * Returns an array of search terms to OR together.
 *
 * "Connecticut" → ["Connecticut", "CT"]
 * "San Francisco" → ["San Francisco"]
 * "NY" → ["NY", "New York"]
 */
export function expandLocationSearch(term: string): string[] {
  const terms = [term];
  const detected = detectStateInQuery(term);
  if (detected) {
    terms.push(detected.alternate);
  }
  return terms;
}

/**
 * Get a suggestion message when zero results are found.
 */
export function getStateSuggestion(query: string): string | null {
  const detected = detectStateInQuery(query);
  if (!detected) return null;

  return `In the dataset, "${detected.stateName}" is stored as "${detected.stateAbbrev}". Try searching for "${detected.stateAbbrev}" instead.`;
}

export { STATE_MAP, ABBREV_TO_NAME };
