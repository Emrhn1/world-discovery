import type { Country, Place } from '@/types';

const API_BASE = '/api';

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });

  if (!response.ok) {
    const message = `Request failed (${response.status}) for ${url}`;
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

type ListResponse<T> = {
  items: T[];
  total: number;
};

export async function getCountriesAsync(): Promise<Country[]> {
  const data = await fetchJson<ListResponse<Country>>(`${API_BASE}/countries`);
  return data.items;
}

export async function getCountryByIdAsync(id: string): Promise<Country | undefined> {
  const countries = await getCountriesAsync();
  return countries.find((c) => c.id === id);
}

export async function getPlaceByIdAsync(id: string): Promise<Place | undefined> {
  try {
    return await fetchJson<Place>(`${API_BASE}/places/${encodeURIComponent(id)}`);
  } catch {
    return undefined;
  }
}

export async function getPlacesByCountryAsync(countryId: string): Promise<Place[]> {
  const data = await fetchJson<ListResponse<Place>>(
    `${API_BASE}/places?countryId=${encodeURIComponent(countryId)}`
  );
  return data.items;
}

export async function getPlacesByTypeAsync(type: Place['type']): Promise<Place[]> {
  const data = await fetchJson<ListResponse<Place>>(
    `${API_BASE}/places?type=${encodeURIComponent(type)}`
  );
  return data.items;
}

export async function getPlacesByCountryAndTypeAsync(
  countryId: string,
  type: Place['type']
): Promise<Place[]> {
  const data = await fetchJson<ListResponse<Place>>(
    `${API_BASE}/places?countryId=${encodeURIComponent(countryId)}&type=${encodeURIComponent(type)}`
  );
  return data.items;
}

export async function getAllPlacesAsync(): Promise<Place[]> {
  const data = await fetchJson<ListResponse<Place>>(`${API_BASE}/places`);
  return data.items;
}

export async function getPlaceCountByCountryAsync(countryId: string): Promise<number> {
  const data = await fetchJson<ListResponse<Place>>(
    `${API_BASE}/places?countryId=${encodeURIComponent(countryId)}`
  );
  return data.total;
}
