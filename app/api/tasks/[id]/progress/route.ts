import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TaskStatus } from '@prisma/client';

/**
 * タスクの進捗を更新
 * PATCH /api/tasks/[id]/progress
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { progress, status } = await request.json();

    // バリデーション
    if (progress !== undefined && (progress < 0 || progress > 100)) {
      return NextResponse.json(
        { error: 'Progress must be between 0 and 100' },
        { status: 400 }
      );
    }

    // タスクの存在確認
    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // 更新データの準備
    const updateData: any = {};

    if (progress !== undefined) {
      updateData.progress = progress;

      // 進捗率に応じてステータスを自動更新
      if (progress === 0 && task.status === 'IN_PROGRESS') {
        updateData.status = TaskStatus.TODO;
      } else if (progress > 0 && progress < 100 && task.status === 'TODO') {
        updateData.status = TaskStatus.IN_PROGRESS;
      } else if (progress === 100) {
        updateData.status = TaskStatus.COMPLETED;
      }
    }

    if (status !== undefined) {
      updateData.status = status;
    }

    // タスクを更新
    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        assignedUser: true,
        project: {
          include: {
            agent: true,
          },
        },
      },
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Failed to update task progress:', error);
    return NextResponse.json(
      { error: 'Failed to update task progress' },
      { status: 500 }
    );
  }
}
