import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import type { PlaceType } from '@/types';

export const revalidate = 120;

const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=30, s-maxage=120, stale-while-revalidate=300',
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const countryId = searchParams.get('countryId')?.trim();

    if (!countryId) {
      return NextResponse.json(
        { error: 'countryId query parameter is required' },
        { status: 400 }
      );
    }

    const grouped = await prisma.place.groupBy({
      by: ['type'],
      where: { countryId },
      _count: { _all: true },
    });

    const counts: Record<PlaceType, number> = {
      historical: 0,
      nature: 0,
      city: 0,
    };

    grouped.forEach((row) => {
      counts[row.type as PlaceType] = row._count._all;
    });

    const total = counts.historical + counts.nature + counts.city;

    return NextResponse.json(
      {
        countryId,
        counts,
        total,
      },
      { headers: CACHE_HEADERS }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to fetch place counts',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
