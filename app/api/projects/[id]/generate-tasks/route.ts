import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * AIによる自動タスク分解
 * POST /api/projects/[id]/generate-tasks
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    // プロジェクトの情報を取得
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        agent: true,
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

    // 既存のタスクを確認
    const existingTasks = await prisma.task.findMany({
      where: { projectId },
    });

    if (existingTasks.length > 0) {
      return NextResponse.json(
        { error: 'Tasks already exist for this project' },
        { status: 400 }
      );
    }

    // 要件定義書からタスクを生成
    const tasks = generateTasksFromRequirements(project);

    const tasksWithAutomation = tasks.map((task) => ({
      ...task,
      autoExecutable:
        task.autoExecutable ||
        isAutoExecutableTask(task.name, task.description),
    }));

    // タスクに日付を設定
    const tasksWithDates = assignTaskDates(
      tasksWithAutomation,
      project.startDate,
      project.endDate
    );

    // タスクを一括作成
    const createdTasks = await Promise.all(
      tasksWithDates.map((task) =>
        prisma.task.create({
          data: {
            ...task,
            projectId,
          },
        })
      )
    );

    // 通知を作成
    await createTaskGenerationNotification(project, createdTasks.length);

    return NextResponse.json({
      success: true,
      tasksCreated: createdTasks.length,
      tasks: createdTasks,
    });
  } catch (error) {
    console.error('Failed to generate tasks:', error);
    return NextResponse.json(
      { error: 'Failed to generate tasks' },
      { status: 500 }
    );
  }
}

/**
 * 要件定義書からタスクを生成
 */
function generateTasksFromRequirements(project: any): any[] {
  const projectName = project.name;
  const requirements = project.requirementsDoc || '';
  const capabilities = project.agent?.capabilities;

  // プロジェクトタイプに基づいてタスクのテンプレートを選択
  const tasks: any[] = [];

  // 共通タスク
  tasks.push({
    name: 'プロジェクトキックオフ',
    description: 'チーム全体でプロジェクトの目的、スコープ、スケジュールを確認し、役割分担を決定します。',
    status: 'TODO',
    progress: 0,
    autoExecutable: false,
  });

  tasks.push({
    name: '要件定義の詳細化',
    description: '要件定義書を詳細化し、機能要件・非機能要件を明確にします。ステークホルダーとの確認を含みます。',
    status: 'TODO',
    progress: 0,
    autoExecutable: false,
  });

  // 技術的なタスクをドメインに応じて生成
  if (capabilities?.domain) {
    const domain = capabilities.domain.toLowerCase();

    if (domain.includes('医療') || domain.includes('healthcare')) {
      tasks.push(...generateHealthcareTasks());
    } else if (domain.includes('金融') || domain.includes('bank')) {
      tasks.push(...generateFinanceTasks());
    } else if (domain.includes('ai') || domain.includes('機械学習')) {
      tasks.push(...generateAITasks());
    } else {
      tasks.push(...generateDefaultTasks());
    }
  } else {
    tasks.push(...generateDefaultTasks());
  }

  // フォーカス領域に基づいた追加タスク
  if (capabilities?.focus) {
    const focus = capabilities.focus;

    if (focus.includes('セキュリティ')) {
      tasks.push({
        name: 'セキュリティ要件定義',
        description: 'セキュリティ要件を定義し、脆弱性診断とセキュリティテストの計画を立案します。',
        status: 'TODO',
        progress: 0,
        autoExecutable: false,
      });
    }

    if (focus.includes('UI/UX')) {
      tasks.push({
        name: 'UI/UXデザイン',
        description: 'ワイヤーフレームとデザインモックアップを作成し、ユーザビリティテストを実施します。',
        status: 'TODO',
        progress: 0,
        autoExecutable: false,
      });
    }
  }

  // 完了・デプロイタスク
  tasks.push({
    name: 'テスト実施',
    description: '単体テスト、結合テスト、システムテストを実施し、品質を確保します。',
    status: 'TODO',
    progress: 0,
    autoExecutable: false,
  });

  tasks.push({
    name: 'デプロイとリリース',
    description: '本番環境へのデプロイを実施し、リリース後の監視体制を構築します。',
    status: 'TODO',
    progress: 0,
    autoExecutable: false,
  });

  return tasks;
}

function generateHealthcareTasks(): any[] {
  return [
    {
      name: '患者管理API設計',
      description: '患者情報の登録・更新・削除・検索機能を持つRESTful APIを設計します。',
      status: 'TODO',
      progress: 0,
      autoExecutable: false,
    },
    {
      name: 'データベース設計',
      description: '患者データ、診療記録、予約情報などのデータモデルを設計し、正規化を実施します。',
      status: 'TODO',
      progress: 0,
      autoExecutable: false,
    },
    {
      name: '個人情報保護対応',
      description: 'HIPAA準拠のデータ暗号化と匿名化処理を実装します。',
      status: 'TODO',
      progress: 0,
      autoExecutable: false,
    },
    {
      name: 'フロントエンド実装',
      description: '医療従事者向けのダッシュボードと患者情報管理画面を実装します。',
      status: 'TODO',
      progress: 0,
      autoExecutable: false,
    },
  ];
}

function generateFinanceTasks(): any[] {
  return [
    {
      name: 'API設計とスキーマ定義',
      description: '銀行システムとの連携APIを設計し、OpenAPI仕様書を作成します。',
      status: 'TODO',
      progress: 0,
      autoExecutable: false,
    },
    {
      name: 'マイクロサービスアーキテクチャ設計',
      description: 'サービス間通信、認証・認可、トランザクション管理を設計します。',
      status: 'TODO',
      progress: 0,
      autoExecutable: false,
    },
    {
      name: 'コンプライアンス対応',
      description: '金融規制に準拠したロギング、監査証跡、データ保持ポリシーを実装します。',
      status: 'TODO',
      progress: 0,
      autoExecutable: false,
    },
    {
      name: 'Kubernetes環境構築',
      description: '本番環境のKubernetesクラスタを構築し、CI/CDパイプラインを整備します。',
      status: 'TODO',
      progress: 0,
      autoExecutable: false,
    },
  ];
}

