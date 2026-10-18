import Dexie, { type Table } from 'dexie';
import { 
  type Transaction, 
  type Category, 
  type Commitment, 
  type Reminder, 
  type ExchangeRateCache 
} from '../types';

export const INITIAL_CATEGORIES: Category[] = [
  // 8 Categorías de Gastos (Grilla 4x2 - Ergonomía Cognitiva + Escalable para App Store)
  {
    id: 'cat-super',
    name: 'Súper y Almacén',
    type: 'expense',
    icon: 'ShoppingCart',
    color: '#10B981', // Emerald
    description: 'Supermercado, verdulería, carnicería e insumos diarios',
    subTags: ['Supermercado', 'Verdulería', 'Carnicería', 'Limpieza', 'Kiosco'],
    isSystem: true,
    sortOrder: 1,
  },
  {
    id: 'cat-delivery',
    name: 'Comida y Salidas',
    type: 'expense',
    icon: 'UtensilsCrossed',
    color: '#F59E0B', // Amber
    description: 'Delivery, restaurantes, cafés y vida social',
    subTags: ['Delivery', 'Restaurante', 'Café/Merienda', 'Bar/Salidas', 'Almuerzo'],
    isSystem: true,
    sortOrder: 2,
  },
  {
    id: 'cat-hija',
    name: 'Hija',
    type: 'expense',
    icon: 'Baby',
    color: '#EC4899', // Pink
    description: 'Gastos dedicados de hija / familia / personas a cargo',
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
    subTags: ['Nafta', 'Uber/Cabify', 'SUBE/Público', 'Peaje/Estac.', 'Taller/Seguro'],
    isSystem: true,
    sortOrder: 4,
  },
  {
    id: 'cat-hogar',
    name: 'Hogar y Fijos',
    type: 'expense',
    icon: 'Home',
    color: '#8B5CF6', // Purple
    description: 'Alquiler, expensas, luz, internet, suscripciones e impuestos',
    subTags: [
      'Alquiler/Expensas',
      'Luz/Gas/Agua',
      'Internet/Celular',
      'Suscripciones',
      'Monotributo/Impuestos',
    ],
    isSystem: true,
    sortOrder: 5,
  },
  {
    id: 'cat-digital',
    name: 'Salud y Bienestar',
    type: 'expense',
    icon: 'HeartPulse',
    color: '#06B6D4', // Cyan
    description: 'Farmacia, médicos, terapia, prepaga y deporte',
    subTags: ['Farmacia', 'Médico/Estudios', 'Terapia', 'Prepaga', 'Gym/Deporte'],
    isSystem: true,
    sortOrder: 6,
  },
  {
    id: 'cat-gustos',
    name: 'Compras y Gustos',
    type: 'expense',
    icon: 'ShoppingBag',
    color: '#F97316', // Orange
    description: 'Ropa, tecnología, regalos, deco y hobbies',
    subTags: ['Ropa', 'Tecnología', 'Regalos', 'Deco/Hogar', 'Hobbies'],
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
    subTags: ['Sueldo', 'Honorarios', 'Aguinaldo', 'Bono'],
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
    subTags: ['Cliente', 'Proyecto', 'Consultoría', 'Venta'],
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
    subTags: ['MEP/Inversión', 'FCI/Billetera', 'Intereses', 'Dividendos'],
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
    subTags: ['Reintegro', 'Regalo', 'Transferencia', 'Devolución'],
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
      transactions: 'id, date, type, categoryId, commitmentId, deletedAt, createdAt',
      categories: 'id, type, sortOrder',
      commitments: 'id, type, isCompleted, deletedAt',
      reminders: 'id, title, dueDate, status, deletedAt',
      exchangeRates: 'id, fetchedAt',
    });
  }
}

export const db = new FocusBudgetDatabase();

const LEGACY_CATEGORY_NAMES: Record<string, string> = {
  'cat-super': 'Súper y Casa',
  'cat-delivery': 'Delivery y Salidas',
  'cat-hogar': 'Hogar y Servicios',
  'cat-digital': 'Suscripciones',
};

// Inicializador y migrador inteligente de categorías predeterminadas
export async function seedCategories(): Promise<void> {
  const count = await db.categories.count();
  if (count === 0) {
    await db.categories.bulkAdd(INITIAL_CATEGORIES);
    return;
  }

  // Migración suave para bases de datos existentes:
  // actualiza nombres heredados v1 e inyecta chips iniciales sin pisar ediciones del usuario.
  for (const defCat of INITIAL_CATEGORIES) {
    const existing = await db.categories.get(defCat.id);
    if (!existing) {
      await db.categories.add(defCat);
      continue;
    }

    const isLegacyName =
      LEGACY_CATEGORY_NAMES[defCat.id] && existing.name === LEGACY_CATEGORY_NAMES[defCat.id];
    const needsSubTags =
      defCat.subTags &&
      defCat.subTags.length > 0 &&
      (!existing.subTags || existing.subTags.length === 0);

    if (isLegacyName || needsSubTags || existing.sortOrder !== defCat.sortOrder) {
      await db.categories.update(defCat.id, {
        name: isLegacyName ? defCat.name : existing.name,
        icon: isLegacyName ? defCat.icon : existing.icon,
        description: isLegacyName ? defCat.description : existing.description,
        subTags:
          isLegacyName || needsSubTags
            ? defCat.subTags
            : existing.subTags,
        sortOrder: defCat.sortOrder,
      });
    }
  }
}

