"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Card from "@/components/Card";
import ThemeToggle from "@/components/ThemeToggle";
import {
  createCategory,
  deleteCategory,
  getCategories,
  renameCategory,
} from "@/lib/api";
import type { Category, TransactionType } from "@/lib/types";

export default function SettingsPage() {
  const [type, setType] = useState<TransactionType>("EXPENSE");
  const [categories, setCategories] = useState<Category[]>([]);
  const [newName, setNewName] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setCategories(await getCategories(type));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load categories");
    }
  }, [type]);

  useEffect(() => {
    void load();
  }, [load]);

  const run = async (action: () => Promise<unknown>) => {
    try {
      setError(null);
      await action();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  };

  const handleAddTopLevel = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    void run(async () => {
      await createCategory({ name, type });
      setNewName("");
    });
  };

  const handleAddSub = (parent: Category) => {
    const name = window.prompt(`New subcategory under "${parent.name}":`);
    if (!name?.trim()) return;
    void run(() =>
      createCategory({ name: name.trim(), type, parentId: parent.id }),
    );
  };

  const handleRename = (category: Category) => {
    const name = window.prompt("Rename category:", category.name);
    if (!name?.trim() || name.trim() === category.name) return;
    void run(() => renameCategory(category.id, name.trim()));
  };

  const handleDelete = (category: Category) => {
    const label = category.parentId ? "subcategory" : "category";
    if (!window.confirm(`Delete ${label} "${category.name}"?`)) return;
    void run(() => deleteCategory(category.id));
  };

  const visibleCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;
    return categories
      .map((parent) => {
        if (parent.name.toLowerCase().includes(q)) return parent;
        const children = (parent.children ?? []).filter((c) =>
          c.name.toLowerCase().includes(q),
        );
        return children.length > 0 ? { ...parent, children } : null;
      })
      .filter((c): c is Category => c !== null);
  }, [categories, search]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold text-ink">Settings</h1>

      <ThemeToggle />

      <span className="mt-1 text-xs font-medium text-ink-2">Categories</span>
      <div className="grid grid-cols-2 gap-1 rounded-xl border border-line bg-surface p-1">
        {(["EXPENSE", "INCOME"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`h-10 rounded-lg text-sm font-medium ${
              type === t ? "bg-accent text-white" : "text-ink-2"
            }`}
          >
            {t === "EXPENSE" ? "Expense categories" : "Income categories"}
          </button>
        ))}
      </div>

      <form onSubmit={handleAddTopLevel} className="flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New category name"
          maxLength={60}
          className="h-12 min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 text-base text-ink"
        />
        <button
          type="submit"
          className="h-12 shrink-0 rounded-xl bg-accent px-4 text-sm font-semibold text-white"
        >
          Add
        </button>
      </form>

      {error && <p className="text-sm text-bad">{error}</p>}

      <div className="relative">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          aria-hidden
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4-4" />
        </svg>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search categories…"
          className="h-12 w-full rounded-xl border border-line bg-surface pl-10 pr-3 text-base text-ink"
        />
      </div>

      {visibleCategories.length === 0 && (
        <p className="py-6 text-center text-sm text-muted">
          No matching category
        </p>
      )}

      <div className="flex flex-col gap-3">
        {visibleCategories.map((category) => (
          <Card
            key={category.id}
            title={category.name}
            action={
              <span className="flex gap-1">
                <IconButton label="Add subcategory" onClick={() => handleAddSub(category)}>
                  <PlusSmallIcon />
                </IconButton>
                <IconButton label="Rename" onClick={() => handleRename(category)}>
                  <PencilIcon />
                </IconButton>
                <IconButton label="Delete" onClick={() => handleDelete(category)} danger>
                  <TrashIcon />
                </IconButton>
              </span>
            }
          >
            {category.children && category.children.length > 0 ? (
              <ul className="divide-y divide-line">
                {category.children.map((child) => (
                  <li key={child.id} className="flex items-center gap-2 py-2">
                    <span className="min-w-0 flex-1 truncate text-sm text-ink">
                      {child.name}
                    </span>
                    <IconButton label="Rename" onClick={() => handleRename(child)}>
                      <PencilIcon />
                    </IconButton>
                    <IconButton label="Delete" onClick={() => handleDelete(child)} danger>
                      <TrashIcon />
                    </IconButton>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted">No subcategories</p>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`rounded-lg p-1.5 ${danger ? "text-muted hover:text-bad" : "text-muted hover:text-accent"}`}
    >
      {children}
    </button>
  );
}

function PlusSmallIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
    </svg>
  );
}
