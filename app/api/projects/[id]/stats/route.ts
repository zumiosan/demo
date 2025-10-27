import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * プロジェクトの統計情報を取得
 * GET /api/projects/[id]/stats
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // プロジェクトとタスクを取得
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        tasks: {
          include: {
            assignedUser: true,
          },
        },
        teamMembers: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // 統計情報の計算
    const totalTasks = project.tasks.length;
    const completedTasks = project.tasks.filter((t) => t.status === 'COMPLETED').length;
    const inProgressTasks = project.tasks.filter((t) => t.status === 'IN_PROGRESS').length;
    const todoTasks = project.tasks.filter((t) => t.status === 'TODO').length;

    // 全体の進捗率（各タスクの進捗率の平均）
    const overallProgress = totalTasks > 0
      ? Math.round(project.tasks.reduce((sum, t) => sum + t.progress, 0) / totalTasks)
      : 0;

    // 遅延タスクの検出（終了日が過ぎているが完了していないタスク）
    const now = new Date();
    const delayedTasks = project.tasks.filter(
      (t) => t.endDate && new Date(t.endDate) < now && t.status !== 'COMPLETED'
    );

    // メンバーごとの進捗
    const memberProgress = project.teamMembers.map((tm) => {
      const memberTasks = project.tasks.filter((t) => t.assignedUserId === tm.userId);
      const completedCount = memberTasks.filter((t) => t.status === 'COMPLETED').length;
      const avgProgress = memberTasks.length > 0
        ? Math.round(memberTasks.reduce((sum, t) => sum + t.progress, 0) / memberTasks.length)
        : 0;

      return {
        userId: tm.userId,
        userName: tm.user.name,
        role: tm.role,
        totalTasks: memberTasks.length,
        completedTasks: completedCount,
        averageProgress: avgProgress,
      };
    });

    const stats = {
      projectId: id,
      projectName: project.name,
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      overallProgress,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      delayedTasksCount: delayedTasks.length,
      delayedTasks: delayedTasks.map((t) => ({
        id: t.id,
        name: t.name,
        endDate: t.endDate,
        progress: t.progress,
        assignedUser: t.assignedUser?.name || '未割り当て',
      })),
      memberProgress,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Failed to fetch project stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project stats' },
      { status: 500 }
    );
  }
}
