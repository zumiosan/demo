import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * オファー承諾
 * POST /api/offers/[id]/accept
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { action } = await request.json();

    // オファーの存在確認
    const offer = await prisma.offer.findUnique({
      where: { id },
      include: {
        project: true,
        user: true,
      },
    });

    if (!offer) {
      return NextResponse.json(
        { error: 'Offer not found' },
        { status: 404 }
      );
    }

    if (offer.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Offer has already been responded to' },
        { status: 400 }
      );
    }

    if (action === 'accept') {
      // オファーを承諾
      await prisma.$transaction(async (tx) => {
        // オファーステータス更新
        await tx.offer.update({
          where: { id },
          data: {
            status: 'ACCEPTED',
            respondedAt: new Date(),
          },
        });

        // チームメンバーとして追加
        await tx.teamMember.create({
          data: {
            projectId: offer.projectId,
            userId: offer.userId,
            role: 'メンバー',
          },
        });
      });

      return NextResponse.json({
        success: true,
        message: 'Offer accepted successfully',
      });
    } else if (action === 'reject') {
      // オファーを辞退
      await prisma.offer.update({
        where: { id },
        data: {
          status: 'REJECTED',
          respondedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Offer rejected successfully',
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Failed to respond to offer:', error);
    return NextResponse.json(
      { error: 'Failed to respond to offer' },
      { status: 500 }
    );
  }
}
