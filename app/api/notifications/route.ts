import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * ユーザーの通知一覧を取得
 * GET /api/notifications?userId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const notifications = await prisma.projectNotification.findMany({
      where: { userId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // 最新50件まで
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

/**
 * 通知を作成
 * POST /api/notifications
 */
export async function POST(request: NextRequest) {
  try {
    const { projectId, userId, title, message, type } = await request.json();

    if (!projectId || !userId || !title || !message) {
      return NextResponse.json(
        { error: 'projectId, userId, title, and message are required' },
        { status: 400 }
      );
    }

    const notification = await prisma.projectNotification.create({
      data: {
        projectId,
        userId,
        title,
        message,
        type: type || 'info',
        read: false,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(notification);
  } catch (error) {
    console.error('Failed to create notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}
