import { describe, it, expect, beforeEach, vi } from 'vitest';
import { convertAmount, fetchExchangeRate } from '../currencyService';
import { db } from '../../db/db';

describe('currencyService', () => {
  beforeEach(async () => {
    await db.exchangeRates.clear();
    vi.restoreAllMocks();
  });

  describe('convertAmount', () => {
    it('returns exact amount when from and to currencies are identical', () => {
      expect(convertAmount(100, 'ARS', 'ARS', 1400)).toBe(100);
      expect(convertAmount(50, 'USD', 'USD', 1400)).toBe(50);
    });

    it('converts USD to ARS correctly using provided rate', () => {
      expect(convertAmount(10, 'USD', 'ARS', 1400)).toBe(14000);
      expect(convertAmount(2.5, 'USD', 'ARS', 1000)).toBe(2500);
    });

    it('converts ARS to USD correctly using provided rate', () => {
      expect(convertAmount(14000, 'ARS', 'USD', 1400)).toBe(10);
      expect(convertAmount(2800, 'ARS', 'USD', 1400)).toBe(2);
    });

    it('handles zero or negative rate without crashing', () => {
      expect(convertAmount(1000, 'ARS', 'USD', 0)).toBe(0);
    });
  });

  describe('fetchExchangeRate', () => {
    it('fetches from API, updates IndexedDB cache, and returns parsed rate', async () => {
      const mockApiResponse = {
        compra: 1380,
        venta: 1420,
        moneda: 'USD',
        casa: 'oficial',
        nombre: 'Oficial',
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const result = await fetchExchangeRate();

      expect(result.venta).toBe(1420);
      expect(result.compra).toBe(1380);

      // Verify it was cached in IndexedDB
      const cached = await db.exchangeRates.get('USD');
      expect(cached).toBeDefined();
      expect(cached?.venta).toBe(1420);
      expect(cached?.source).toBe('dolarapi.com');
    });

    it('falls back to cached IndexedDB rate if API fails (Offline Mode)', async () => {
      // Seed cache in IndexedDB
      await db.exchangeRates.put({
        id: 'USD',
        currency: 'USD',
        compra: 1300,
        venta: 1350,
        source: 'cached-test',
        fetchedAt: '2026-10-14T10:00:00.000Z',
      });

      // API fetch throws network error
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error: Offline'));

      const result = await fetchExchangeRate();

      expect(result.venta).toBe(1350);
      expect(result.source).toBe('cached-test');
    });

    it('falls back to default fallback rate if API fails and no cache exists', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error: Offline'));

      const result = await fetchExchangeRate();

      expect(result.venta).toBe(1400);
      expect(result.source).toBe('fallback');
    });
  });
});
