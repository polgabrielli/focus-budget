import { db } from '../db/db';
import { type ExchangeRateCache, type UsdRateType } from '../types';

const DOLAR_API_ALL_URL = 'https://dolarapi.com/v1/dolares';
const DEFAULT_FALLBACK_RATE: ExchangeRateCache = {
  id: 'USD',
  currency: 'USD',
  compra: 1350,
  venta: 1400,
  source: 'fallback',
  fetchedAt: new Date().toISOString(),
  oficial: { compra: 1350, venta: 1400, nombre: 'Oficial' },
  mep: { compra: 1380, venta: 1420, nombre: 'Bolsa' },
  blue: { compra: 1390, venta: 1430, nombre: 'Blue' },
  activeRateType: 'mep',
};

export async function fetchExchangeRate(): Promise<ExchangeRateCache> {
  try {
    const res = await fetch(DOLAR_API_ALL_URL, { cache: 'no-cache' });
    if (!res.ok) {
      throw new Error(`Dolar API responded with ${res.status}`);
    }
    const data = await res.json();

    let oficialItem: any = null;
    let mepItem: any = null;
    let blueItem: any = null;

    if (Array.isArray(data)) {
      oficialItem = data.find((d: any) => d.casa === 'oficial');
      mepItem = data.find((d: any) => d.casa === 'bolsa' || d.casa === 'mep');
      blueItem = data.find((d: any) => d.casa === 'blue');
    } else if (data && typeof data === 'object') {
      if (data.casa === 'bolsa' || data.casa === 'mep') {
        mepItem = data;
      } else {
        oficialItem = data;
      }
    }

    const ventaValue = Number(mepItem?.venta || oficialItem?.venta || data?.venta) || 1400;
    const compraValue = Number(mepItem?.compra || oficialItem?.compra || data?.compra) || 1350;

    const rateData: ExchangeRateCache = {
      id: 'USD',
      currency: 'USD',
      compra: compraValue,
      venta: ventaValue,
      source: 'dolarapi.com',
      fetchedAt: new Date().toISOString(),
      oficial: oficialItem
        ? {
            compra: Number(oficialItem.compra) || 1350,
            venta: Number(oficialItem.venta) || 1400,
            nombre: oficialItem.nombre || 'Oficial',
            fechaActualizacion: oficialItem.fechaActualizacion,
          }
        : undefined,
      mep: mepItem
        ? {
            compra: Number(mepItem.compra) || 1380,
            venta: Number(mepItem.venta) || 1420,
            nombre: mepItem.nombre || 'Bolsa',
            fechaActualizacion: mepItem.fechaActualizacion,
          }
        : undefined,
      blue: blueItem
        ? {
            compra: Number(blueItem.compra) || 1390,
            venta: Number(blueItem.venta) || 1430,
            nombre: blueItem.nombre || 'Blue',
            fechaActualizacion: blueItem.fechaActualizacion,
          }
        : undefined,
      activeRateType: 'mep',
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

export function getEffectiveRate(
  rateCache: ExchangeRateCache | null,
  rateType: UsdRateType = 'mep'
): number {
  if (!rateCache) return 1400;
  if (rateType === 'oficial' && rateCache.oficial?.venta) {
    return rateCache.oficial.venta;
  }
  if (rateType === 'mep' && rateCache.mep?.venta) {
    return rateCache.mep.venta;
  }
  if (rateType === 'blue' && rateCache.blue?.venta) {
    return rateCache.blue.venta;
  }
  return rateCache.venta || 1400;
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
