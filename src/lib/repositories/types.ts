import type { Country, Place } from '@/types';

export type DataSourceMode = 'json' | 'db' | 'hybrid';

export interface DataRepository {
  getCountries(): Promise<Country[]>;
  getCountryById(id: string): Promise<Country | undefined>;
  getPlaceById(id: string): Promise<Place | undefined>;
  getPlacesByCountry(countryId: string): Promise<Place[]>;
  getPlacesByType(type: Place['type']): Promise<Place[]>;
  getPlacesByCountryAndType(countryId: string, type: Place['type']): Promise<Place[]>;
  getAllPlaces(): Promise<Place[]>;
  getPlaceCountByCountry(countryId: string): Promise<number>;
}
