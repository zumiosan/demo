import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * エージェントバンク一覧取得
 * GET /api/agent-bank?agentId=xxx&projectId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');
    const projectId = searchParams.get('projectId');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where: any = {};
    if (agentId) where.agentId = agentId;
    if (projectId) where.projectId = projectId;

    const banks = await prisma.agentBank.findMany({
      where,
      include: {
        agent: true,
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
      take: limit,
    });

    return NextResponse.json(banks);
  } catch (error) {
    console.error('Failed to fetch agent banks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agent banks' },
      { status: 500 }
    );
  }
}

/**
 * エージェントバンクに登録
 * POST /api/agent-bank
 */
export async function POST(request: NextRequest) {
  try {
    const { agentId, projectId, performance, learningData } = await request.json();

    if (!agentId) {
      return NextResponse.json(
        { error: 'Agent ID is required' },
        { status: 400 }
      );
    }

    const bank = await prisma.agentBank.create({
      data: {
        agentId,
        projectId,
        performance: performance || {},
        learningData: learningData || {},
      },
      include: {
        agent: true,
        project: true,
      },
    });

    return NextResponse.json(bank);
  } catch (error) {
    console.error('Failed to create agent bank:', error);
    return NextResponse.json(
      { error: 'Failed to create agent bank' },
      { status: 500 }
    );
  }
}
