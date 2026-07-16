"use client";

import { useCallback, useEffect, useState } from "react";
import Card from "@/components/Card";
import CategoryBars from "@/components/CategoryBars";
import TransactionItem from "@/components/TransactionItem";
import {
  deleteTransaction,
  getDailySummary,
  getMonthlySummary,
  getTransactions,
} from "@/lib/api";
import {
  currentMonthISO,
  formatDayLabel,
  formatMoney,
  formatMonthLabel,
  monthRange,
  todayISO,
} from "@/lib/format";
import type { DailySummary, MonthlySummary, Transaction } from "@/lib/types";

type Mode = "DAY" | "MONTH";

export default function DashboardPage() {
  const [mode, setMode] = useState<Mode>("DAY");
  const [date, setDate] = useState(todayISO());
  const [month, setMonth] = useState(currentMonthISO());
  const [daily, setDaily] = useState<DailySummary | null>(null);
  const [monthly, setMonthly] = useState<MonthlySummary | null>(null);
  const [monthTransactions, setMonthTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      if (mode === "DAY") {
        // Tiles always show the month the selected day belongs to
        const [d, m] = await Promise.all([
          getDailySummary(date),
          getMonthlySummary(date.slice(0, 7)),
        ]);
        setDaily(d);
        setMonthly(m);
      } else {
        const [m, list] = await Promise.all([
          getMonthlySummary(month),
          getTransactions({ ...monthRange(month), limit: 500 }),
        ]);
        setMonthly(m);
        setMonthTransactions(list);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data");
    }
  }, [mode, date, month]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDelete = async (id: string) => {
    await deleteTransaction(id);
    void load();
  };

  const summary = mode === "DAY" ? daily : monthly;
  const periodLabel =
    mode === "DAY" ? formatDayLabel(date) : formatMonthLabel(month);

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-lg font-semibold text-ink">My Budget</h1>
        <p className="text-xs text-muted">{periodLabel}</p>
      </header>

      <div className="flex items-center gap-2">
        <div className="grid flex-1 grid-cols-2 gap-1 rounded-xl border border-line bg-surface p-1">
          {(["DAY", "MONTH"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`h-9 rounded-lg text-sm font-medium ${
                mode === m ? "bg-accent text-white" : "text-ink-2"
              }`}
            >
              {m === "DAY" ? "Day" : "Month"}
            </button>
          ))}
        </div>
        {mode === "DAY" ? (
          <input
            type="date"
            value={date}
            onChange={(e) => e.target.value && setDate(e.target.value)}
            className="h-11 rounded-xl border border-line bg-surface px-2 text-sm text-ink"
          />
        ) : (
          <input
            type="month"
            value={month}
            onChange={(e) => e.target.value && setMonth(e.target.value)}
            className="h-11 rounded-xl border border-line bg-surface px-2 text-sm text-ink"
          />
        )}
      </div>

      {error && (
        <p className="rounded-xl border border-line bg-surface p-4 text-sm text-bad">
          {error} — is the backend running?
        </p>
      )}

      {!error && !summary && (
        <p className="py-10 text-center text-sm text-muted">Loading…</p>
      )}

      {!error && summary && (
        <>
          <Card>
            <p className="text-xs text-ink-2">
              Spent {mode === "DAY" ? periodLabel.toLowerCase() : `in ${periodLabel}`}
            </p>
            <p className="mt-1 text-4xl font-semibold tracking-tight text-ink">
              {formatMoney(summary.expenseTotal)}
            </p>
            {summary.incomeTotal > 0 && (
              <p className="mt-1 text-xs text-good">
                +{formatMoney(summary.incomeTotal)} income
              </p>
            )}
          </Card>

          {monthly && (
            <div className="flex flex-col gap-1.5">
              <p className="px-1 text-[11px] font-medium text-muted">
                {formatMonthLabel(monthly.month)}
              </p>
              <div className="grid grid-cols-3 gap-2">
                <StatTile
                  label="Income"
                  value={formatMoney(monthly.incomeTotal)}
                  tone="good"
                />
                <StatTile
                  label="Expenses"
                  value={formatMoney(monthly.expenseTotal)}
                  tone="bad"
                />
                <StatTile
                  label="Balance"
                  value={formatMoney(monthly.net)}
                  tone={monthly.net < 0 ? "bad" : "good"}
                />
              </div>
            </div>
          )}

          <Card title={`${periodLabel} by category`}>
            <CategoryBars
              categories={summary.byCategory.filter((c) => c.type === "EXPENSE")}
            />
          </Card>

          <Card title="Transactions">
            {(() => {
              const list =
                mode === "DAY" ? (daily?.transactions ?? []) : monthTransactions;
              if (list.length === 0) {
                return (
                  <p className="py-4 text-center text-sm text-muted">
                    Nothing recorded in this {mode === "DAY" ? "day" : "month"}
                  </p>
                );
              }
              return (
                <div className="divide-y divide-line">
                  {list.map((t) => (
                    <TransactionItem
                      key={t.id}
                      transaction={t}
                      onDelete={handleDelete}
                      showDate={mode === "MONTH"}
                    />
                  ))}
                </div>
              );
            })()}
          </Card>
        </>
      )}
    </div>
  );
}

function StatTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "good" | "bad";
}) {
  const valueColor =
    tone === "good" ? "text-good" : tone === "bad" ? "text-bad" : "text-ink";
  return (
    <div className="rounded-2xl border border-line bg-surface p-3">
      <p className="text-[11px] text-muted">{label}</p>
      <p className={`mt-0.5 truncate text-sm font-semibold tabular-nums ${valueColor}`}>
        {value}
      </p>
    </div>
  );
}
