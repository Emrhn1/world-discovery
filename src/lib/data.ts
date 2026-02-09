import type { Country, Place } from '@/types';

// Import all country data
import TR from '../../data/countries/TR.json';
import JP from '../../data/countries/JP.json';
import IT from '../../data/countries/IT.json';
import EG from '../../data/countries/EG.json';
import PE from '../../data/countries/PE.json';

// Import all place data
import topkapi from '../../data/places/topkapi.json';
import hagiaSophia from '../../data/places/hagia-sophia.json';
import cappadocia from '../../data/places/cappadocia.json';
import fushimiInari from '../../data/places/fushimi-inari.json';
import mountFuji from '../../data/places/mount-fuji.json';
import colosseum from '../../data/places/colosseum.json';
import gizaPyramids from '../../data/places/giza-pyramids.json';
import machuPicchu from '../../data/places/machu-picchu.json';

// Countries map for quick lookup
const countriesMap: Record<string, Country> = {
    TR: TR as Country,
    JP: JP as Country,
    IT: IT as Country,
    EG: EG as Country,
    PE: PE as Country,
};

// Places map for quick lookup
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

/**
 * Get all countries
 */
export function getCountries(): Country[] {
    return Object.values(countriesMap);
}

/**
 * Get a country by its ID
 */
export function getCountryById(id: string): Country | undefined {
    return countriesMap[id];
}

/**
 * Get a place by its ID
 */
export function getPlaceById(id: string): Place | undefined {
    return placesMap[id];
}

/**
 * Get all places for a specific country
 */
export function getPlacesByCountry(countryId: string): Place[] {
    const country = countriesMap[countryId];
    if (!country) return [];

    return country.places
        .map(placeId => placesMap[placeId])
        .filter((place): place is Place => place !== undefined);
}

/**
 * Get all places of a specific type
 */
export function getPlacesByType(type: Place['type']): Place[] {
    return Object.values(placesMap).filter(place => place.type === type);
}

/**
 * Get places by country and type
 */
export function getPlacesByCountryAndType(countryId: string, type: Place['type']): Place[] {
    return getPlacesByCountry(countryId).filter(place => place.type === type);
}

/**
 * Get all places
 */
export function getAllPlaces(): Place[] {
    return Object.values(placesMap);
}

/**
 * Get place count by country
 */
export function getPlaceCountByCountry(countryId: string): number {
    const country = countriesMap[countryId];
    return country?.places.length ?? 0;
}
