import { NextResponse } from 'next/server';
import { getRepository } from '@/lib/repositories';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const countries = await getRepository().getCountries();
    return NextResponse.json({ items: countries, total: countries.length });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to fetch countries',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
