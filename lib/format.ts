const currency = new Intl.NumberFormat("en-MY", {
  style: "currency",
  currency: "MYR",
  minimumFractionDigits: 2,
});

export function formatMoney(amount: number): string {
  return currency.format(amount);
}

export function formatSignedMoney(amount: number, type: string): string {
  const sign = type === "INCOME" ? "+" : "−";
  return `${sign}${currency.format(Math.abs(amount))}`;
}

export function todayISO(): string {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

export function currentMonthISO(): string {
  return todayISO().slice(0, 7);
}

export function formatDayLabel(date: string): string {
  if (date === todayISO()) return "Today";
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayISO = [
    yesterday.getFullYear(),
    String(yesterday.getMonth() + 1).padStart(2, "0"),
    String(yesterday.getDate()).padStart(2, "0"),
  ].join("-");
  if (date === yesterdayISO) return "Yesterday";
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-MY", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function monthRange(month: string): { from: string; to: string } {
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

export function formatMonthLabel(month: string): string {
  return new Date(`${month}-01T00:00:00`).toLocaleDateString("en-MY", {
    month: "long",
    year: "numeric",
  });
}
