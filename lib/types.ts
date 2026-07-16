export type TransactionType = "INCOME" | "EXPENSE";

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  parentId: string | null;
  children?: Category[];
  _count?: { transactions: number };
}

export interface TransactionCategory {
  id: string;
  name: string;
  parentId: string | null;
  parentName: string | null;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string | null;
  date: string; // YYYY-MM-DD
  fromPlace: string | null;
  toPlace: string | null;
  place: string | null;
  categoryId: string;
  category: TransactionCategory;
  createdAt: string;
}

export type NearbyKind = "food" | "shopping" | "transit" | "any";

export interface PlaceSuggestion {
  name: string;
  address: string;
}

export interface SubcategoryTotal {
  categoryId: string;
  name: string;
  total: number;
}

export interface CategoryTotal {
  categoryId: string;
  name: string;
  type: TransactionType;
  total: number;
  subcategories: SubcategoryTotal[];
}

export interface DailySummary {
  date: string;
  incomeTotal: number;
  expenseTotal: number;
  net: number;
  byCategory: CategoryTotal[];
  transactions: Transaction[];
}

export interface MonthlySummary {
  month: string;
  incomeTotal: number;
  expenseTotal: number;
  net: number;
  byCategory: CategoryTotal[];
  transactionCount: number;
  dailyExpenses: { date: string; total: number }[];
}

export interface CreateTransactionInput {
  type: TransactionType;
  amount: number;
  date: string;
  description: string;
  categoryId: string;
  fromPlace?: string;
  toPlace?: string;
  place?: string;
}

export interface CreateCategoryInput {
  name: string;
  type: TransactionType;
  parentId?: string;
}
