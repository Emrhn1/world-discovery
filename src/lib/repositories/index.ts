import { dbRepository } from './dbRepository';
import { jsonRepository } from './jsonRepository';
import type { DataRepository, DataSourceMode } from './types';

function getMode(): DataSourceMode {
  const raw = (process.env.DATA_SOURCE ?? 'json').toLowerCase();
  if (raw === 'db' || raw === 'hybrid' || raw === 'json') return raw;
  return 'json';
}

export function getRepository(): DataRepository {
  const mode = getMode();

  if (mode === 'db') return dbRepository;
  if (mode === 'json') return jsonRepository;

  // hybrid: use DB primary, JSON fallback
  return {
    async getCountries() {
      try { return await dbRepository.getCountries(); } catch { return jsonRepository.getCountries(); }
    },
    async getCountryById(id: string) {
      try {
        const country = await dbRepository.getCountryById(id);
        if (country) return country;
      } catch {}
      return jsonRepository.getCountryById(id);
    },
    async getPlaceById(id: string) {
      try {
        const place = await dbRepository.getPlaceById(id);
        if (place) return place;
      } catch {}
      return jsonRepository.getPlaceById(id);
    },
    async getPlacesByCountry(countryId: string) {
      try {
        const places = await dbRepository.getPlacesByCountry(countryId);
        if (places.length > 0) return places;
      } catch {}
      return jsonRepository.getPlacesByCountry(countryId);
    },
    async getPlacesByType(type) {
      try {
        const places = await dbRepository.getPlacesByType(type);
        if (places.length > 0) return places;
      } catch {}
      return jsonRepository.getPlacesByType(type);
    },
    async getPlacesByCountryAndType(countryId, type) {
      try {
        const places = await dbRepository.getPlacesByCountryAndType(countryId, type);
        if (places.length > 0) return places;
      } catch {}
      return jsonRepository.getPlacesByCountryAndType(countryId, type);
    },
    async getAllPlaces() {
      try {
        const places = await dbRepository.getAllPlaces();
        if (places.length > 0) return places;
      } catch {}
      return jsonRepository.getAllPlaces();
    },
    async getPlaceCountByCountry(countryId: string) {
      try {
        const count = await dbRepository.getPlaceCountByCountry(countryId);
        if (count > 0) return count;
      } catch {}
      return jsonRepository.getPlaceCountByCountry(countryId);
    },
  };
}
