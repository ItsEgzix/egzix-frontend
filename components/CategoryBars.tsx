"use client";

import { formatMoney } from "@/lib/format";
import type { CategoryTotal } from "@/lib/types";

interface CategoryBarsProps {
  categories: CategoryTotal[];
}

/**
 * Horizontal magnitude bars for top-level category totals,
 * with subcategory breakdowns listed under each bar.
 */
export default function CategoryBars({ categories }: CategoryBarsProps) {
  if (categories.length === 0) {
    return <p className="py-4 text-center text-sm text-muted">No expenses yet</p>;
  }

  const max = Math.max(...categories.map((c) => c.total));

  return (
    <ul className="flex flex-col gap-3">
      {categories.map((cat) => (
        <li key={cat.categoryId}>
          <div className="mb-1 flex items-baseline justify-between gap-2">
            <span className="truncate text-sm text-ink">{cat.name}</span>
            <span className="shrink-0 text-sm font-medium tabular-nums text-ink">
              {formatMoney(cat.total)}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${Math.max((cat.total / max) * 100, 2)}%` }}
            />
          </div>
          {cat.subcategories.length > 0 && (
            <p className="mt-1 truncate text-xs text-muted">
              {cat.subcategories
                .map((s) => `${s.name} ${formatMoney(s.total)}`)
                .join(" · ")}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
