import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const showAll = searchParams.get('all') === 'true';

    let whereClause = {};

    // Filter to show only projects where user is a team member
    if (userId && !showAll) {
      whereClause = {
        teamMembers: {
          some: {
            userId: userId,
          },
        },
      };
    }

    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        agent: true,
        teamMembers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
        tasks: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        interviews: showAll ? {
          select: {
            id: true,
            userId: true,
            status: true,
            result: true,
          },
        } : false,
        _count: {
          select: {
            tasks: true,
            teamMembers: true,
            interviews: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

/**
 * 新規プロジェクト作成
 * POST /api/projects
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, requirementsDoc, startDate, endDate, creatorId } = body;

    // バリデーション
    if (!name || !creatorId) {
      return NextResponse.json(
        { error: 'プロジェクト名と作成者IDは必須です' },
        { status: 400 }
      );
    }

    // 作成者がPMかどうか確認
    const creator = await prisma.user.findUnique({
      where: { id: creatorId },
    });

    if (!creator || creator.role !== 'PM') {
      return NextResponse.json(
        { error: 'プロジェクトを作成するにはPM権限が必要です' },
        { status: 403 }
      );
    }

    // プロジェクトエージェントを作成
    const agentPersonality = generateProjectAgentPersonality(name, description, requirementsDoc);
    const agentCapabilities = inferProjectCapabilities(name, description, requirementsDoc);

    const agent = await prisma.agent.create({
      data: {
        name: `${name} プロジェクトエージェント`,
        type: 'PROJECT',
        personality: agentPersonality,
        capabilities: agentCapabilities,
      },
    });

    // プロジェクトを作成
    const project = await prisma.project.create({
      data: {
        name,
        description,
        requirementsDoc,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status: 'PLANNING',
        agentId: agent.id,
      },
      include: {
        agent: true,
      },
    });

    // 作成者をPMとしてチームに追加
    await prisma.teamMember.create({
      data: {
        projectId: project.id,
        userId: creatorId,
        role: 'PM',
      },
    });

    return NextResponse.json({
      success: true,
      project,
      message: 'プロジェクトが作成されました',
    });
  } catch (error) {
    console.error('Project creation failed:', error);
    return NextResponse.json(
      { error: 'プロジェクト作成に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * プロジェクトエージェントの性格を生成
 */
function generateProjectAgentPersonality(
  name: string,
  description?: string,
  requirementsDoc?: string
): string {
  let personality = `${name}のプロジェクトを成功に導く専属AIエージェントです。`;

  if (description) {
    personality += ` ${description}`;
  }

  personality += ' チーム全体をサポートし、プロジェクトの目標達成に向けて最適なメンバー配置と進捗管理を行います。';

  return personality;
}

/**
 * プロジェクトの技術領域を推測
 */
function inferProjectCapabilities(
  name: string,
  description?: string,
  requirementsDoc?: string
): any {
  const allText = `${name} ${description || ''} ${requirementsDoc || ''}`.toLowerCase();

  // ドメイン推測
  let domain = '一般';
  if (allText.includes('医療') || allText.includes('healthcare') || allText.includes('health')) {
    domain = '医療系';
  } else if (allText.includes('金融') || allText.includes('銀行') || allText.includes('finance') || allText.includes('bank')) {
    domain = '金融系';
  } else if (allText.includes('ai') || allText.includes('機械学習') || allText.includes('llm') || allText.includes('チャットボット')) {
    domain = 'AI';
  } else if (allText.includes('eコマース') || allText.includes('ec') || allText.includes('ショッピング')) {
    domain = 'Eコマース';
  }

  // 技術スタック推測
  const techStack: string[] = [];
  if (allText.includes('react') || allText.includes('next')) techStack.push('React/Next.js');
  if (allText.includes('typescript')) techStack.push('TypeScript');
  if (allText.includes('python')) techStack.push('Python');
  if (allText.includes('java') || allText.includes('spring')) techStack.push('Java/Spring');
  if (allText.includes('postgresql') || allText.includes('postgres')) techStack.push('PostgreSQL');
  if (allText.includes('fastapi')) techStack.push('FastAPI');
  if (allText.includes('kubernetes') || allText.includes('k8s')) techStack.push('Kubernetes');

  // フォーカスエリア推測
  const focus: string[] = [];
  if (allText.includes('セキュリティ') || allText.includes('security')) focus.push('セキュリティ');
  if (allText.includes('ui') || allText.includes('ux') || allText.includes('デザイン')) focus.push('UI/UX');
  if (allText.includes('api')) focus.push('API開発');
  if (allText.includes('データ分析') || allText.includes('data analysis')) focus.push('データ分析');

  return {
    domain,
    techStack: techStack.length > 0 ? techStack : ['フルスタック'],
    focus: focus.length > 0 ? focus : ['プロジェクト管理'],
  };
}