function generateAITasks(): any[] {
  return [
    {
      name: 'データ収集とクレンジング',
      description: '学習用データの収集、前処理、品質チェックを実施します。',
      status: 'TODO',
      progress: 0,
      autoExecutable: false,
    },
    {
      name: 'モデル選定と実験',
      description: '複数のモデルアーキテクチャを比較検証し、最適なモデルを選定します。',
      status: 'TODO',
      progress: 0,
      autoExecutable: false,
    },
    {
      name: 'LLM統合とプロンプトエンジニアリング',
      description: 'LLM APIの統合、プロンプトの最適化、レスポンスの評価を実施します。',
      status: 'TODO',
      progress: 0,
      autoExecutable: false,
    },
    {
      name: 'モデルデプロイとモニタリング',
      description: 'モデルをFastAPIでサービス化し、パフォーマンスモニタリングを構築します。',
      status: 'TODO',
      progress: 0,
      autoExecutable: false,
    },
  ];
}

function generateDefaultTasks(): any[] {
  return [
    {
      name: 'システム設計',
      description: 'システムアーキテクチャ、データフロー、インフラ構成を設計します。',
      status: 'TODO',
      progress: 0,
      autoExecutable: false,
    },
    {
      name: 'データベース設計',
      description: 'データモデルを設計し、ERD、正規化、インデックス設計を実施します。',
      status: 'TODO',
      progress: 0,
      autoExecutable: false,
    },
    {
      name: 'API実装',
      description: 'RESTful APIまたはGraphQL APIを実装し、OpenAPI仕様書を作成します。',
      status: 'TODO',
      progress: 0,
      autoExecutable: false,
    },
    {
      name: 'フロントエンド実装',
      description: 'ユーザーインターフェースを実装し、レスポンシブデザインに対応します。',
      status: 'TODO',
      progress: 0,
      autoExecutable: false,
    },
  ];
}

function isAutoExecutableTask(name: string, description: string): boolean {
  const lowerName = name.toLowerCase();
  const lowerDescription = (description || '').toLowerCase();

  const keywords = [
    'テスト',
    '監査',
    'スキャン',
    'モニタリング',
    'クレンジング',
    'データ収集',
    '最適化',
    '自動',
    '分析',
    '実験',
    '検証',
  ];

  const englishKeywords = [
    'test',
    'qa',
    'audit',
    'scan',
    'monitor',
    'cleanup',
    'cleanse',
    'optimiz',
    'auto',
    'analysis',
    'experiment',
    'validate',
  ];

  const matchesJapanese = keywords.some((keyword) => {
    const lowerKeyword = keyword.toLowerCase();
    return lowerName.includes(lowerKeyword) || lowerDescription.includes(lowerKeyword);
  });

  if (matchesJapanese) {
    return true;
  }

  return englishKeywords.some((keyword) => {
    return lowerName.includes(keyword) || lowerDescription.includes(keyword);
  });
}

async function createTaskGenerationNotification(project: any, taskCount: number) {
  // プロジェクトのPMに通知
  const pmUsers = project.teamMembers
    .filter((tm: any) => tm.user.role === 'PM')
    .map((tm: any) => tm.user);

  if (pmUsers.length === 0) return;

  const notifications = pmUsers.map((pm: any) => ({
    projectId: project.id,
    userId: pm.id,
    title: `タスク自動生成完了: ${project.name}`,
    message: `AIが${taskCount}件のタスクを自動生成しました。確認して必要に応じて調整してください。`,
    type: 'success',
  }));

  await prisma.projectNotification.createMany({
    data: notifications,
  });
}

/**
 * タスクに日付を割り当てる
 */
function assignTaskDates(tasks: any[], projectStartDate: Date | null, projectEndDate: Date | null): any[] {
  // プロジェクトの開始日と終了日を設定
  const startDate = projectStartDate ? new Date(projectStartDate) : new Date();
  const endDate = projectEndDate ? new Date(projectEndDate) : new Date(startDate.getTime() + 90 * 24 * 60 * 60 * 1000); // デフォルト3ヶ月

  // 各タスクに均等に期間を分配
  const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
  const daysPerTask = Math.max(7, Math.floor(totalDays / tasks.length)); // 最低1週間

  return tasks.map((task, index) => {
    const taskStartDate = new Date(startDate.getTime() + index * daysPerTask * 24 * 60 * 60 * 1000);

    // タスクの種類に応じて期間を調整
    let duration = daysPerTask;
    const taskName = task.name.toLowerCase();

    if (taskName.includes('キックオフ') || taskName.includes('要件定義の詳細化')) {
      duration = Math.min(7, daysPerTask); // 1週間程度
    } else if (taskName.includes('テスト') || taskName.includes('デプロイ')) {
      duration = Math.min(14, daysPerTask); // 2週間程度
    } else if (taskName.includes('設計') || taskName.includes('実装')) {
      duration = Math.max(14, daysPerTask); // 2週間以上
    }

    const taskEndDate = new Date(taskStartDate.getTime() + duration * 24 * 60 * 60 * 1000);

    // プロジェクト終了日を超えないように調整
    const finalEndDate = taskEndDate > endDate ? endDate : taskEndDate;

    return {
      ...task,
      startDate: taskStartDate,
      endDate: finalEndDate,
    };
  });
}
