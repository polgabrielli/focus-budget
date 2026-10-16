export type TransactionType = 'expense' | 'income';
export type CurrencyCode = 'ARS' | 'USD';

export interface Transaction {
  id: string; // UUID
  amount: number;
  type: TransactionType;
  categoryId: string;
  subTag?: string | null; // e.g. for Hija: 'Cuota', 'Niñera', 'Pañales', 'Colegio', 'Ropa'
  currency: CurrencyCode;
  exchangeRate: number; // Stored rate at transaction time
  date: string; // YYYY-MM-DD
  note?: string;
  commitmentId?: string | null; // Linked to a debt/loan installment payment
  reminderId?: string | null; // Linked to a due bill payment
  createdAt: string; // ISO
  updatedAt: string; // ISO
  deletedAt?: string | null; // Soft-delete for local sync
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon: string; // Emoji or Lucide icon key
  color: string; // Hex color code
  description: string;
  subTags?: string[];
  isSystem: boolean;
  sortOrder: number;
}

export type CommitmentType = 'debt' | 'credit'; // 'debt' = Debo (pasivo), 'credit' = Me deben (activo)

export interface Commitment {
  id: string; // UUID
  title: string;
  counterpart: string; // Persona o entidad
  type: CommitmentType;
  totalAmount: number;
  paidAmount: number;
  installmentsTotal?: number;
  installmentsPaid?: number;
  currency: CurrencyCode;
  dueDate?: string | null; // YYYY-MM-DD
  notes?: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export type ReminderStatus = 'pending' | 'paid';

export interface Reminder {
  id: string; // UUID
  title: string;
  amount: number;
  currency: CurrencyCode;
  dueDate: string; // YYYY-MM-DD
  categoryId: string;
  isRecurring: boolean;
  recurrenceDay?: number | null; // e.g. day 10 of each month
  status: ReminderStatus;
  paidDate?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export type UsdRateType = 'oficial' | 'mep' | 'blue';

export interface ExchangeRateDetail {
  compra: number;
  venta: number;
  nombre?: string;
  fechaActualizacion?: string;
}

export interface ExchangeRateCache {
  id: string; // 'USD'
  currency: string;
  compra: number;
  venta: number;
  source: string;
  fetchedAt: string; // ISO
  oficial?: ExchangeRateDetail;
  mep?: ExchangeRateDetail;
  blue?: ExchangeRateDetail;
  activeRateType?: UsdRateType;
}

export interface DateFilter {
  type: 'today' | 'yesterday' | 'custom' | 'month';
  selectedDate: string; // YYYY-MM-DD
  monthString?: string; // YYYY-MM
}

export interface CategorySummary {
  category: Category;
  totalAmount: number;
  count: number;
  percentage: number;
}
