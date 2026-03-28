import { NextResponse } from 'next/server';
import { getRepository } from '@/lib/repositories';

export const revalidate = 300;

const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
};

const PLACE_DETAIL_TTL_MS = 5 * 60 * 1000;

type PlaceCacheEntry = {
  value: unknown;
  expiresAt: number;
};

declare global {
  // eslint-disable-next-line no-var
  var __worldDiscoveryPlaceDetailCache: Map<string, PlaceCacheEntry> | undefined;
}

const placeDetailCache =
  global.__worldDiscoveryPlaceDetailCache ?? new Map<string, PlaceCacheEntry>();

if (process.env.NODE_ENV !== 'production') {
  global.__worldDiscoveryPlaceDetailCache = placeDetailCache;
}

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(_: Request, { params }: RouteParams) {
  try {
    const key = params.id;
    const now = Date.now();
    const cached = placeDetailCache.get(key);

    if (cached && cached.expiresAt > now) {
      return NextResponse.json(cached.value, {
        headers: {
          ...CACHE_HEADERS,
          'X-Place-Cache': 'HIT',
        },
      });
    }

    const place = await getRepository().getPlaceById(key);

    if (!place) {
      return NextResponse.json({ error: 'Place not found' }, { status: 404 });
    }

    placeDetailCache.set(key, {
      value: place,
      expiresAt: now + PLACE_DETAIL_TTL_MS,
    });

    return NextResponse.json(place, {
      headers: {
        ...CACHE_HEADERS,
        'X-Place-Cache': 'MISS',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to fetch place',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}