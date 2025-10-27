import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * オファー一覧取得
 * GET /api/offers?userId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // ユーザーのオファーを取得（面接結果がPASSEDのもの）
    const offers = await prisma.offer.findMany({
      where: {
        userId,
      },
      include: {
        project: {
          include: {
            agent: true,
            teamMembers: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    role: true,
                  },
                },
              },
            },
            tasks: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
          },
        },
        interview: {
          include: {
            project: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(offers);
  } catch (error) {
    console.error('Failed to fetch offers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch offers' },
      { status: 500 }
    );
  }
}
