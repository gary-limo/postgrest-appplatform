export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null) return "N/A";
  return new Intl.NumberFormat("en-US").format(value);
}

export function extractState(address: string): string {
  if (!address) return "";
  // Try to extract 2-letter state code from address
  const match = address.match(/\b([A-Z]{2})\s+\d{5}/);
  return match ? match[1] : "";
}

export function extractCity(address: string): string {
  if (!address) return "";
  // Worksite address format: "Street City COUNTY STATE ZIP"
  // Try to get the city portion
  const parts = address.split(" ");
  // Find the state code (2 uppercase letters before ZIP)
  for (let i = parts.length - 1; i >= 0; i--) {
    if (/^\d{5}$/.test(parts[i]) && i >= 2) {
      // State is 2 positions before ZIP, county is 1 before that, city is before county
      // But format varies - return what we can
      const stateIdx = i - 1;
      const countyIdx = i - 2;
      // Look backwards from county to find city
      if (countyIdx >= 1) {
        // The word before county is usually the city (simplified)
        return parts.slice(0, countyIdx).join(" ").split(",")[0];
      }
    }
  }
  return address.split(",")[0] || "";
}

export function getWageLevelLabel(level: string | null): string {
  switch (level) {
    case "I": return "Level I (Entry)";
    case "II": return "Level II (Qualified)";
    case "III": return "Level III (Experienced)";
    case "IV": return "Level IV (Expert)";
    default: return level || "N/A";
  }
}

export function getWageLevelColor(level: string | null): string {
  switch (level) {
    case "I": return "bg-blue-100 text-blue-800";
    case "II": return "bg-green-100 text-green-800";
    case "III": return "bg-purple-100 text-purple-800";
    case "IV": return "bg-orange-100 text-orange-800";
    default: return "bg-gray-100 text-gray-800";
  }
}
