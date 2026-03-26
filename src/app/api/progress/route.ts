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

    const rows = await prisma.userProgress.findMany({
      where: { userId, learned: true },
      select: { placeId: true, learnedAt: true },
    });

    const progress = rows.reduce<Record<string, { learned: boolean; learnedAt: number }>>((acc, row) => {
      acc[row.placeId] = {
        learned: true,
        learnedAt: row.learnedAt ? row.learnedAt.getTime() : Date.now(),
      };
      return acc;
    }, {});

    return NextResponse.json({ progress, total: rows.length });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to fetch progress',
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
    const placeId = String(body?.placeId ?? '').trim();

    if (!placeId) {
      return NextResponse.json({ error: 'placeId is required' }, { status: 400 });
    }

    const learnedAt = new Date();

    const row = await prisma.userProgress.upsert({
      where: { userId_placeId: { userId, placeId } },
      update: { learned: true, learnedAt },
      create: { userId, placeId, learned: true, learnedAt },
    });

    return NextResponse.json({
      ok: true,
      item: {
        placeId: row.placeId,
        learned: row.learned,
        learnedAt: row.learnedAt?.getTime() ?? Date.now(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to update progress',
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

    await prisma.userProgress.deleteMany({ where: { userId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to reset progress',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
