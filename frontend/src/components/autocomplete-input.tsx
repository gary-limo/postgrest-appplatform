"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Loader2, ChevronDown } from "lucide-react";

interface AutocompleteInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  fetchSuggestions: (query: string) => Promise<string[]>;
  queryKeyPrefix: string;
  minChars?: number;
  debounceMs?: number;
  /**
   * When true, clicking/focusing the input shows a dropdown of top results
   * even before the user types anything. Useful when scoped to an employer
   * so users can browse all available roles/locations.
   * Also adds a dropdown chevron icon.
   */
  showAllOnFocus?: boolean;
  /** Label used in the dropdown header/loading text (e.g. "roles", "locations"). Defaults to "items". */
  dropdownLabel?: string;
}

export function AutocompleteInput({
  id,
  value,
  onChange,
  placeholder,
  fetchSuggestions,
  queryKeyPrefix,
  minChars = 2,
  debounceMs = 300,
  showAllOnFocus = false,
  dropdownLabel = "items",
}: AutocompleteInputProps) {
  const [inputValue, setInputValue] = useState(value);
  const [debouncedValue, setDebouncedValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // When showAllOnFocus is enabled, we treat minChars as 0
  const effectiveMinChars = showAllOnFocus ? 0 : minChars;

  // Sync external value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Debounce the search term
  useEffect(() => {
    const timer = setTimeout(
      () => {
        if (inputValue.length >= effectiveMinChars) {
          setDebouncedValue(inputValue);
        } else {
          setDebouncedValue("");
        }
      },
      // No debounce needed for the initial empty-string preload
      inputValue.length === 0 && showAllOnFocus ? 0 : debounceMs
    );
    return () => clearTimeout(timer);
  }, [inputValue, effectiveMinChars, debounceMs, showAllOnFocus]);

  // Fetch suggestions — enabled when:
  // - Typed enough chars (standard autocomplete), OR
  // - showAllOnFocus is on and dropdown is open (combo-box mode)
  const queryEnabled = showAllOnFocus
    ? isOpen
    : debouncedValue.length >= minChars;

  const { data: suggestions = [], isFetching } = useQuery({
    queryKey: [queryKeyPrefix, debouncedValue],
    queryFn: () => fetchSuggestions(debouncedValue),
    enabled: queryEnabled,
    staleTime: 30 * 1000,
  });

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleSelect = useCallback(
    (suggestion: string) => {
      setInputValue(suggestion);
      onChange(suggestion);
      setIsOpen(false);
      setHighlightedIndex(-1);
    },
    [onChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSelect(suggestions[highlightedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll("li");
      if (items[highlightedIndex]) {
        items[highlightedIndex].scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex]);

  const handleFocus = () => {
    if (showAllOnFocus) {
      // In combo-box mode, always open dropdown on focus
      setIsOpen(true);
    } else if (debouncedValue.length >= minChars) {
      setIsOpen(true);
    }
  };

  const handleChevronClick = () => {
    if (isOpen) {
      setIsOpen(false);
    } else {
      setIsOpen(true);
      inputRef.current?.focus();
    }
  };

  const showDropdown =
    isOpen &&
    (showAllOnFocus || debouncedValue.length >= minChars) &&
    (suggestions.length > 0 || isFetching);

  // Highlight the matching part of the suggestion
  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <span className="font-semibold text-[#1B2A4A]">
          {text.slice(idx, idx + query.length)}
        </span>
        {text.slice(idx + query.length)}
      </>
    );
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          id={id}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={showDropdown}
          aria-autocomplete="list"
          className={`${
            inputValue
              ? "font-semibold text-[#1B2A4A] border-[#1B2A4A]/30 bg-[#1B2A4A]/[0.02]"
              : ""
          } ${showAllOnFocus ? "pr-16" : ""}`}
        />
        {/* Loading spinner */}
        {isFetching && (
          <Loader2
            className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground ${
              showAllOnFocus ? "right-9" : "right-3"
            }`}
          />
        )}
        {/* Dropdown chevron — shown when in combo-box mode */}
        {showAllOnFocus && (
          <button
            type="button"
            tabIndex={-1}
            onClick={handleChevronClick}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[#1B2A4A]/5 text-muted-foreground hover:text-[#1B2A4A] transition-colors"
            aria-label="Toggle dropdown"
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </button>
        )}
      </div>

      {showDropdown && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-lg border border-[#E0DCD4] bg-white shadow-lg"
        >
          {isFetching && suggestions.length === 0 ? (
            <li className="px-3 py-2.5 text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              {showAllOnFocus ? `Loading ${dropdownLabel}...` : "Searching..."}
            </li>
          ) : (
            <>
              {/* Header when showing all items in combo-box mode */}
              {showAllOnFocus && !inputValue && (
                <li className="px-3 py-1.5 text-xs text-muted-foreground bg-[#FAF7F0] border-b border-[#E0DCD4] sticky top-0">
                  {suggestions.length} {dropdownLabel} available — type to filter
                </li>
              )}
              {suggestions.map((suggestion, index) => (
                <li
                  key={suggestion}
                  role="option"
                  aria-selected={index === highlightedIndex}
                  className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                    index === highlightedIndex
                      ? "bg-[#1B2A4A]/5 text-[#1B2A4A]"
                      : "text-foreground hover:bg-[#FAF7F0]"
                  }`}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onMouseDown={(e) => {
                    e.preventDefault(); // Prevent input blur
                    handleSelect(suggestion);
                  }}
                >
                  {highlightMatch(suggestion, inputValue)}
                </li>
              ))}
            </>
          )}
        </ul>
      )}
    </div>
  );
}
