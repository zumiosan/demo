import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ユーザーエージェントが自動的に全プロジェクトと面接を行う
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { agent: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // すでに面接を受けたプロジェクトを除外
    const existingInterviews = await prisma.interview.findMany({
      where: { userId },
      select: { projectId: true },
    });

    const interviewedProjectIds = existingInterviews.map((i) => i.projectId);

    // 自分がメンバーでないプロジェクトを取得
    const projects = await prisma.project.findMany({
      where: {
        AND: [
          { id: { notIn: interviewedProjectIds } },
          {
            NOT: {
              teamMembers: {
                some: { userId },
              },
            },
          },
        ],
      },
      include: {
        agent: true,
      },
    });

    const results = [];

    // 各プロジェクトと自動面接
    for (const project of projects) {
      const conversationLog = generateAutoInterview(user, project);
      const score = calculateMatchScore(user, project);
      const result = score >= 70 ? 'PASSED' : 'FAILED';

      const interview = await prisma.interview.create({
        data: {
          projectId: project.id,
          userId,
          status: 'COMPLETED',
          result,
          score,
          conversationLog,
        },
      });

      // 合格した場合はオファー作成
      if (result === 'PASSED') {
        await prisma.offer.create({
          data: {
            interviewId: interview.id,
            userId,
            projectId: project.id,
            status: 'PENDING',
          },
        });
      }

      results.push({
        projectId: project.id,
        projectName: project.name,
        result,
        score,
        offerCreated: result === 'PASSED',
      });
    }

    return NextResponse.json({
      success: true,
      interviewsCompleted: results.length,
      results,
    });
  } catch (error) {
    console.error('Failed to auto-interview:', error);
    return NextResponse.json(
      { error: 'Failed to auto-interview' },
      { status: 500 }
    );
  }
}

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
