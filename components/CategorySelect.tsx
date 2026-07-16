"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Category } from "@/lib/types";

interface CategorySelectProps {
  categories: Category[];
  value: string;
  onChange: (categoryId: string) => void;
  placeholder?: string;
}

/**
 * Searchable category dropdown. Lists top-level categories with their
 * subcategories indented; typing filters both levels. Selecting a
 * top-level row records the transaction against the general category.
 */
export default function CategorySelect({
  categories,
  value,
  onChange,
  placeholder = "Select a category…",
}: CategorySelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

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
    if (open) {
      setQuery("");
      searchRef.current?.focus();
    }
  }, [open]);

  const selectedLabel = useMemo(() => {
    for (const parent of categories) {
      if (parent.id === value) return parent.name;
      for (const child of parent.children ?? []) {
        if (child.id === value) return `${parent.name} · ${child.name}`;
      }
    }
    return null;
  }, [categories, value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return categories
      .map((parent) => {
        const children = parent.children ?? [];
        if (!q) return { parent, children };
        if (parent.name.toLowerCase().includes(q)) {
          return { parent, children };
        }
        const matching = children.filter((c) =>
          c.name.toLowerCase().includes(q),
        );
        return matching.length > 0 ? { parent, children: matching } : null;
      })
      .filter((g): g is { parent: Category; children: Category[] } => g !== null);
  }, [categories, query]);

  const select = (id: string) => {
    onChange(id);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative flex flex-col gap-2">
      <label className="text-xs font-medium text-ink-2">Category</label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex h-12 w-full items-center justify-between rounded-xl border border-line bg-surface px-3 text-base ${
          selectedLabel ? "text-ink" : "text-muted"
        }`}
      >
        <span className="truncate">{selectedLabel ?? placeholder}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full z-30 mt-1 w-full overflow-hidden rounded-xl border border-line bg-surface shadow-lg">
          <div className="border-b border-line p-2">
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search categories…"
              className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink"
            />
          </div>
          <ul className="max-h-64 overflow-y-auto overscroll-contain py-1">
            {filtered.length === 0 && (
              <li className="px-3 py-3 text-center text-sm text-muted">
                No matching category
              </li>
            )}
            {filtered.map(({ parent, children }) => (
              <li key={parent.id}>
                <button
                  type="button"
                  onClick={() => select(parent.id)}
                  className={`flex w-full items-center px-3 py-2.5 text-left text-sm font-semibold ${
                    value === parent.id
                      ? "bg-accent-soft text-ink"
                      : "text-ink hover:bg-accent-soft"
                  }`}
                >
                  {parent.name}
                </button>
                {children.map((child) => (
                  <button
                    key={child.id}
                    type="button"
                    onClick={() => select(child.id)}
                    className={`flex w-full items-center py-2.5 pl-7 pr-3 text-left text-sm ${
                      value === child.id
                        ? "bg-accent-soft text-ink"
                        : "text-ink-2 hover:bg-accent-soft"
                    }`}
                  >
                    {child.name}
                  </button>
                ))}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
