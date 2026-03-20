import type { Country, Place } from '@/types';
import { getRepository } from './repositories';

export async function getCountriesAsync(): Promise<Country[]> {
  return getRepository().getCountries();
}

export async function getCountryByIdAsync(id: string): Promise<Country | undefined> {
  return getRepository().getCountryById(id);
}

export async function getPlaceByIdAsync(id: string): Promise<Place | undefined> {
  return getRepository().getPlaceById(id);
}

export async function getPlacesByCountryAsync(countryId: string): Promise<Place[]> {
  return getRepository().getPlacesByCountry(countryId);
}

export async function getPlacesByTypeAsync(type: Place['type']): Promise<Place[]> {
  return getRepository().getPlacesByType(type);
}

export async function getPlacesByCountryAndTypeAsync(countryId: string, type: Place['type']): Promise<Place[]> {
  return getRepository().getPlacesByCountryAndType(countryId, type);
}

export async function getAllPlacesAsync(): Promise<Place[]> {
  return getRepository().getAllPlaces();
}

export async function getPlaceCountByCountryAsync(countryId: string): Promise<number> {
  return getRepository().getPlaceCountByCountry(countryId);
}
