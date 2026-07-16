"use client";

import { useEffect, useRef, useState } from "react";
import { getPlaceSuggestions } from "@/lib/api";
import type { PlaceSuggestion } from "@/lib/types";

interface PlaceInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** When false, behaves as a plain text input (no Google suggestions). */
  suggestionsEnabled: boolean;
  placeholder?: string;
}

/**
 * Free-text place field with Google Places suggestions (proxied through
 * the backend). Typing is always allowed; suggestions are optional help.
 */
export default function PlaceInput({
  label,
  value,
  onChange,
  suggestionsEnabled,
  placeholder,
}: PlaceInputProps) {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextFetch = useRef(false);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (!suggestionsEnabled) return;
    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      return;
    }
    if (value.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await getPlaceSuggestions(value);
        setSuggestions(results);
        setOpen(results.length > 0);
      } catch {
        setSuggestions([]);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, suggestionsEnabled]);

  const pick = (s: PlaceSuggestion) => {
    skipNextFetch.current = true;
    onChange(s.name);
    setOpen(false);
    setSuggestions([]);
  };

  return (
    <div ref={containerRef} className="relative flex flex-col gap-2">
      <label className="text-xs font-medium text-ink-2">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={255}
        autoComplete="off"
        className="h-12 w-full rounded-xl border border-line bg-surface px-3 text-base text-ink"
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute top-full z-30 mt-1 max-h-56 w-full overflow-y-auto overscroll-contain rounded-xl border border-line bg-surface py-1 shadow-lg">
          {suggestions.map((s, i) => (
            <li key={`${s.name}-${i}`}>
              <button
                type="button"
                onClick={() => pick(s)}
                className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-accent-soft"
              >
                <span className="w-full truncate text-sm text-ink">
                  {s.name}
                </span>
                {s.address && (
                  <span className="w-full truncate text-xs text-muted">
                    {s.address}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
