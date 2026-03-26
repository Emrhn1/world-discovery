import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getAuthenticatedUserId } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rows = await prisma.visitedRegion.findMany({
      where: { userId },
      select: { regionId: true },
    });

    return NextResponse.json({ items: rows.map((r) => r.regionId), total: rows.length });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to fetch visited regions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const regionId = String(body?.regionId ?? '').trim();
    const regionType = String(body?.regionType ?? 'place').trim() || 'place';

    if (!regionId) {
      return NextResponse.json({ error: 'regionId is required' }, { status: 400 });
    }

    await prisma.visitedRegion.upsert({
      where: { userId_regionId: { userId, regionId } },
      update: { regionType },
      create: { userId, regionId, regionType },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to upsert visited region',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.visitedRegion.deleteMany({ where: { userId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to reset visited regions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
