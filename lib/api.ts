import type { GeoPoint } from "./geo";
import type {
  Category,
  CreateCategoryInput,
  CreateTransactionInput,
  DailySummary,
  MonthlySummary,
  NearbyKind,
  PlaceSuggestion,
  Transaction,
  TransactionType,
} from "./types";

const BASE = "/api";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      const raw = body?.message;
      message = Array.isArray(raw) ? raw.join(", ") : (raw ?? message);
    } catch {
      // keep the default message
    }
    throw new ApiError(message, response.status);
  }

  return (await response.json()) as T;
}

// --- Categories ---

export function getCategories(type?: TransactionType): Promise<Category[]> {
  const query = type ? `?type=${type}` : "";
  return request<Category[]>(`/categories${query}`);
}

export function createCategory(input: CreateCategoryInput): Promise<Category> {
  return request<Category>("/categories", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function renameCategory(id: string, name: string): Promise<Category> {
  return request<Category>(`/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });
}

export function deleteCategory(id: string): Promise<{ deleted: boolean }> {
  return request<{ deleted: boolean }>(`/categories/${id}`, {
    method: "DELETE",
  });
}

// --- Transactions ---

export interface TransactionFilters {
  from?: string;
  to?: string;
  type?: TransactionType;
  categoryId?: string;
  limit?: number;
}

export function getTransactions(
  filters: TransactionFilters = {},
): Promise<Transaction[]> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined) params.set(key, String(value));
  }
  const query = params.size > 0 ? `?${params.toString()}` : "";
  return request<Transaction[]>(`/transactions${query}`);
}

export function createTransaction(
  input: CreateTransactionInput,
): Promise<Transaction> {
  return request<Transaction>("/transactions", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function deleteTransaction(id: string): Promise<{ deleted: boolean }> {
  return request<{ deleted: boolean }>(`/transactions/${id}`, {
    method: "DELETE",
  });
}

// --- Places ---

export function getPlacesStatus(): Promise<{ enabled: boolean }> {
  return request<{ enabled: boolean }>("/places/status");
}

export function getPlaceSuggestions(
  q: string,
  coords?: GeoPoint | null,
): Promise<PlaceSuggestion[]> {
  const params = new URLSearchParams({ q });
  if (coords) {
    params.set("lat", String(coords.lat));
    params.set("lng", String(coords.lng));
  }
  return request<PlaceSuggestion[]>(`/places/autocomplete?${params}`);
}

export function getNearbyPlaces(
  coords: GeoPoint,
  kind: NearbyKind,
): Promise<PlaceSuggestion[]> {
  const params = new URLSearchParams({
    lat: String(coords.lat),
    lng: String(coords.lng),
    kind,
  });
  return request<PlaceSuggestion[]>(`/places/nearby?${params}`);
}

// --- Summaries ---

export function getDailySummary(date: string): Promise<DailySummary> {
  return request<DailySummary>(`/summary/daily?date=${date}`);
}

export function getMonthlySummary(month: string): Promise<MonthlySummary> {
  return request<MonthlySummary>(`/summary/monthly?month=${month}`);
}
