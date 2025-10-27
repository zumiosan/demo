import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TaskStatus } from '@prisma/client';

/**
 * タスクのAI自動実行（モック）
 * POST /api/tasks/[id]/execute
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // タスクの存在確認
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: true,
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // 自動実行可能かチェック
    if (!task.autoExecutable) {
      return NextResponse.json(
        { error: 'This task is not auto-executable' },
        { status: 400 }
      );
    }

    // 既に完了している場合はエラー
    if (task.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Task is already completed' },
        { status: 400 }
      );
    }

    // モック実行ログの生成
    const executionSteps = generateMockExecutionSteps(task.name);

    // タスクを更新（進行中に）
    await prisma.task.update({
      where: { id },
      data: {
        status: TaskStatus.IN_PROGRESS,
        progress: 0,
        executionLog: {
          startedAt: new Date().toISOString(),
          steps: executionSteps,
          status: 'running',
        },
      },
    });

    // 実行をシミュレート（ストリーミング形式で返す）
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 各ステップを順次実行
          for (let i = 0; i < executionSteps.length; i++) {
            const step = executionSteps[i];
            const progress = Math.round(((i + 1) / executionSteps.length) * 100);

            // ステップ開始をクライアントに通知
            const startMessage = JSON.stringify({
              type: 'step_start',
              step: i + 1,
              total: executionSteps.length,
              description: step.description,
              progress,
            }) + '\n';
            controller.enqueue(encoder.encode(startMessage));

            // 実行時間をシミュレート（実際はここで何か処理を行う）
            await new Promise(resolve => setTimeout(resolve, step.duration));

            // ステップ完了をクライアントに通知
            const completeMessage = JSON.stringify({
              type: 'step_complete',
              step: i + 1,
              result: step.result,
              progress,
            }) + '\n';
            controller.enqueue(encoder.encode(completeMessage));

            // DBのタスクも更新
            await prisma.task.update({
              where: { id },
              data: {
                progress,
                executionLog: {
                  startedAt: new Date().toISOString(),
                  steps: executionSteps.map((s, idx) => ({
                    ...s,
                    completed: idx <= i,
                  })),
                  currentStep: i + 1,
                  status: 'running',
                },
              },
            });
          }

          // 完了メッセージ
          const doneMessage = JSON.stringify({
            type: 'done',
            message: 'タスクの実行が完了しました',
          }) + '\n';
          controller.enqueue(encoder.encode(doneMessage));

          // タスクを完了状態に更新
          await prisma.task.update({
            where: { id },
            data: {
              status: TaskStatus.COMPLETED,
              progress: 100,
              executionLog: {
                startedAt: new Date().toISOString(),
                completedAt: new Date().toISOString(),
                steps: executionSteps.map(s => ({ ...s, completed: true })),
                status: 'completed',
              },
            },
          });

          controller.close();
        } catch (error) {
          console.error('Execution error:', error);

          // エラーメッセージを送信
          const errorMessage = JSON.stringify({
            type: 'error',
            error: 'Execution failed',
          }) + '\n';
          controller.enqueue(encoder.encode(errorMessage));

          // タスクをエラー状態に更新
          await prisma.task.update({
            where: { id },
            data: {
              executionLog: {
                startedAt: new Date().toISOString(),
                completedAt: new Date().toISOString(),
                steps: executionSteps,
                status: 'failed',
                error: String(error),
              },
            },
          });

          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Failed to execute task:', error);
    return NextResponse.json(
      { error: 'Failed to execute task' },
      { status: 500 }
    );
  }
}

/**
 * タスク名に応じたモック実行ステップを生成
 */
function generateMockExecutionSteps(taskName: string): Array<{
  description: string;
  duration: number;
  result: string;
}> {
  // タスク名に応じて異なる実行ステップを生成
  if (taskName.includes('セキュリティ監査')) {
    return [
      {
        description: 'コードベースの脆弱性スキャンを開始',
        duration: 2000,
        result: '25個のファイルをスキャン完了。3件の潜在的な脆弱性を検出しました。',
      },
      {
        description: '依存パッケージのセキュリティチェック',
        duration: 1500,
        result: '87個のパッケージを確認。2件の既知の脆弱性を発見しました。',
      },
      {
        description: '認証・認可フローの検証',
        duration: 2000,
        result: 'JWT実装とセッション管理を検証。推奨される改善点を3件特定しました。',
      },
      {
        description: 'データ保護とプライバシー対策の確認',
        duration: 1500,
        result: '個人情報の取り扱いとデータ暗号化を確認。適切に実装されています。',
      },
      {
        description: 'セキュリティ監査レポートの生成',
        duration: 1000,
        result: '詳細なレポートを生成しました。5件の推奨事項があります。',
      },
    ];
  } else if (taskName.includes('テスト') || taskName.includes('品質保証')) {
    return [
      {
        description: 'テスト環境のセットアップ',
        duration: 1500,
        result: 'テスト環境を正常に構築しました。',
      },
      {
        description: 'ユニットテストの実行',
        duration: 2500,
        result: '152個のユニットテストを実行。すべて成功しました。',
      },
      {
        description: '統合テストの実行',
        duration: 3000,
        result: '43個の統合テストを実行。すべて成功しました。',
      },
      {
        description: 'E2Eテストの実行',
        duration: 4000,
        result: '18個のE2Eテストを実行。すべて成功しました。',
      },
      {
        description: 'コードカバレッジレポートの生成',
        duration: 1000,
        result: 'カバレッジ: 87%。テストレポートを生成しました。',
      },
    ];
  } else {
    // デフォルトの実行ステップ
    return [
      {
        description: 'タスクの要件を分析',
        duration: 1500,
        result: '要件を正常に解析しました。',
      },
      {
        description: '実装計画の策定',
        duration: 2000,
        result: '実装アプローチを決定しました。',
      },
      {
        description: 'コードの実装',
        duration: 3000,
        result: '主要な機能を実装しました。',
      },
      {
        description: 'テストの作成と実行',
        duration: 2500,
        result: 'テストを作成し、すべて成功しました。',
      },
      {
        description: 'ドキュメントの作成',
        duration: 1500,
        result: '実装ドキュメントを作成しました。',
      },
    ];
  }
}
