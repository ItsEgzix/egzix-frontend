"use client";

import { useCallback, useEffect, useState } from "react";
import Card from "@/components/Card";
import CategoryBars from "@/components/CategoryBars";
import TransactionItem from "@/components/TransactionItem";
import { deleteTransaction, getDailySummary, getMonthlySummary } from "@/lib/api";
import {
  currentMonthISO,
  formatMoney,
  formatMonthLabel,
  todayISO,
} from "@/lib/format";
import type { DailySummary, MonthlySummary } from "@/lib/types";

export default function DashboardPage() {
  const [daily, setDaily] = useState<DailySummary | null>(null);
  const [monthly, setMonthly] = useState<MonthlySummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [d, m] = await Promise.all([
        getDailySummary(todayISO()),
        getMonthlySummary(currentMonthISO()),
      ]);
      setDaily(d);
      setMonthly(m);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDelete = async (id: string) => {
    await deleteTransaction(id);
    void load();
  };

  if (error) {
    return (
      <p className="rounded-xl border border-line bg-surface p-4 text-sm text-bad">
        {error} — is the backend running?
      </p>
    );
  }

  if (!daily || !monthly) {
    return <p className="py-10 text-center text-sm text-muted">Loading…</p>;
  }

  const expenseCategories = monthly.byCategory.filter(
    (c) => c.type === "EXPENSE",
  );

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-lg font-semibold text-ink">My Budget</h1>
        <p className="text-xs text-muted">{formatMonthLabel(monthly.month)}</p>
      </header>

      <Card>
        <p className="text-xs text-ink-2">Spent today</p>
        <p className="mt-1 text-4xl font-semibold tracking-tight text-ink">
          {formatMoney(daily.expenseTotal)}
        </p>
        {daily.incomeTotal > 0 && (
          <p className="mt-1 text-xs text-good">
            +{formatMoney(daily.incomeTotal)} income today
          </p>
        )}
      </Card>

      <div className="grid grid-cols-3 gap-2">
        <StatTile label="Income" value={formatMoney(monthly.incomeTotal)} tone="good" />
        <StatTile label="Expenses" value={formatMoney(monthly.expenseTotal)} />
        <StatTile
          label="Balance"
          value={formatMoney(monthly.net)}
          tone={monthly.net < 0 ? "bad" : "good"}
        />
      </div>

      <Card title="This month by category">
        <CategoryBars categories={expenseCategories} />
      </Card>

      <Card title="Today">
        {daily.transactions.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted">
            Nothing recorded today
          </p>
        ) : (
          <div className="divide-y divide-line">
            {daily.transactions.map((t) => (
              <TransactionItem key={t.id} transaction={t} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </Card>
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
