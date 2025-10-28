import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * タスク報告の一覧取得
 * GET /api/tasks/[id]/reports
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;

    const reports = await prisma.taskReport.findMany({
      where: { taskId },
      include: {
        task: {
          select: {
            id: true,
            name: true,
            status: true,
            progress: true,
          },
        },
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
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error('Failed to fetch reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

/**
 * タスク報告を作成（タスクエージェント→プロジェクトエージェント）
 * POST /api/tasks/[id]/reports
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;

    // タスクの情報を取得
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        agent: true,
        assignedUser: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // 自動的に報告内容を生成
    const reportContent = generateReportContent(task);
    const reportData = generateReportData(task);

    const report = await prisma.taskReport.create({
      data: {
        taskId,
        projectId: task.projectId,
        content: reportContent,
        reportData,
      },
      include: {
        task: {
          select: {
            id: true,
            name: true,
            status: true,
            progress: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error('Failed to create report:', error);
    return NextResponse.json(
      { error: 'Failed to create report' },
      { status: 500 }
    );
  }
}

/**
 * 報告内容を自動生成
 */
function generateReportContent(task: any): string {
  const agentName = task.agent?.name || 'タスクエージェント';
  const taskName = task.name;
  const progress = task.progress;
  const status = task.status;
  const assignedUser = task.assignedUser?.name || '未割り当て';

  let content = `【${taskName}】定期報告\n\n`;
  content += `担当エージェント: ${agentName}\n`;
  content += `担当者: ${assignedUser}\n`;
  content += `ステータス: ${getStatusLabel(status)}\n`;
  content += `進捗: ${progress}%\n\n`;

  // ステータスに応じたコメント
  if (status === 'COMPLETED') {
    content += '✅ タスクが完了しました。品質チェックを実施済みで、すべての要件を満たしています。\n';
  } else if (status === 'REVIEW') {
    content += '📝 レビュー中です。完了まで残りわずかです。\n';
  } else if (status === 'IN_PROGRESS') {
    if (progress >= 70) {
      content += '🚀 順調に進捗しています。完了に向けて最終段階に入りました。\n';
    } else if (progress >= 30) {
      content += '⚙️ 作業を進めています。予定通りのペースで進行中です。\n';
    } else {
      content += '🌱 作業を開始しました。初期セットアップを完了し、本格的な実装に着手しています。\n';
    }
  } else if (status === 'TODO') {
    content += '📋 未着手です。優先度に応じて着手予定です。\n';
  }

  // 次のアクション
  content += '\n【次のアクション】\n';
  if (status === 'COMPLETED') {
    content += '- 完了報告をステークホルダーに共有\n';
  } else if (status === 'REVIEW') {
    content += '- レビューフィードバックの対応\n';
    content += '- 最終確認と承認待ち\n';
  } else if (status === 'IN_PROGRESS') {
    content += '- 引き続き実装作業を推進\n';
    content += '- 定期的な進捗報告\n';
  } else {
    content += '- 作業開始の準備\n';
    content += '- 必要なリソースの確認\n';
  }

  return content;
}

/**
 * 報告データを生成
 */
function generateReportData(task: any) {
  return {
    progress: task.progress,
    status: task.status,
    startDate: task.startDate,
    endDate: task.endDate,
    assignedUserId: task.assignedUserId,
    timestamp: new Date().toISOString(),
    metrics: {
      tasksCompleted: task.status === 'COMPLETED' ? 1 : 0,
      blockers: [],
      risks: getRisks(task),
    },
  };
}

function getStatusLabel(status: string): string {
  const labels: { [key: string]: string } = {
    TODO: '未着手',
    IN_PROGRESS: '進行中',
    REVIEW: 'レビュー中',
    COMPLETED: '完了',
    CANCELLED: 'キャンセル',
  };
  return labels[status] || status;
}

function getRisks(task: any): string[] {
  const risks: string[] = [];

  // 期限超過のリスク
  if (task.endDate) {
    const endDate = new Date(task.endDate);
    const now = new Date();
    const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysRemaining < 0 && task.status !== 'COMPLETED') {
      risks.push('期限超過');
    } else if (daysRemaining <= 2 && daysRemaining > 0 && task.progress < 80) {
      risks.push('期限が迫っている');
    }
  }

  // 進捗の遅れ
  if (task.status === 'IN_PROGRESS' && task.progress < 20) {
    risks.push('進捗が遅い可能性');
  }

  // 担当者未割り当て
  if (!task.assignedUserId && task.status !== 'COMPLETED') {
    risks.push('担当者未割り当て');
  }

  return risks;
}
