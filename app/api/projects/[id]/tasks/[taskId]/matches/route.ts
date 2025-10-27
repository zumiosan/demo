import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { findBestMatches } from '@/lib/task-matcher';

/**
 * タスクに対する最適なユーザーマッチングを取得
 * GET /api/projects/[id]/tasks/[taskId]/matches
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const { id: projectId, taskId } = await params;

    // タスクとプロジェクト情報を取得
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            agent: true,
          },
        },
      },
    });

    if (!task || task.projectId !== projectId) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // 全ユーザーを取得
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        skills: true,
        industries: true,
        preferences: true,
      },
    });

    // マッチングスコアを計算
    const matches = findBestMatches(
      users,
      task,
      task.project,
      5 // 上位5名を返す
    );

    return NextResponse.json(matches);
  } catch (error) {
    console.error('Failed to find matches:', error);
    return NextResponse.json(
      { error: 'Failed to find matches' },
      { status: 500 }
    );
  }
}
