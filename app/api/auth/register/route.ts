import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * ユーザー登録API
 * POST /api/auth/register
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, skills, industries, role } = body;

    // バリデーション
    if (!name || !email) {
      return NextResponse.json(
        { error: '名前とメールアドレスは必須です' },
        { status: 400 }
      );
    }

    // メールアドレスの重複チェック
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'このメールアドレスは既に登録されています' },
        { status: 400 }
      );
    }

    // ユーザー作成
    const user = await prisma.user.create({
      data: {
        name,
        email,
        role: role || 'MEMBER',
        skills: skills || [],
        industries: industries || [],
        preferences: {},
      },
    });

    // 専属エージェント作成
    const agentPersonality = generateAgentPersonality(name, skills, industries);
    const agentCapabilities = {
      skills: skills || [],
      industries: industries || [],
      focus: inferFocusAreas(skills),
    };

    const agent = await prisma.agent.create({
      data: {
        name: `${name}のエージェント`,
        type: 'USER',
        personality: agentPersonality,
        capabilities: agentCapabilities,
        userId: user.id,
      },
    });

    // エージェント情報を含めてユーザーを再取得
    const userWithAgent = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        agent: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: userWithAgent,
      message: '登録が完了しました。専属AIエージェントが作成されました。',
    });
  } catch (error) {
    console.error('User registration failed:', error);
    return NextResponse.json(
      { error: 'ユーザー登録に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * エージェントの性格を生成
 */
function generateAgentPersonality(
  name: string,
  skills: string[],
  industries: string[]
): string {
  const skillText = skills.length > 0
    ? `${skills.slice(0, 3).join('、')}などのスキル`
    : '幅広いスキル';

  const industryText = industries.length > 0
    ? `${industries[0]}分野`
    : '様々な分野';

  return `${name}さんをサポートする専属AIエージェントです。${skillText}を活かして${industryText}でのキャリア成長をサポートします。`;
}

/**
 * スキルからフォーカスエリアを推測
 */
function inferFocusAreas(skills: string[]): string[] {
  const focusAreas: string[] = [];
  const skillLower = skills.map(s => s.toLowerCase());

  if (skillLower.some(s => s.includes('セキュリティ') || s.includes('security'))) {
    focusAreas.push('セキュリティ');
  }

  if (skillLower.some(s => s.includes('ui') || s.includes('ux') || s.includes('デザイン'))) {
    focusAreas.push('UI/UX');
  }

  if (skillLower.some(s => s.includes('ai') || s.includes('machine learning') || s.includes('llm'))) {
    focusAreas.push('AI/機械学習');
  }

  if (skillLower.some(s => s.includes('データ') || s.includes('分析') || s.includes('data'))) {
    focusAreas.push('データ分析');
  }

  if (skillLower.some(s => s.includes('フロントエンド') || s.includes('react') || s.includes('frontend'))) {
    focusAreas.push('フロントエンド');
  }

  if (skillLower.some(s => s.includes('バックエンド') || s.includes('api') || s.includes('backend'))) {
    focusAreas.push('バックエンド');
  }

  // デフォルト
  if (focusAreas.length === 0) {
    focusAreas.push('フルスタック開発');
  }

  return focusAreas;
}
