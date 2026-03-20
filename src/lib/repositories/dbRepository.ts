import type { Country, DiscoveryType, HiddenTrigger, Place, PlaceType, Scene, SceneHotspot, TimelinePhoto, Zone } from '@/types';
import { prisma } from '@/lib/db/prisma';
import type { DataRepository } from './types';

const mapPlaceType = (type: string): PlaceType => {
  if (type === 'nature' || type === 'city' || type === 'historical') return type;
  return 'historical';
};

const mapDiscoveryType = (type?: string | null): DiscoveryType => {
  switch (type) {
    case 'engineering_mystery': return 'engineering-mystery';
    case 'cultural_shift': return 'cultural-shift';
    case 'turning_point': return 'turning-point';
    case 'hidden_detail': return 'hidden-detail';
    case 'historical_insight':
    default:
      return 'historical-insight';
  }
};

const mapHiddenTrigger = (trigger?: string | null): HiddenTrigger | undefined => {
  switch (trigger) {
    case 'long_hover': return 'long-hover';
    case 'double_click': return 'double-click';
    case 'chain': return 'chain';
    default: return undefined;
  }
};

function mapScene(scene: any): Scene {
  const hotspots: SceneHotspot[] = (scene.hotspots ?? [])
    .sort((a: any, b: any) => a.displayOrder - b.displayOrder)
    .map((h: any) => ({
      id: h.id,
      position: { top: h.positionTop, left: h.positionLeft },
      icon: h.icon,
      title: h.title,
      description: h.description,
      type: h.type ? mapDiscoveryType(h.type) : undefined,
    }));

  return {
    id: scene.id,
    title: scene.title,
    description: scene.description ?? undefined,
    src: scene.src,
    alt: scene.alt ?? undefined,
    hotspots,
    mediaType: scene.mediaType,
  };
}

function mapPlace(place: any): Place {
  const discoveries = (place.discoveries ?? [])
    .sort((a: any, b: any) => a.displayOrder - b.displayOrder)
    .map((d: any) => ({
      hook: d.hook,
      story: d.story,
      type: mapDiscoveryType(d.type),
      isHero: d.isHero,
      isHidden: d.isHidden,
      hiddenTrigger: mapHiddenTrigger(d.hiddenTrigger),
      chainRequires: d.chainRequires ?? [],
      position: d.positionTop && d.positionLeft ? { top: d.positionTop, left: d.positionLeft } : undefined,
    }));

  const scenes: Scene[] = (place.scenes ?? [])
    .sort((a: any, b: any) => a.displayOrder - b.displayOrder)
    .map(mapScene);

  const timelinePhotos: TimelinePhoto[] = (place.timelinePhotos ?? [])
    .sort((a: any, b: any) => a.chronologicalOrder - b.chronologicalOrder)
    .map((t: any) => ({
      era: t.era,
      year: t.year,
      src: t.src,
      description: t.description,
    }));

  const zones: Zone[] = (place.zones ?? [])
    .sort((a: any, b: any) => a.displayOrder - b.displayOrder)
    .map((z: any) => ({
      name: z.name,
      coords: (z.coordsJson as [number, number][]),
      color: z.color ?? undefined,
      description: z.description ?? undefined,
    }));

  return {
    id: place.id,
    name: place.name,
    countryId: place.countryId,
    coords: [place.latitude, place.longitude],
    type: mapPlaceType(place.type),
    teaser: place.teaser,
    shortStory: place.shortStory,
    bullets: place.bullets ?? [],
    discoveries,
    scenes,
    timelinePhotos,
    zones,
    media: (place.media ?? []).sort((a: any, b: any) => a.displayOrder - b.displayOrder).map((m: any) => ({
      type: m.type,
      src: m.src,
      alt: m.alt ?? undefined,
    })),
    ambience: place.ambience ?? undefined,
  };
}

export const dbRepository: DataRepository = {
  async getCountries() {
    const [countries, places] = await Promise.all([
      prisma.country.findMany({ orderBy: { name: 'asc' } }),
      prisma.place.findMany({ select: { id: true, countryId: true } }),
    ]);

    const placeMap = places.reduce<Record<string, string[]>>((acc, p) => {
      if (!acc[p.countryId]) acc[p.countryId] = [];
      acc[p.countryId].push(p.id);
      return acc;
    }, {});

    return countries.map<Country>((c) => ({
      id: c.id,
      name: c.name,
      coords: [c.latitude, c.longitude],
      teaser: c.teaser,
      ambience: c.ambience,
      places: placeMap[c.id] ?? [],
      flag: c.flag ?? undefined,
      dramaticIntro: c.dramaticIntro,
    }));
  },

  async getCountryById(id: string) {
    const [country, places] = await Promise.all([
      prisma.country.findUnique({ where: { id } }),
      prisma.place.findMany({ where: { countryId: id }, select: { id: true } }),
    ]);

    if (!country) return undefined;

    return {
      id: country.id,
      name: country.name,
      coords: [country.latitude, country.longitude],
      teaser: country.teaser,
      ambience: country.ambience,
      places: places.map((p) => p.id),
      flag: country.flag ?? undefined,
      dramaticIntro: country.dramaticIntro,
    };
  },

  async getPlaceById(id: string) {
    const place = await prisma.place.findUnique({
      where: { id },
      include: {
        discoveries: true,
        scenes: { include: { hotspots: true } },
        timelinePhotos: true,
        zones: true,
        media: true,
      },
    });

    return place ? mapPlace(place) : undefined;
  },

  async getPlacesByCountry(countryId: string) {
    const places = await prisma.place.findMany({
      where: { countryId },
      include: {
        discoveries: true,
        scenes: { include: { hotspots: true } },
        timelinePhotos: true,
        zones: true,
        media: true,
      },
      orderBy: { name: 'asc' },
    });

    return places.map(mapPlace);
  },

  async getPlacesByType(type: Place['type']) {
    const places = await prisma.place.findMany({
      where: { type },
      include: {
        discoveries: true,
        scenes: { include: { hotspots: true } },
        timelinePhotos: true,
        zones: true,
        media: true,
      },
      orderBy: { name: 'asc' },
    });

    return places.map(mapPlace);
  },

  async getPlacesByCountryAndType(countryId: string, type: Place['type']) {
    const places = await prisma.place.findMany({
      where: { countryId, type },
      include: {
        discoveries: true,
        scenes: { include: { hotspots: true } },
        timelinePhotos: true,
        zones: true,
        media: true,
      },
      orderBy: { name: 'asc' },
    });

    return places.map(mapPlace);
  },

  async getAllPlaces() {
    const places = await prisma.place.findMany({
      include: {
        discoveries: true,
        scenes: { include: { hotspots: true } },
        timelinePhotos: true,
        zones: true,
        media: true,
      },
      orderBy: { name: 'asc' },
    });

    return places.map(mapPlace);
  },

  async getPlaceCountByCountry(countryId: string) {
    return prisma.place.count({ where: { countryId } });
  },
};
