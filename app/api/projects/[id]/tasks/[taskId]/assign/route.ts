import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * タスクをユーザーに割り当てる
 * POST /api/projects/[id]/tasks/[taskId]/assign
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const { id: projectId, taskId } = await params;
    const { userId } = await request.json();

    // タスクの存在確認
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: true,
      },
    });

    if (!task || task.projectId !== projectId) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // ユーザーの存在確認
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // タスクを割り当て
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        assignedUserId: userId,
      },
      include: {
        assignedUser: true,
      },
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Failed to assign task:', error);
    return NextResponse.json(
      { error: 'Failed to assign task' },
      { status: 500 }
    );
  }
}

/**
 * タスクの割り当てを解除する
 * DELETE /api/projects/[id]/tasks/[taskId]/assign
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const { id: projectId, taskId } = await params;

    // タスクの存在確認
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task || task.projectId !== projectId) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // タスクの割り当てを解除
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        assignedUserId: null,
      },
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Failed to unassign task:', error);
    return NextResponse.json(
      { error: 'Failed to unassign task' },
      { status: 500 }
    );
  }
}
