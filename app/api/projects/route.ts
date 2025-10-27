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
