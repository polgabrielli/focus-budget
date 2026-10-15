import { describe, it, expect, beforeEach } from 'vitest';
import { db, seedCategories, INITIAL_CATEGORIES } from '../db';
import { type Transaction } from '../../types';

describe('Dexie Database & Seeding', () => {
  beforeEach(async () => {
    await db.transactions.clear();
    await db.categories.clear();
  });

  describe('seedCategories', () => {
    it('seeds exactly 12 categories on first run', async () => {
      expect(await db.categories.count()).toBe(0);
      await seedCategories();
      expect(await db.categories.count()).toBe(12);
    });

    it('contains all 8 intent-based expense categories', async () => {
      await seedCategories();
      const expenseCats = await db.categories.where('type').equals('expense').toArray();
      expect(expenseCats).toHaveLength(8);

      const catIds = expenseCats.map((c) => c.id);
      expect(catIds).toContain('cat-super');
      expect(catIds).toContain('cat-delivery');
      expect(catIds).toContain('cat-hija');
      expect(catIds).toContain('cat-transporte');
      expect(catIds).toContain('cat-hogar');
      expect(catIds).toContain('cat-gustos');
      expect(catIds).toContain('cat-digital');
      expect(catIds).toContain('cat-despues-veo');
    });

    it('verifies cat-hija has the required sub-tags', async () => {
      await seedCategories();
      const hijaCat = await db.categories.get('cat-hija');
      expect(hijaCat).toBeDefined();
      expect(hijaCat?.subTags).toEqual([
        'Cuota',
        'Niñera',
        'Pañales/Farmacia',
        'Colegio',
        'Ropa/Extras',
      ]);
    });

    it('verifies cat-despues-veo exists as an anti-paralysis category', async () => {
      await seedCategories();
      const despuesVeo = await db.categories.get('cat-despues-veo');
      expect(despuesVeo).toBeDefined();
      expect(despuesVeo?.isSystem).toBe(true);
    });

    it('contains all 4 income categories', async () => {
      await seedCategories();
      const incomeCats = await db.categories.where('type').equals('income').toArray();
      expect(incomeCats).toHaveLength(4);

      const catIds = incomeCats.map((c) => c.id);
      expect(catIds).toContain('cat-sueldo');
      expect(catIds).toContain('cat-freelance');
      expect(catIds).toContain('cat-rendimientos');
      expect(catIds).toContain('cat-otros-ingresos');
    });

    it('is idempotent and does not duplicate categories on multiple calls', async () => {
      await seedCategories();
      await seedCategories();
      expect(await db.categories.count()).toBe(INITIAL_CATEGORIES.length);
    });
  });

  describe('Transaction operations in IndexedDB', () => {
    it('stores a transaction with UUID, amount, and date', async () => {
      const tx: Transaction = {
        id: crypto.randomUUID(),
        amount: 4500.5,
        type: 'expense',
        categoryId: 'cat-super',
        currency: 'ARS',
        exchangeRate: 1400,
        date: '2026-10-15',
        note: 'Supermercado Coto',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      };

      await db.transactions.add(tx);
      const saved = await db.transactions.get(tx.id);

      expect(saved).toBeDefined();
      expect(saved?.amount).toBe(4500.5);
      expect(saved?.note).toBe('Supermercado Coto');
      expect(saved?.deletedAt).toBeNull();
    });

    it('supports soft-delete (deletedAt flag)', async () => {
      const txId = crypto.randomUUID();
      const tx: Transaction = {
        id: txId,
        amount: 1500,
        type: 'expense',
        categoryId: 'cat-transporte',
        currency: 'ARS',
        exchangeRate: 1400,
        date: '2026-10-15',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      };

      await db.transactions.add(tx);

      // Perform soft delete
      const deletedTime = new Date().toISOString();
      await db.transactions.update(txId, { deletedAt: deletedTime });

      const updated = await db.transactions.get(txId);
      expect(updated?.deletedAt).toBe(deletedTime);

      // Verify active queries exclude soft-deleted items
      const active = await db.transactions.filter((t) => !t.deletedAt).toArray();
      expect(active).toHaveLength(0);
    });
  });
});
