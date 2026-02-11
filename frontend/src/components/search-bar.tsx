"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  defaultValue?: string;
  size?: "default" | "large";
  placeholder?: string;
}

export function SearchBar({
  defaultValue = "",
  size = "default",
  placeholder = "Search by company, job title, or location...",
}: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    } else {
      router.push("/search");
    }
  };

  const isLarge = size === "large";

  return (
    <form onSubmit={handleSearch} className="flex gap-2 w-full">
      <div className="relative flex-1">
        <Search
          className={`absolute left-3 top-1/2 -translate-y-1/2 ${
            isLarge
              ? "h-5 w-5 text-[#1B2A4A]/40"
              : "h-4 w-4 text-muted-foreground"
          }`}
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className={`${
            isLarge
              ? "h-14 pl-11 text-lg bg-white text-[#1B2A4A] border-white/20 shadow-lg placeholder:text-[#1B2A4A]/40 focus:ring-[#C4A35A] focus:border-[#C4A35A]"
              : "h-10 pl-9"
          } rounded-xl`}
        />
      </div>
      <Button
        type="submit"
        size={isLarge ? "lg" : "default"}
        className={`${
          isLarge
            ? "h-14 px-8 bg-[#C41E3A] hover:bg-[#A01830] text-white shadow-lg"
            : "bg-[#1B2A4A] hover:bg-[#2B3F6B] text-white"
        } rounded-xl font-semibold`}
      >
        Search
      </Button>
    </form>
  );
}
