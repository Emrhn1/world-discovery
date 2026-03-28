import type { Country, Place, PlaceType } from '@/types';

const API_BASE = '/api';
const LIST_TTL_MS = 60_000;
const DETAIL_TTL_MS = 5 * 60_000;
const COUNTRY_TTL_MS = 5 * 60_000;

type CacheEntry = {
  expiresAt: number;
  value: unknown;
};

type FetchJsonOptions = {
  ttlMs?: number;
  forceRefresh?: boolean;
};

type ListResponse<T> = {
  items: T[];
  total: number;
};

type PlaceCountsResponse = {
  countryId: string;
  counts: Record<PlaceType, number>;
  total: number;
};

export type PlaceCountsByType = Record<PlaceType, number>;

const responseCache = new Map<string, CacheEntry>();
const inflightRequests = new Map<string, Promise<unknown>>();

function withQuery(url: string, params: Record<string, string | undefined>): string {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, value);
    }
  });

  const qs = query.toString();
  return qs ? `${url}?${qs}` : url;
}

function getCached<T>(cacheKey: string): T | undefined {
  const entry = responseCache.get(cacheKey);
  if (!entry) return undefined;

  if (entry.expiresAt <= Date.now()) {
    responseCache.delete(cacheKey);
    return undefined;
  }

  return entry.value as T;
}

function setCached(cacheKey: string, value: unknown, ttlMs: number): void {
  responseCache.set(cacheKey, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}

async function fetchJson<T>(url: string, options: FetchJsonOptions = {}): Promise<T> {
  const ttlMs = options.ttlMs ?? LIST_TTL_MS;
  const forceRefresh = options.forceRefresh ?? false;
  const cacheKey = url;

  if (!forceRefresh) {
    const cached = getCached<T>(cacheKey);
    if (cached !== undefined) return cached;

    const inflight = inflightRequests.get(cacheKey);
    if (inflight) return inflight as Promise<T>;
  }

  const request = fetch(url, { method: 'GET' })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Request failed (${response.status}) for ${url}`);
      }

      const data = (await response.json()) as T;
      setCached(cacheKey, data, ttlMs);
      return data;
    })
    .finally(() => {
      inflightRequests.delete(cacheKey);
    });

  inflightRequests.set(cacheKey, request as Promise<unknown>);
  return request;
}

export function clearDataAsyncCache(): void {
  responseCache.clear();
  inflightRequests.clear();
}

export async function getCountriesAsync(): Promise<Country[]> {
  const data = await fetchJson<ListResponse<Country>>(`${API_BASE}/countries`, {
    ttlMs: COUNTRY_TTL_MS,
  });
  return data.items;
}

export async function getCountryByIdAsync(id: string): Promise<Country | undefined> {
  if (!id) return undefined;

  try {
    return await fetchJson<Country>(`${API_BASE}/countries/${encodeURIComponent(id)}`, {
      ttlMs: COUNTRY_TTL_MS,
    });
  } catch {
    const countries = await getCountriesAsync();
    return countries.find((country) => country.id === id);
  }
}

export async function getPlaceByIdAsync(id: string): Promise<Place | undefined> {
  if (!id) return undefined;

  try {
    return await fetchJson<Place>(`${API_BASE}/places/${encodeURIComponent(id)}`, {
      ttlMs: DETAIL_TTL_MS,
    });
  } catch {
    return undefined;
  }
}

export function prefetchPlaceByIdAsync(id: string): void {
  if (!id) return;
  void getPlaceByIdAsync(id);
}

export async function getPlacesByCountryAsync(countryId: string): Promise<Place[]> {
  const url = withQuery(`${API_BASE}/places`, {
    countryId,
    view: 'summary',
  });
  const data = await fetchJson<ListResponse<Place>>(url, { ttlMs: LIST_TTL_MS });
  return data.items;
}

export async function getPlacesByTypeAsync(type: Place['type']): Promise<Place[]> {
  const url = withQuery(`${API_BASE}/places`, {
    type,
    view: 'summary',
  });
  const data = await fetchJson<ListResponse<Place>>(url, { ttlMs: LIST_TTL_MS });
  return data.items;
}

export async function getPlacesByCountryAndTypeAsync(
  countryId: string,
  type: Place['type']
): Promise<Place[]> {
  const url = withQuery(`${API_BASE}/places`, {
    countryId,
    type,
    view: 'summary',
  });
  const data = await fetchJson<ListResponse<Place>>(url, { ttlMs: LIST_TTL_MS });
  return data.items;
}

export async function getAllPlacesAsync(): Promise<Place[]> {
  const url = withQuery(`${API_BASE}/places`, { view: 'summary' });
  const data = await fetchJson<ListResponse<Place>>(url, { ttlMs: LIST_TTL_MS });
  return data.items;
}

export async function getPlaceCountsByCountryAsync(countryId: string): Promise<PlaceCountsByType> {
  if (!countryId) {
    return { historical: 0, nature: 0, city: 0 };
  }

  const url = withQuery(`${API_BASE}/places/counts`, { countryId });

  try {
    const data = await fetchJson<PlaceCountsResponse>(url, { ttlMs: LIST_TTL_MS });
    return {
      historical: data.counts.historical ?? 0,
      nature: data.counts.nature ?? 0,
      city: data.counts.city ?? 0,
    };
  } catch {
    const places = await getPlacesByCountryAsync(countryId);
    return places.reduce<PlaceCountsByType>(
      (acc, place) => {
        acc[place.type] += 1;
        return acc;
      },
      { historical: 0, nature: 0, city: 0 }
    );
  }
}

export async function getPlaceCountByCountryAsync(countryId: string): Promise<number> {
  const counts = await getPlaceCountsByCountryAsync(countryId);
  return counts.historical + counts.nature + counts.city;
}
