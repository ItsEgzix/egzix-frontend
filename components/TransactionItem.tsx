"use client";

import { formatDayLabel, formatSignedMoney } from "@/lib/format";
import type { Transaction } from "@/lib/types";

interface TransactionItemProps {
  transaction: Transaction;
  onDelete?: (id: string) => void;
  showDate?: boolean;
}

export default function TransactionItem({
  transaction,
  onDelete,
  showDate = false,
}: TransactionItemProps) {
  const { category } = transaction;
  const categoryLabel = category.parentName
    ? `${category.parentName} · ${category.name}`
    : category.name;
  const meta = showDate
    ? `${formatDayLabel(transaction.date)} · ${categoryLabel}`
    : categoryLabel;

  return (
    <div className="flex items-center gap-3 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">
          {transaction.description || meta}
        </p>
        {transaction.description && (
          <p className="truncate text-xs text-muted">{meta}</p>
        )}
        {(transaction.fromPlace || transaction.toPlace) && (
          <p className="truncate text-xs text-muted">
            {transaction.fromPlace ?? "?"} → {transaction.toPlace ?? "?"}
          </p>
        )}
      </div>
      <span
        className={`shrink-0 text-sm font-semibold tabular-nums ${
          transaction.type === "INCOME" ? "text-good" : "text-bad"
        }`}
      >
        {formatSignedMoney(transaction.amount, transaction.type)}
      </span>
      {onDelete && (
        <button
          type="button"
          aria-label="Delete transaction"
          onClick={() => onDelete(transaction.id)}
          className="shrink-0 rounded-lg p-2 text-muted hover:text-bad"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v6M14 11v6" />
          </svg>
        </button>
      )}
    </div>
  );
}
