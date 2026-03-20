import type { Country, Place } from '@/types';
import type { DataRepository } from './types';

import TR from '../../../data/countries/TR.json';
import JP from '../../../data/countries/JP.json';
import IT from '../../../data/countries/IT.json';
import EG from '../../../data/countries/EG.json';
import PE from '../../../data/countries/PE.json';

import topkapi from '../../../data/places/topkapi.json';
import hagiaSophia from '../../../data/places/hagia-sophia.json';
import cappadocia from '../../../data/places/cappadocia.json';
import fushimiInari from '../../../data/places/fushimi-inari.json';
import mountFuji from '../../../data/places/mount-fuji.json';
import colosseum from '../../../data/places/colosseum.json';
import gizaPyramids from '../../../data/places/giza-pyramids.json';
import machuPicchu from '../../../data/places/machu-picchu.json';

const countriesMap: Record<string, Country> = {
  TR: TR as Country,
  JP: JP as Country,
  IT: IT as Country,
  EG: EG as Country,
  PE: PE as Country,
};

const placesMap: Record<string, Place> = {
  topkapi: topkapi as Place,
  'hagia-sophia': hagiaSophia as Place,
  cappadocia: cappadocia as Place,
  'fushimi-inari': fushimiInari as Place,
  'mount-fuji': mountFuji as Place,
  colosseum: colosseum as Place,
  'giza-pyramids': gizaPyramids as Place,
  'machu-picchu': machuPicchu as Place,
};

export const jsonRepository: DataRepository = {
  async getCountries() {
    return Object.values(countriesMap);
  },

  async getCountryById(id: string) {
    return countriesMap[id];
  },

  async getPlaceById(id: string) {
    return placesMap[id];
  },

  async getPlacesByCountry(countryId: string) {
    const country = countriesMap[countryId];
    if (!country) return [];

    return country.places
      .map((placeId) => placesMap[placeId])
      .filter((place): place is Place => place !== undefined);
  },

  async getPlacesByType(type: Place['type']) {
    return Object.values(placesMap).filter((place) => place.type === type);
  },

  async getPlacesByCountryAndType(countryId: string, type: Place['type']) {
    const places = await this.getPlacesByCountry(countryId);
    return places.filter((place) => place.type === type);
  },

  async getAllPlaces() {
    return Object.values(placesMap);
  },

  async getPlaceCountByCountry(countryId: string) {
    const country = countriesMap[countryId];
    return country?.places.length ?? 0;
  },
};
