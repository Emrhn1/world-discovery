import { NextResponse } from 'next/server';
import { getRepository } from '@/lib/repositories';

export const revalidate = 300;

const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
};

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(_: Request, { params }: RouteParams) {
  try {
    const country = await getRepository().getCountryById(params.id);

    if (!country) {
      return NextResponse.json({ error: 'Country not found' }, { status: 404 });
    }

    return NextResponse.json(country, { headers: CACHE_HEADERS });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to fetch country',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
