"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Card from "@/components/Card";
import TransactionItem from "@/components/TransactionItem";
import { deleteTransaction, getMonthlySummary, getTransactions } from "@/lib/api";
import { currentMonthISO, formatDayLabel, formatMoney } from "@/lib/format";
import type { MonthlySummary, Transaction, TransactionType } from "@/lib/types";

type TypeFilter = "ALL" | TransactionType;

export default function HistoryPage() {
  const [month, setMonth] = useState(currentMonthISO());
  const [filter, setFilter] = useState<TypeFilter>("ALL");
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [m, list] = await Promise.all([
        getMonthlySummary(month),
        getTransactions({ ...monthRange(month), limit: 500 }),
      ]);
      setSummary(m);
      setTransactions(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load history");
    }
  }, [month]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDelete = async (id: string) => {
    await deleteTransaction(id);
    void load();
  };

  const groups = useMemo(() => {
    const filtered =
      filter === "ALL"
        ? transactions
        : transactions.filter((t) => t.type === filter);
    const byDate = new Map<string, Transaction[]>();
    for (const t of filtered) {
      const list = byDate.get(t.date) ?? [];
      list.push(t);
      byDate.set(t.date, list);
    }
    return [...byDate.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [transactions, filter]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-ink">History</h1>
        <input
          type="month"
          value={month}
          onChange={(e) => e.target.value && setMonth(e.target.value)}
          className="h-10 rounded-xl border border-line bg-surface px-2 text-sm text-ink"
        />
      </div>

      {summary && (
        <div className="flex gap-4 rounded-2xl border border-line bg-surface p-3 text-sm">
          <span className="text-good">+{formatMoney(summary.incomeTotal)}</span>
          <span className="text-bad">−{formatMoney(summary.expenseTotal)}</span>
          <span className="ml-auto font-semibold text-ink">
            {formatMoney(summary.net)}
          </span>
        </div>
      )}

      <div className="flex gap-1 rounded-xl border border-line bg-surface p-1">
        {(
          [
            ["ALL", "All"],
            ["EXPENSE", "Expenses"],
            ["INCOME", "Income"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`h-9 flex-1 rounded-lg text-sm font-medium ${
              filter === value ? "bg-accent text-white" : "text-ink-2"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-bad">{error}</p>}

      {!error && groups.length === 0 && (
        <p className="py-10 text-center text-sm text-muted">
          No transactions this month
        </p>
      )}

      {groups.map(([date, items]) => {
        const dayExpense = items
          .filter((t) => t.type === "EXPENSE")
          .reduce((sum, t) => sum + t.amount, 0);
        return (
          <Card
            key={date}
            title={formatDayLabel(date)}
            action={
              dayExpense > 0 ? (
                <span className="text-xs font-medium tabular-nums text-bad">
                  −{formatMoney(dayExpense)}
                </span>
              ) : undefined
            }
          >
            <div className="divide-y divide-line">
              {items.map((t) => (
                <TransactionItem
                  key={t.id}
                  transaction={t}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function monthRange(month: string): { from: string; to: string } {
  const start = new Date(`${month}-01T00:00:00`);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  end.setDate(0);
  const to = [
    end.getFullYear(),
    String(end.getMonth() + 1).padStart(2, "0"),
    String(end.getDate()).padStart(2, "0"),
  ].join("-");
  return { from: `${month}-01`, to };
}
