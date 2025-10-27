import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * ユーザー詳細情報取得
 * GET /api/users/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        agent: true,
        teamMembers: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
          },
        },
        assignedTasks: {
          where: {
            status: {
              not: 'COMPLETED',
            },
          },
          include: {
            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            endDate: 'asc',
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Failed to fetch user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

/**
 * ユーザープロフィール更新
 * PATCH /api/users/[id]
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { name, skills, industries, preferences } = body;

    // ユーザーの存在確認
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 更新データの準備
    const updateData: any = {};

    if (name !== undefined) {
      updateData.name = name;
    }

    if (skills !== undefined) {
      updateData.skills = skills;
    }

    if (industries !== undefined) {
      updateData.industries = industries;
    }

    if (preferences !== undefined) {
      updateData.preferences = preferences;
    }

    // ユーザー情報を更新
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        agent: true,
        teamMembers: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
          },
        },
        assignedTasks: {
          where: {
            status: {
              not: 'COMPLETED',
            },
          },
          include: {
            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Failed to update user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}
