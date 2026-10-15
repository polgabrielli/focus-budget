import Dexie, { type Table } from 'dexie';
import { 
  type Transaction, 
  type Category, 
  type Commitment, 
  type Reminder, 
  type ExchangeRateCache 
} from '../types';

export const INITIAL_CATEGORIES: Category[] = [
  // 8 Categorías de Gastos (Por Intención - TDAH Friendly)
  {
    id: 'cat-super',
    name: 'Súper y Casa',
    type: 'expense',
    icon: 'ShoppingCart',
    color: '#10B981', // Emerald
    description: 'Comida e insumos indispensables para el hogar',
    isSystem: true,
    sortOrder: 1,
  },
  {
    id: 'cat-delivery',
    name: 'Delivery y Salidas',
    type: 'expense',
    icon: 'UtensilsCrossed',
    color: '#F59E0B', // Amber
    description: 'Comodidad, restaurantes, antojos y vida social',
    isSystem: true,
    sortOrder: 2,
  },
  {
    id: 'cat-hija',
    name: 'Hija',
    type: 'expense',
    icon: 'Baby',
    color: '#EC4899', // Pink
    description: 'Gastos dedicados de tu hija con desglose rápido',
    subTags: ['Cuota', 'Niñera', 'Pañales/Farmacia', 'Colegio', 'Ropa/Extras'],
    isSystem: true,
    sortOrder: 3,
  },
  {
    id: 'cat-transporte',
    name: 'Movilidad',
    type: 'expense',
    icon: 'Car',
    color: '#3B82F6', // Blue
    description: 'Nafta, SUBE, peajes, Uber y mantenimiento',
    isSystem: true,
    sortOrder: 4,
  },
  {
    id: 'cat-hogar',
    name: 'Hogar y Servicios',
    type: 'expense',
    icon: 'Home',
    color: '#8B5CF6', // Purple
    description: 'Alquiler, expensas, luz, gas, internet y servicios',
    isSystem: true,
    sortOrder: 5,
  },
  {
    id: 'cat-gustos',
    name: 'Compras y Gustos',
    type: 'expense',
    icon: 'ShoppingBag',
    color: '#F97316', // Orange
    description: 'Ropa, tecnología, hobbies y compras no indispensables',
    isSystem: true,
    sortOrder: 6,
  },
  {
    id: 'cat-digital',
    name: 'Suscripciones',
    type: 'expense',
    icon: 'Smartphone',
    color: '#06B6D4', // Cyan
    description: 'Netflix, Spotify, iCloud, membresías recurrentes',
    isSystem: true,
    sortOrder: 7,
  },
  {
    id: 'cat-despues-veo',
    name: 'Después veo ⏳',
    type: 'expense',
    icon: 'Clock',
    color: '#64748B', // Slate
    description: 'Salvavidas anti-parálisis: guarda en 1s y clasifica luego',
    isSystem: true,
    sortOrder: 8,
  },

  // 4 Categorías de Ingresos
  {
    id: 'cat-sueldo',
    name: 'Sueldo / Honorarios',
    type: 'income',
    icon: 'Briefcase',
    color: '#10B981',
    description: 'Ingresos fijos principales',
    isSystem: true,
    sortOrder: 9,
  },
  {
    id: 'cat-freelance',
    name: 'Freelance / Ventas',
    type: 'income',
    icon: 'Laptop',
    color: '#3B82F6',
    description: 'Trabajos extra, consultoría o ventas',
    isSystem: true,
    sortOrder: 10,
  },
  {
    id: 'cat-rendimientos',
    name: 'Rendimientos / Inversiones',
    type: 'income',
    icon: 'TrendingUp',
    color: '#8B5CF6',
    description: 'Intereses, dividendos o plazos fijos',
    isSystem: true,
    sortOrder: 11,
  },
  {
    id: 'cat-otros-ingresos',
    name: 'Otros Ingresos',
    type: 'income',
    icon: 'Gift',
    color: '#F59E0B',
    description: 'Regalos, devoluciones o ingresos esporádicos',
    isSystem: true,
    sortOrder: 12,
  },
];

export class FocusBudgetDatabase extends Dexie {
  transactions!: Table<Transaction, string>;
  categories!: Table<Category, string>;
  commitments!: Table<Commitment, string>;
  reminders!: Table<Reminder, string>;
  exchangeRates!: Table<ExchangeRateCache, string>;

  constructor() {
    super('FocusBudgetDB');
    this.version(1).stores({
      transactions: 'id, date, type, categoryId, deletedAt, createdAt',
      categories: 'id, type, sortOrder',
      commitments: 'id, type, isCompleted, deletedAt',
      reminders: 'id, dueDate, status, deletedAt',
      exchangeRates: 'id, fetchedAt',
    });
  }
}

export const db = new FocusBudgetDatabase();

// Inicializador de categorías predeterminadas
export async function seedCategories(): Promise<void> {
  const count = await db.categories.count();
  if (count === 0) {
    await db.categories.bulkAdd(INITIAL_CATEGORIES);
  }
}
