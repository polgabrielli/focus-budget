import { db } from '../db/db';
import { type ExchangeRateCache } from '../types';

const DOLAR_API_URL = 'https://dolarapi.com/v1/dolares/oficial';
const DEFAULT_FALLBACK_RATE: ExchangeRateCache = {
  id: 'USD',
  currency: 'USD',
  compra: 1350,
  venta: 1400,
  source: 'fallback',
  fetchedAt: new Date().toISOString(),
};

export async function fetchExchangeRate(): Promise<ExchangeRateCache> {
  try {
    const res = await fetch(DOLAR_API_URL, { cache: 'no-cache' });
    if (!res.ok) {
      throw new Error(`Dolar API responded with ${res.status}`);
    }
    const data = await res.json();
    
    const rateData: ExchangeRateCache = {
      id: 'USD',
      currency: 'USD',
      compra: Number(data.compra) || 1350,
      venta: Number(data.venta) || 1400,
      source: 'dolarapi.com',
      fetchedAt: new Date().toISOString(),
    };

    // Cache in IndexedDB for 100% offline access
    await db.exchangeRates.put(rateData);
    return rateData;
  } catch (error) {
    console.warn('FocusBudget: Error al consultar Dolar API (Modo Offline activo)', error);
    // Try to get from IndexedDB cache
    const cached = await db.exchangeRates.get('USD');
    if (cached) {
      return cached;
    }
    return DEFAULT_FALLBACK_RATE;
  }
}

export function convertAmount(
  amount: number,
  from: 'ARS' | 'USD',
  to: 'ARS' | 'USD',
  rate: number
): number {
  if (from === to) return amount;
  if (from === 'USD' && to === 'ARS') {
    return amount * rate;
  }
  if (from === 'ARS' && to === 'USD') {
    return rate > 0 ? amount / rate : 0;
  }
  return amount;
}
