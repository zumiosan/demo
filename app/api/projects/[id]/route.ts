import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        agent: true,
        teamMembers: {
          include: {
            user: {
              include: {
                agent: true,
              },
            },
          },
        },
        tasks: {
          include: {
            assignedUser: true,
            agent: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        interviews: {
          include: {
            user: {
              include: {
                agent: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
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

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}
