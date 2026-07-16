"use client";

import { useEffect, useRef, useState } from "react";
import { getNearbyPlaces, getPlaceSuggestions } from "@/lib/api";
import { getCurrentPosition, type GeoPoint } from "@/lib/geo";
import type { NearbyKind, PlaceSuggestion } from "@/lib/types";

interface PlaceInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** When false, typing gets no Google suggestions (still free text). */
  suggestionsEnabled: boolean;
  /** What kind of nearby places to look for. */
  kind?: NearbyKind;
  placeholder?: string;
}

/**
 * Free-text place field with two helpers: typed Google suggestions
 * (location-biased once GPS is known) and a "near me" nearby list.
 * All Google calls go through the backend proxy.
 */
export default function PlaceInput({
  label,
  value,
  onChange,
  suggestionsEnabled,
  kind = "any",
  placeholder,
}: PlaceInputProps) {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextFetch = useRef(false);
  const coordsRef = useRef<GeoPoint | null>(null);

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
        const results = await getPlaceSuggestions(value, coordsRef.current);
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

  const pick = (name: string) => {
    skipNextFetch.current = true;
    onChange(name);
    setOpen(false);
    setSuggestions([]);
    setHint(null);
  };

  const handleNearMe = async () => {
    if (!suggestionsEnabled) {
      setHint("Add a Google Maps API key to use nearby search");
      return;
    }
    setBusy(true);
    setHint(null);
    try {
      const coords = coordsRef.current ?? (await getCurrentPosition());
      coordsRef.current = coords;
      const results = await getNearbyPlaces(coords, kind);
      if (results.length === 0) {
        setHint("No places found near you");
        setOpen(false);
      } else {
        setSuggestions(results);
        setOpen(true);
      }
    } catch (e) {
      setHint(e instanceof Error ? e.message : "Could not search nearby");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div ref={containerRef} className="relative flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-ink-2">{label}</label>
        <button
          type="button"
          onClick={handleNearMe}
          disabled={busy}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-accent disabled:opacity-60"
        >
          <CrosshairIcon />
          {busy ? "Locating…" : "Near me"}
        </button>
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={255}
        autoComplete="off"
        className="h-12 w-full rounded-xl border border-line bg-surface px-3 text-base text-ink"
      />
      {hint && <p className="text-xs text-muted">{hint}</p>}

      {open && suggestions.length > 0 && (
        <ul className="absolute top-full z-30 mt-1 max-h-56 w-full overflow-y-auto overscroll-contain rounded-xl border border-line bg-surface py-1 shadow-lg">
          {suggestions.map((s, i) => (
            <li key={`${s.name}-${i}`}>
              <button
                type="button"
                onClick={() => pick(s.name)}
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

function CrosshairIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </svg>
  );
}
