import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * 面接開始（自動面接）
 * POST /api/projects/[id]/interview
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const { userId } = await request.json();

    // プロジェクトとユーザーの存在確認
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        agent: true,
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        agent: true,
      },
    });

    if (!project || !user) {
      return NextResponse.json(
        { error: 'Project or user not found' },
        { status: 404 }
      );
    }

    // 既に面接が存在するか確認
    const existingInterview = await prisma.interview.findFirst({
      where: {
        projectId,
        userId,
      },
    });

    if (existingInterview) {
      return NextResponse.json(
        { error: 'Interview already exists' },
        { status: 400 }
      );
    }

    // 自動面接の実行（モック）
    const conversationLog = generateAutoInterview(user, project);
    const score = calculateMatchScore(user, project);
    const result = score >= 70 ? 'PASSED' : 'FAILED';

    // 面接レコード作成
    const interview = await prisma.interview.create({
      data: {
        projectId,
        userId,
        status: 'COMPLETED',
        result,
        score,
        conversationLog,
      },
    });

    // PASSEDの場合、オファーを作成
    if (result === 'PASSED') {
      await prisma.offer.create({
        data: {
          interviewId: interview.id,
          userId,
          projectId,
          status: 'PENDING',
        },
      });
    }

    return NextResponse.json({
      interview,
      result,
      score,
    });
  } catch (error) {
    console.error('Failed to start interview:', error);
    return NextResponse.json(
      { error: 'Failed to start interview' },
      { status: 500 }
    );
  }
}

/**
 * 自動面接会話の生成（モック）
 */
function generateAutoInterview(user: any, project: any) {
  const userAgent = user.agent?.name || 'ユーザーエージェント';
  const projectAgent = project.agent?.name || 'プロジェクトエージェント';

  const conversation = [
    {
      speaker: projectAgent,
      message: `こんにちは、${user.name}さん。${project.name}プロジェクトのエージェントです。本日は面接のお時間をいただき、ありがとうございます。`,
      timestamp: new Date().toISOString(),
    },
    {
      speaker: userAgent,
      message: `こんにちは。${user.name}さんを代理してお話しさせていただきます。このプロジェクトに大変興味を持っています。`,
      timestamp: new Date().toISOString(),
    },
    {
      speaker: projectAgent,
      message: `まず、${user.name}さんのスキルについてお聞かせください。保有スキルは${user.skills.join('、')}とのことですが、実務経験についてお聞かせいただけますか？`,
      timestamp: new Date().toISOString(),
    },
    {
      speaker: userAgent,
      message: `${user.name}さんは${user.skills.slice(0, 2).join('と')}について豊富な経験を持っています。特に${user.industries.join('、')}の分野での実績があります。`,
      timestamp: new Date().toISOString(),
    },
    {
      speaker: projectAgent,
      message: `素晴らしいですね。このプロジェクトでは${project.requirementsDoc ? '要件定義書に記載の通り、' : ''}様々な技術スキルが必要になります。チームでの協働経験についてはいかがでしょうか？`,
      timestamp: new Date().toISOString(),
    },
    {
      speaker: userAgent,
      message: `${user.name}さんは${user.preferences?.teamSize || '中規模'}のチームでの経験があり、${user.preferences?.workStyle || 'フルタイム'}での勤務が可能です。コミュニケーションを大切にし、チームに貢献することを重視しています。`,
      timestamp: new Date().toISOString(),
    },
    {
      speaker: projectAgent,
      message: `${user.name}さんのスキルセットと経験は、このプロジェクトの要件と非常にマッチしていると判断いたしました。ぜひご参加いただきたいと思います。`,
      timestamp: new Date().toISOString(),
    },
    {
      speaker: userAgent,
      message: `ありがとうございます。${user.name}さんも、このプロジェクトで自身のスキルを活かせることを楽しみにしています。ぜひ参加させていただきたいと思います。`,
      timestamp: new Date().toISOString(),
    },
  ];

  return conversation;
}

/**
 * マッチングスコア計算（モック）
 */
function calculateMatchScore(user: any, project: any): number {
  let score = 50;

  // スキルマッチング（より柔軟に）
  const projectRequirements = project.agent?.capabilities?.requiredSkills || [];
  const userSkills = user.skills || [];

  let skillMatches = 0;
  for (const userSkill of userSkills) {
    for (const reqSkill of projectRequirements) {
      const userSkillLower = userSkill.toLowerCase();
      const reqSkillLower = reqSkill.toLowerCase();

      // 完全一致または部分一致
      if (userSkillLower === reqSkillLower ||
          userSkillLower.includes(reqSkillLower) ||
          reqSkillLower.includes(userSkillLower)) {
        skillMatches++;
        break; // 同じユーザースキルで複数カウントしない
      }
    }
  }
  score += skillMatches * 10;

  // 業界マッチング（より柔軟に）
  const projectDomain = (project.agent?.capabilities?.domain || '').toLowerCase();
  const userIndustries = user.industries || [];

  const industryMatch = userIndustries.some((industry: string) => {
    const industryLower = industry.toLowerCase();
    return projectDomain.includes(industryLower) || industryLower.includes(projectDomain);
  });

  if (industryMatch) {
    score += 20; // 業界マッチは重要なので20点に増加
  }

  // プロジェクトの注目領域とユーザースキルのマッチング
  const projectFocus = project.agent?.capabilities?.focus || [];
  let focusMatches = 0;
  for (const userSkill of userSkills) {
    for (const focus of projectFocus) {
      const userSkillLower = userSkill.toLowerCase();
      const focusLower = focus.toLowerCase();

      if (userSkillLower.includes(focusLower) || focusLower.includes(userSkillLower)) {
        focusMatches++;
        break;
      }
    }
  }
  score += focusMatches * 5;

  return Math.min(100, Math.max(0, score));
}
