import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * エージェントの過去実績を分析
 * GET /api/agent-bank/analyze?agentId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');

    if (!agentId) {
      return NextResponse.json(
        { error: 'Agent ID is required' },
        { status: 400 }
      );
    }

    // エージェントの過去実績を取得
    const banks = await prisma.agentBank.findMany({
      where: { agentId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
      orderBy: {
        registeredAt: 'desc',
      },
    });

    if (banks.length === 0) {
      return NextResponse.json({
        agentId,
        totalProjects: 0,
        averageScore: 0,
        successRate: 0,
        strengths: [],
        weaknesses: [],
        recommendations: ['実績データがまだありません。プロジェクトを完了させると、エージェントの実績が蓄積されます。'],
      });
    }

    // パフォーマンスデータを集計
    const analysis = analyzeAgentPerformance(banks);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Failed to analyze agent bank:', error);
    return NextResponse.json(
      { error: 'Failed to analyze agent bank' },
      { status: 500 }
    );
  }
}

/**
 * エージェントのパフォーマンスを分析
 */
function analyzeAgentPerformance(banks: any[]): any {
  const totalProjects = banks.length;

  // パフォーマンスデータを抽出
  const performances = banks.map(b => b.performance);

  // 成功プロジェクト数（スコア >= 80）
  const successProjects = performances.filter(
    (p: any) => p.overallScore && p.overallScore >= 80
  ).length;

  const successRate = totalProjects > 0 ? (successProjects / totalProjects) * 100 : 0;

  // 平均スコア
  const scores = performances
    .filter((p: any) => p.overallScore !== undefined)
    .map((p: any) => p.overallScore);
  const averageScore = scores.length > 0
    ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length
    : 0;

  // カテゴリ別の平均スコア
  const categoryScores: { [key: string]: number[] } = {};

  performances.forEach((p: any) => {
    if (p.categories) {
      Object.keys(p.categories).forEach(category => {
        if (!categoryScores[category]) {
          categoryScores[category] = [];
        }
        categoryScores[category].push(p.categories[category]);
      });
    }
  });

  // 強み・弱みを抽出
  const categoryAverages: { category: string; score: number }[] = [];
  Object.keys(categoryScores).forEach(category => {
    const avg = categoryScores[category].reduce((a, b) => a + b, 0) / categoryScores[category].length;
    categoryAverages.push({ category, score: avg });
  });

  categoryAverages.sort((a, b) => b.score - a.score);

  const strengths = categoryAverages
    .filter(c => c.score >= 80)
    .map(c => `${c.category}: ${c.score.toFixed(1)}点`);

  const weaknesses = categoryAverages
    .filter(c => c.score < 70)
    .map(c => `${c.category}: ${c.score.toFixed(1)}点`);

  // レコメンデーション生成
  const recommendations = generateRecommendations(
    averageScore,
    successRate,
    strengths,
    weaknesses
  );

  return {
    agentId: banks[0].agentId,
    totalProjects,
    averageScore: Math.round(averageScore * 10) / 10,
    successRate: Math.round(successRate * 10) / 10,
    strengths,
    weaknesses,
    recommendations,
    categoryAverages: categoryAverages.map(c => ({
      category: c.category,
      score: Math.round(c.score * 10) / 10,
    })),
    recentProjects: banks.slice(0, 5).map(b => ({
      projectId: b.project?.id,
      projectName: b.project?.name,
      projectStatus: b.project?.status,
      score: b.performance.overallScore,
      registeredAt: b.registeredAt,
    })),
  };
}

/**
 * レコメンデーションを生成
 */
function generateRecommendations(
  averageScore: number,
  successRate: number,
  strengths: string[],
  weaknesses: string[]
): string[] {
  const recommendations: string[] = [];

  if (averageScore >= 90) {
    recommendations.push('優秀なエージェントです。重要なプロジェクトのリーダー役に適しています。');
  } else if (averageScore >= 80) {
    recommendations.push('安定したパフォーマンスを発揮しています。中規模プロジェクトに適しています。');
  } else if (averageScore >= 70) {
    recommendations.push('標準的なパフォーマンスです。サポート役として活用するのが良いでしょう。');
  } else {
    recommendations.push('改善の余地があります。小規模タスクから始めることをお勧めします。');
  }

  if (successRate >= 80) {
    recommendations.push('高い成功率を誇っています。信頼性の高いエージェントです。');
  } else if (successRate < 50) {
    recommendations.push('成功率が低めです。適切なタスクアサインとサポートが必要です。');
  }

  if (strengths.length > 0) {
    recommendations.push(`強み: ${strengths.slice(0, 3).join(', ')}`);
  }

  if (weaknesses.length > 0) {
    recommendations.push(`改善点: ${weaknesses.slice(0, 2).join(', ')}`);
  }

  return recommendations;
}
