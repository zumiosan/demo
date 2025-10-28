import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { suggestTaskAssignments } from '@/lib/task-matcher';

/**
 * プロジェクトの全タスクを自動割り当て
 * POST /api/projects/[id]/auto-assign
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    // プロジェクトとタスクを取得
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        agent: true,
        tasks: true,
        teamMembers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                skills: true,
                industries: true,
                preferences: true,
                agent: {
                  include: {
                    agentBanks: {
                      orderBy: {
                        registeredAt: 'desc',
                      },
                      take: 10, // 最新10件の実績を参照
                    },
                  },
                },
              },
            },
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

    // プロジェクトメンバーのみを取得
    const users = project.teamMembers.map((tm) => tm.user);

    // 自動割り当ての提案を取得（エージェント実績を考慮）
    const assignments = suggestTaskAssignments(users, project.tasks, project);

    // 提案された割り当てを実行
    const results = [];
    for (const [taskId, match] of assignments.entries()) {
      const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: {
          assignedUserId: match.userId,
        },
        include: {
          assignedUser: true,
        },
      });

      results.push({
        task: updatedTask,
        match,
      });
    }

    return NextResponse.json({
      assigned: results.length,
      results,
    });
  } catch (error) {
    console.error('Failed to auto-assign tasks:', error);
    return NextResponse.json(
      { error: 'Failed to auto-assign tasks' },
      { status: 500 }
    );
  }
}
