import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * タスクの会話一覧取得
 * GET /api/tasks/[id]/conversations
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;

    const conversations = await prisma.taskConversation.findMany({
      where: { taskId },
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
 * タスクの会話を送信
 * POST /api/tasks/[id]/conversations
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;
    const { message, userId } = await request.json();

    if (!message || !userId) {
      return NextResponse.json(
        { error: 'Message and userId are required' },
        { status: 400 }
      );
    }

    // タスクの存在確認
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        agent: true,
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // ユーザーのメッセージを保存
    const userMessage = await prisma.taskConversation.create({
      data: {
        taskId,
        userId,
        message,
        sender: 'user',
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

    // エージェントの自動応答を生成
    const agentResponse = generateAgentResponse(task, message);

    const agentMessage = await prisma.taskConversation.create({
      data: {
        taskId,
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
      userMessage,
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
 * エージェントの自動応答を生成（モック）
 */
function generateAgentResponse(task: any, userMessage: string): string {
  const agentName = task.agent?.name || 'タスクエージェント';
  const taskName = task.name;
  const progress = task.progress;
  const status = task.status;

  const messageLower = userMessage.toLowerCase();

  // 実装方針・やり方
  if (messageLower.includes('実装') || messageLower.includes('方針') || messageLower.includes('やり方') ||
      messageLower.includes('方法') || messageLower.includes('どうやって') || messageLower.includes('どのように')) {
    return generateImplementationAdvice(task);
  }

  // 進捗確認
  if (messageLower.includes('進捗') || messageLower.includes('状況') || messageLower.includes('どう')) {
    return `${agentName}です。${taskName}の現在の進捗は${progress}%です。ステータスは${getStatusLabel(status)}となっています。${getProgressComment(progress, status)}`;
  }

  // 完了予定
  if (messageLower.includes('いつ') || messageLower.includes('完了') || messageLower.includes('終わ')) {
    if (task.endDate) {
      const endDate = new Date(task.endDate);
      return `${agentName}です。${taskName}の完了予定日は${endDate.toLocaleDateString('ja-JP')}です。現在${progress}%完了しており、予定通り進行中です。`;
    }
    return `${agentName}です。${taskName}の完了予定日は設定されていませんが、現在${progress}%完了しています。`;
  }

  // 課題・問題
  if (messageLower.includes('課題') || messageLower.includes('問題') || messageLower.includes('困')) {
    return `${agentName}です。現時点では大きな課題は報告されていません。技術的な質問や相談があれば、お気軽にお聞かせください。`;
  }

  // サポート要望
  if (messageLower.includes('手伝') || messageLower.includes('サポート') || messageLower.includes('助')) {
    return `${agentName}です。喜んでサポートいたします。具体的にどのような支援が必要でしょうか？技術的なアドバイス、リソースの提供、スケジュール調整など、お気軽にご相談ください。`;
  }

  // デフォルトの応答
  return `${agentName}です。ご連絡ありがとうございます。${taskName}について、何かお手伝いできることはありますか？進捗状況や課題について、いつでもご相談ください。`;
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

function getProgressComment(progress: number, status: string): string {
  if (status === 'COMPLETED') {
    return 'タスクは完了しています。お疲れ様でした！';
  }
  if (progress < 30) {
    return 'まだ初期段階ですが、順調に進めています。';
  }
  if (progress < 70) {
    return '順調に進捗しています。引き続き頑張ります。';
  }
  if (progress < 100) {
    return 'もうすぐ完了です。最終段階に入っています。';
  }
  return '';
}

/**
 * 実装方針のアドバイスを生成
 */
function generateImplementationAdvice(task: any): string {
  const agentName = task.agent?.name || 'タスクエージェント';
  const taskName = task.name;
  const description = task.description || '';
  const taskNameLower = taskName.toLowerCase();
  const descriptionLower = description.toLowerCase();

  // タスク名や説明から技術領域を推測
  let advice = `${agentName}です。${taskName}の実装方針についてアドバイスします。\n\n`;

  // API関連
  if (taskNameLower.includes('api') || descriptionLower.includes('api')) {
    advice += `【API設計・実装】\n`;
    advice += `1. RESTful設計原則に従い、リソースベースのエンドポイント設計を行います\n`;
    advice += `2. OpenAPI/Swagger仕様書を作成し、エンドポイントを文書化します\n`;
    advice += `3. エラーハンドリングとバリデーションを適切に実装します\n`;
    advice += `4. 認証・認可（JWT、OAuth等）のセキュリティ対策を実装します\n`;
    advice += `5. レート制限とロギングを設定します\n\n`;
    advice += `参考技術: Express.js, FastAPI, Spring Boot, Prisma/TypeORM`;
    return advice;
  }

  // データベース関連
  if (taskNameLower.includes('データベース') || taskNameLower.includes('db') ||
      descriptionLower.includes('データベース') || descriptionLower.includes('データモデル')) {
    advice += `【データベース設計・実装】\n`;
    advice += `1. ER図を作成し、エンティティと関連を明確にします\n`;
    advice += `2. 正規化（第3正規形まで）を実施し、データの整合性を確保します\n`;
    advice += `3. インデックス設計を行い、クエリパフォーマンスを最適化します\n`;
    advice += `4. トランザクション境界を適切に設定します\n`;
    advice += `5. マイグレーションスクリプトを作成します\n\n`;
    advice += `参考技術: PostgreSQL, Prisma, TypeORM, Sequelize`;
    return advice;
  }

  // フロントエンド関連
  if (taskNameLower.includes('フロントエンド') || taskNameLower.includes('ui') ||
      taskNameLower.includes('画面') || descriptionLower.includes('フロントエンド')) {
    advice += `【フロントエンド実装】\n`;
    advice += `1. コンポーネント設計を行い、再利用可能な構造にします\n`;
    advice += `2. 状態管理（Redux、Context API等）を適切に実装します\n`;
    advice += `3. レスポンシブデザインに対応し、モバイル環境も考慮します\n`;
    advice += `4. アクセシビリティ（WCAG準拠）を確保します\n`;
    advice += `5. パフォーマンス最適化（遅延ロード、メモ化等）を行います\n\n`;
    advice += `参考技術: React, Next.js, TypeScript, Tailwind CSS`;
    return advice;
  }

  // AI/機械学習関連
  if (taskNameLower.includes('ai') || taskNameLower.includes('llm') ||
      taskNameLower.includes('機械学習') || descriptionLower.includes('モデル')) {
    advice += `【AI/機械学習実装】\n`;
    advice += `1. データ収集と前処理パイプラインを構築します\n`;
    advice += `2. 適切なモデルアーキテクチャを選定・比較します\n`;
    advice += `3. ハイパーパラメータチューニングを実施します\n`;
    advice += `4. モデルの評価指標を定義し、継続的に評価します\n`;
    advice += `5. デプロイ環境を構築し、A/Bテストを実施します\n\n`;
    advice += `参考技術: PyTorch, TensorFlow, LangChain, FastAPI`;
    return advice;
  }

  // セキュリティ関連
  if (taskNameLower.includes('セキュリティ') || descriptionLower.includes('セキュリティ') ||
      descriptionLower.includes('暗号化')) {
    advice += `【セキュリティ実装】\n`;
    advice += `1. OWASP Top 10の脆弱性対策を実施します\n`;
    advice += `2. 入力検証とサニタイゼーションを徹底します\n`;
    advice += `3. 認証・認可機能を適切に実装します（多要素認証推奨）\n`;
    advice += `4. データ暗号化（保存時・転送時）を実装します\n`;
    advice += `5. セキュリティ監査とペネトレーションテストを実施します\n\n`;
    advice += `参考技術: bcrypt, JWT, OAuth2.0, SSL/TLS`;
    return advice;
  }

  // テスト関連
  if (taskNameLower.includes('テスト') || descriptionLower.includes('テスト')) {
    advice += `【テスト実装】\n`;
    advice += `1. 単体テスト: 各関数・メソッドの動作を検証します\n`;
    advice += `2. 結合テスト: コンポーネント間の連携を検証します\n`;
    advice += `3. E2Eテスト: ユーザーシナリオを網羅的に検証します\n`;
    advice += `4. テストカバレッジ80%以上を目指します\n`;
    advice += `5. CI/CDパイプラインに組み込み、自動実行します\n\n`;
    advice += `参考技術: Jest, Vitest, Playwright, Cypress`;
    return advice;
  }

  // デプロイ・インフラ関連
  if (taskNameLower.includes('デプロイ') || taskNameLower.includes('インフラ') ||
      taskNameLower.includes('kubernetes') || descriptionLower.includes('デプロイ')) {
    advice += `【デプロイ・インフラ実装】\n`;
    advice += `1. コンテナ化（Docker）を実施します\n`;
    advice += `2. CI/CDパイプラインを構築します\n`;
    advice += `3. オーケストレーション（Kubernetes）を設定します\n`;
    advice += `4. モニタリングとロギングを実装します\n`;
    advice += `5. バックアップとディザスタリカバリ計画を策定します\n\n`;
    advice += `参考技術: Docker, Kubernetes, GitHub Actions, Prometheus`;
    return advice;
  }

  // デフォルトの実装方針
  advice += `【一般的な実装手順】\n`;
  advice += `1. 要件の詳細化: タスクの詳細を明確にし、受け入れ基準を定義します\n`;
  advice += `2. 設計: アーキテクチャ設計、データモデル設計を行います\n`;
  advice += `3. 実装: コーディング規約に従い、段階的に実装します\n`;
  advice += `4. テスト: 単体テスト、結合テストを実施します\n`;
  advice += `5. レビュー: コードレビューを受け、改善します\n`;
  advice += `6. ドキュメント: 技術仕様書、ユーザーマニュアルを作成します\n\n`;
  advice += `具体的な技術スタックや詳細についてお聞かせいただければ、より詳しくアドバイスできます。`;

  return advice;
}
