import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * プロジェクトの会話一覧取得
 * GET /api/projects/[id]/conversations
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    const conversations = await prisma.projectConversation.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return NextResponse.json(conversations);
  } catch (error) {
    console.error('Failed to fetch conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

/**
 * プロジェクトの会話を送信（PM ⇔ プロジェクトエージェント）
 * POST /api/projects/[id]/conversations
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const { message, userId } = await request.json();

    if (!message || !userId) {
      return NextResponse.json(
        { error: 'Message and userId are required' },
        { status: 400 }
      );
    }

    // プロジェクトとタスクの状況を取得
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        agent: true,
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

    // PMのメッセージを保存
    const pmMessage = await prisma.projectConversation.create({
      data: {
        projectId,
        userId,
        message,
        sender: 'pm',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    // プロジェクトエージェントの自動応答を生成
    const agentResponse = generateProjectAgentResponse(project, message);

    const agentMessage = await prisma.projectConversation.create({
      data: {
        projectId,
        userId,
        message: agentResponse,
        sender: 'agent',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({
      pmMessage,
      agentMessage,
    });
  } catch (error) {
    console.error('Failed to send message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

/**
 * プロジェクトエージェントの自動応答を生成
 */
function generateProjectAgentResponse(project: any, pmMessage: string): string {
  const agentName = project.agent?.name || 'プロジェクトエージェント';
  const messageLower = pmMessage.toLowerCase();

  // タスク状況の集計
  const totalTasks = project.tasks.length;
  const completedTasks = project.tasks.filter((t: any) => t.status === 'COMPLETED').length;
  const inProgressTasks = project.tasks.filter((t: any) => t.status === 'IN_PROGRESS').length;
  const unassignedTasks = project.tasks.filter((t: any) => !t.assignedUserId).length;
  const avgProgress = totalTasks > 0
    ? Math.round(project.tasks.reduce((sum: number, t: any) => sum + t.progress, 0) / totalTasks)
    : 0;

  // 進捗確認
  if (messageLower.includes('進捗') || messageLower.includes('状況') || messageLower.includes('どう')) {
    let response = `${agentName}です。${project.name}の現在の状況を報告します。\n\n`;
    response += `【タスク状況】\n`;
    response += `- 総タスク数: ${totalTasks}件\n`;
    response += `- 完了: ${completedTasks}件\n`;
    response += `- 進行中: ${inProgressTasks}件\n`;
    response += `- 未割り当て: ${unassignedTasks}件\n`;
    response += `- 平均進捗: ${avgProgress}%\n\n`;

    if (completedTasks === totalTasks && totalTasks > 0) {
      response += '✅ すべてのタスクが完了しています！素晴らしい成果です。';
    } else if (avgProgress >= 70) {
      response += '🚀 順調に進捗しています。完了に向けて最終段階に入っています。';
    } else if (avgProgress >= 30) {
      response += '⚙️ 作業は順調に進んでいます。チームのパフォーマンスは良好です。';
    } else {
      response += '🌱 プロジェクトは初期段階です。チームメンバーが作業を進めています。';
    }

    if (unassignedTasks > 0) {
      response += `\n\n⚠️ ${unassignedTasks}件のタスクが未割り当てです。早めの割り当てをお勧めします。`;
    }

    return response;
  }

  // チーム状況
  if (messageLower.includes('チーム') || messageLower.includes('メンバー')) {
    let response = `${agentName}です。チームの状況を報告します。\n\n`;
    response += `【チームメンバー】\n`;
    response += `- メンバー数: ${project.teamMembers.length}名\n\n`;

    const memberTasks = project.teamMembers.map((member: any) => {
      const assignedTasks = project.tasks.filter((t: any) => t.assignedUserId === member.user.id);
      const completed = assignedTasks.filter((t: any) => t.status === 'COMPLETED').length;
      return {
        name: member.user.name,
        total: assignedTasks.length,
        completed,
      };
    });

    memberTasks.forEach((mt: any) => {
      response += `- ${mt.name}: ${mt.total}件のタスク（完了: ${mt.completed}件）\n`;
    });

    response += '\n\nチーム全体のパフォーマンスは良好です。';
    return response;
  }

  // 課題・リスク
  if (messageLower.includes('課題') || messageLower.includes('問題') || messageLower.includes('リスク')) {
    let response = `${agentName}です。現在のリスクと課題を報告します。\n\n`;
    const risks: string[] = [];

    if (unassignedTasks > 0) {
      risks.push(`⚠️ ${unassignedTasks}件のタスクが未割り当て`);
    }

    const delayedTasks = project.tasks.filter((t: any) => {
      if (!t.endDate || t.status === 'COMPLETED') return false;
      const endDate = new Date(t.endDate);
      const now = new Date();
      return endDate < now;
    });

    if (delayedTasks.length > 0) {
      risks.push(`⚠️ ${delayedTasks.length}件のタスクが期限超過`);
    }

    if (avgProgress < 30 && totalTasks > 0) {
      risks.push(`⚠️ 全体の進捗が遅い（${avgProgress}%）`);
    }

    if (risks.length === 0) {
      response += '✅ 現時点で大きなリスクや課題は報告されていません。プロジェクトは順調に進行中です。';
    } else {
      response += '【検出されたリスク】\n';
      risks.forEach(risk => {
        response += `${risk}\n`;
      });
      response += '\n対応が必要な項目があります。早めの対処をお勧めします。';
    }

    return response;
  }

  // サポート要望
  if (messageLower.includes('手伝') || messageLower.includes('サポート') || messageLower.includes('助')) {
    return `${agentName}です。喜んでサポートいたします。プロジェクトの進捗管理、リソース配分、タスクの自動割り当て、リスク分析など、様々な面でお手伝いできます。具体的にどのような支援が必要でしょうか？`;
  }

  // デフォルトの応答
  return `${agentName}です。${project.name}について、何かお手伝いできることはありますか？プロジェクトの進捗、チームの状況、課題やリスクについて、いつでもご相談ください。`;
}
