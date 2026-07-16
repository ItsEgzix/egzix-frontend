"use client";

import { useEffect, useMemo, useState } from "react";
import Card from "@/components/Card";
import CategorySelect from "@/components/CategorySelect";
import PlaceInput from "@/components/PlaceInput";
import { createTransaction, getCategories, getPlacesStatus } from "@/lib/api";
import { formatMoney, todayISO } from "@/lib/format";
import type { Category, TransactionType } from "@/lib/types";

export default function AddPage() {
  const [type, setType] = useState<TransactionType>("EXPENSE");
  const [categories, setCategories] = useState<Category[]>([]);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [fromPlace, setFromPlace] = useState("");
  const [toPlace, setToPlace] = useState("");
  const [place, setPlace] = useState("");
  const [placesEnabled, setPlacesEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    getCategories(type)
      .then(setCategories)
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load categories"),
      );
    setCategoryId("");
  }, [type]);

  useEffect(() => {
    getPlacesStatus()
      .then((s) => setPlacesEnabled(s.enabled))
      .catch(() => setPlacesEnabled(false));
  }, []);

  const parentName = useMemo(() => {
    for (const parent of categories) {
      const inParent =
        parent.id === categoryId ||
        (parent.children ?? []).some((c) => c.id === categoryId);
      if (inParent) return parent.name.toLowerCase();
    }
    return null;
  }, [categories, categoryId]);

  const isTransport = parentName === "transportation";
  const placeKind =
    parentName === "meals"
      ? ("food" as const)
      : parentName === "shopping"
        ? ("shopping" as const)
        : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(null);

    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setError("Enter an amount greater than zero");
      return;
    }
    if (!categoryId) {
      setError("Pick a category");
      return;
    }
    if (!description.trim()) {
      setError("Enter a description");
      return;
    }

    setSaving(true);
    try {
      const created = await createTransaction({
        type,
        amount: parsedAmount,
        date,
        description: description.trim(),
        categoryId,
        fromPlace: isTransport ? fromPlace.trim() || undefined : undefined,
        toPlace: isTransport ? toPlace.trim() || undefined : undefined,
        place: placeKind ? place.trim() || undefined : undefined,
      });
      setSaved(
        `Saved ${formatMoney(created.amount)} — ${created.category.name}`,
      );
      setAmount("");
      setDescription("");
      setFromPlace("");
      setToPlace("");
      setPlace("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold text-ink">Add transaction</h1>

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
            {t === "EXPENSE" ? "Expense" : "Income"}
          </button>
        ))}
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="amount" className="text-xs font-medium text-ink-2">
              Amount (RM)
            </label>
            <input
              id="amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="h-14 w-full rounded-xl border border-line bg-surface px-3 text-2xl font-semibold text-ink"
            />
          </div>

          <CategorySelect
            categories={categories}
            value={categoryId}
            onChange={setCategoryId}
          />

          {isTransport && (
            <div className="grid grid-cols-1 gap-4">
              <PlaceInput
                label="From"
                value={fromPlace}
                onChange={setFromPlace}
                suggestionsEnabled={placesEnabled}
                kind="transit"
                placeholder="e.g. Home, KL Sentral"
              />
              <PlaceInput
                label="To"
                value={toPlace}
                onChange={setToPlace}
                suggestionsEnabled={placesEnabled}
                kind="transit"
                placeholder="e.g. KLCC"
              />
            </div>
          )}

          {placeKind && (
            <PlaceInput
              label="Place"
              value={place}
              onChange={setPlace}
              suggestionsEnabled={placesEnabled}
              kind={placeKind}
              placeholder={
                placeKind === "food"
                  ? "e.g. Nasi Kandar Pelita"
                  : "e.g. Mid Valley Megamall"
              }
            />
          )}

          <div className="flex flex-col gap-2">
            <label htmlFor="date" className="text-xs font-medium text-ink-2">
              Date
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="h-12 w-full rounded-xl border border-line bg-surface px-3 text-base text-ink"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="description"
              className="text-xs font-medium text-ink-2"
            >
              Description
            </label>
            <textarea
              id="description"
              rows={3}
              placeholder="e.g. Lunch at mamak"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              required
              className="w-full resize-y rounded-xl border border-line bg-surface px-3 py-3 text-base text-ink"
            />
          </div>

          {error && <p className="text-sm text-bad">{error}</p>}
          {saved && <p className="text-sm text-good">{saved}</p>}

          <button
            type="submit"
            disabled={saving}
            className="h-12 rounded-xl bg-accent text-base font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Saving…" : `Save ${type === "EXPENSE" ? "expense" : "income"}`}
          </button>
        </form>
      </Card>
    </div>
  );
}
