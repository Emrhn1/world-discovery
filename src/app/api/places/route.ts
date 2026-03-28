import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/repositories';
import type { Place } from '@/types';

export const revalidate = 120;

const VALID_TYPES: Place['type'][] = ['historical', 'nature', 'city'];

const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=30, s-maxage=120, stale-while-revalidate=300',
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const countryId = searchParams.get('countryId')?.trim();
    const rawType = searchParams.get('type')?.trim();

    const type =
      rawType && VALID_TYPES.includes(rawType as Place['type'])
        ? (rawType as Place['type'])
        : undefined;

    const repo = getRepository();

    const items = countryId && type
      ? await repo.getPlacesByCountryAndType(countryId, type)
      : countryId
        ? await repo.getPlacesByCountry(countryId)
        : type
          ? await repo.getPlacesByType(type)
          : await repo.getAllPlaces();

    return NextResponse.json(
      {
        items,
        total: items.length,
        filters: {
          countryId: countryId ?? null,
          type: type ?? null,
        },
      },
      { headers: CACHE_HEADERS }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to fetch places',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
