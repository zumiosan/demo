import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TaskStatus } from '@prisma/client';

/**
 * タスクの進捗を更新
 * PATCH /api/tasks/[id]/progress
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { progress, status } = await request.json();

    // バリデーション
    if (progress !== undefined && (progress < 0 || progress > 100)) {
      return NextResponse.json(
        { error: 'Progress must be between 0 and 100' },
        { status: 400 }
      );
    }

    // タスクの存在確認
    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // 更新データの準備
    const updateData: any = {};

    if (progress !== undefined) {
      updateData.progress = progress;

      // 進捗率に応じてステータスを自動更新
      if (progress === 0 && task.status === 'IN_PROGRESS') {
        updateData.status = TaskStatus.TODO;
      } else if (progress > 0 && progress < 100 && task.status === 'TODO') {
        updateData.status = TaskStatus.IN_PROGRESS;
      } else if (progress === 100) {
        updateData.status = TaskStatus.COMPLETED;
      }
    }

    if (status !== undefined) {
      updateData.status = status;
    }

    // タスクを更新
    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        assignedUser: {
          include: {
            agent: true,
          },
        },
        project: {
          include: {
            agent: true,
            teamMembers: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    // 通知を生成
    await createProgressNotifications(task, updatedTask);

    // タスク完了時にエージェントバンクに登録
    if (updatedTask.status === 'COMPLETED' && task.status !== 'COMPLETED') {
      await recordAgentPerformance(updatedTask);
    }

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Failed to update task progress:', error);
    return NextResponse.json(
      { error: 'Failed to update task progress' },
      { status: 500 }
    );
  }
}

/**
 * 進捗更新に基づいて通知を生成
 */
async function createProgressNotifications(oldTask: any, newTask: any) {
  const notifications: any[] = [];

  // プロジェクトの全PMに通知
  const pmUsers = newTask.project.teamMembers
    .filter((tm: any) => tm.user.role === 'PM')
    .map((tm: any) => tm.user);

  if (pmUsers.length === 0) return;

  // ステータス変更の通知
  if (oldTask.status !== newTask.status) {
    const statusMessage = getStatusChangeMessage(oldTask, newTask);
    for (const pm of pmUsers) {
      notifications.push({
        projectId: newTask.project.id,
        userId: pm.id,
        title: `タスクステータス更新: ${newTask.name}`,
        message: statusMessage,
        type: newTask.status === 'COMPLETED' ? 'success' : 'info',
      });
    }
  }

  // 進捗の大幅な変化（25%以上）の通知
  if (Math.abs(newTask.progress - oldTask.progress) >= 25) {
    const progressMessage = `${newTask.name}の進捗が${oldTask.progress}%から${newTask.progress}%に更新されました。`;
    for (const pm of pmUsers) {
      notifications.push({
        projectId: newTask.project.id,
        userId: pm.id,
        title: `タスク進捗更新: ${newTask.name}`,
        message: progressMessage,
        type: newTask.progress >= 100 ? 'success' : 'info',
      });
    }
  }

  // 完了時の通知
  if (newTask.status === 'COMPLETED' && oldTask.status !== 'COMPLETED') {
    for (const pm of pmUsers) {
      notifications.push({
        projectId: newTask.project.id,
        userId: pm.id,
        title: `タスク完了: ${newTask.name}`,
        message: `${newTask.name}が完了しました！`,
        type: 'success',
      });
    }
  }

  // 一括作成
  if (notifications.length > 0) {
    await prisma.projectNotification.createMany({
      data: notifications,
    });
  }
}

function getStatusChangeMessage(oldTask: any, newTask: any): string {
  const statusLabels: { [key: string]: string } = {
    TODO: '未着手',
    IN_PROGRESS: '進行中',
    REVIEW: 'レビュー中',
    COMPLETED: '完了',
    CANCELLED: 'キャンセル',
  };

  const oldStatus = statusLabels[oldTask.status] || oldTask.status;
  const newStatus = statusLabels[newTask.status] || newTask.status;

  return `${newTask.name}のステータスが「${oldStatus}」から「${newStatus}」に変更されました。`;
}

/**
 * エージェントパフォーマンスをAgentBankに記録
 */
async function recordAgentPerformance(task: any) {
  try {
    // ユーザーのエージェントを取得
    if (!task.assignedUser?.agent) {
      console.log('No agent assigned to user');
      return;
    }

    const agentId = task.assignedUser.agent.id;
    const projectId = task.project.id;

    // パフォーマンスデータを生成
    const performance = {
      taskId: task.id,
      taskName: task.name,
      completionDate: new Date().toISOString(),
      progress: task.progress,
      // スコア計算（進捗率と期日遵守を考慮）
      overallScore: calculateTaskScore(task),
      categories: {
        '納期遵守': calculateDeadlineScore(task),
        '品質': task.progress, // 進捗率を品質の代理指標とする
        'コミュニケーション': 85, // デフォルト値（今後、会話頻度などから算出）
      },
    };

    // 学習データ
    const learningData = {
      taskType: task.name.includes('設計') ? '設計'
        : task.name.includes('実装') ? '実装'
        : task.name.includes('テスト') ? 'テスト'
        : 'その他',
      domain: task.project.agent?.capabilities?.domain || '未分類',
      teamSize: task.project.teamMembers.length,
      completedAt: new Date().toISOString(),
    };

    // AgentBankに登録
    await prisma.agentBank.create({
      data: {
        agentId,
        projectId,
        performance,
        learningData,
      },
    });

    console.log(`Agent performance recorded for agent ${agentId} on task ${task.id}`);
  } catch (error) {
    console.error('Failed to record agent performance:', error);
    // エラーでも処理を続行（パフォーマンス記録の失敗でタスク完了処理を妨げない）
  }
}

/**
 * タスクの総合スコアを計算
 */
function calculateTaskScore(task: any): number {
  let score = 0;

  // 完了した場合は基本点
  if (task.status === 'COMPLETED') {
    score += 80;
  }

  // 期日を守った場合はボーナス
  const deadlineScore = calculateDeadlineScore(task);
  score += (deadlineScore - 80) * 0.2; // 期日スコアの差分の20%を加算

  // 進捗率が100%の場合はボーナス
  if (task.progress === 100) {
    score += 10;
  }

  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * 期日遵守スコアを計算
 */
function calculateDeadlineScore(task: any): number {
  if (!task.endDate) {
    return 85; // 期日未設定の場合はデフォルト値
  }

  const endDate = new Date(task.endDate);
  const now = new Date();

  if (task.status === 'COMPLETED') {
    // 完了済み：期日前なら高スコア
    if (now <= endDate) {
      return 100;
    } else {
      // 遅延日数に応じてスコア減点
      const daysLate = Math.floor((now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));
      return Math.max(50, 100 - daysLate * 5);
    }
  } else {
    // 未完了：期日までの余裕に応じてスコア
    const daysRemaining = Math.floor((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysRemaining > 3) {
      return 90;
    } else if (daysRemaining >= 0) {
      return 80;
    } else {
      return 60;
    }
  }
}
