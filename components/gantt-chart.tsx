'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

type Task = {
  id: string;
  name: string;
  startDate: Date | null;
  endDate: Date | null;
  status: string;
  progress: number;
};

type GanttChartProps = {
  tasks: Task[];
};

const statusColors: Record<string, string> = {
  TODO: 'bg-gray-300',
  IN_PROGRESS: 'bg-blue-500',
  REVIEW: 'bg-yellow-500',
  COMPLETED: 'bg-green-500',
  CANCELLED: 'bg-red-300',
};

export function GanttChart({ tasks }: GanttChartProps) {
  const { minDate, maxDate, totalDays } = useMemo(() => {
    const validTasks = tasks.filter((t) => t.startDate && t.endDate);
    if (validTasks.length === 0) {
      return { minDate: new Date(), maxDate: new Date(), totalDays: 1 };
    }

    const dates = validTasks.flatMap((t) => [
      t.startDate!.getTime(),
      t.endDate!.getTime(),
    ]);
    const min = new Date(Math.min(...dates));
    const max = new Date(Math.max(...dates));

    // 開始を月初に、終了を月末に調整
    min.setDate(1);
    max.setMonth(max.getMonth() + 1, 0);

    const days = Math.ceil((max.getTime() - min.getTime()) / (1000 * 60 * 60 * 24));
    return { minDate: min, maxDate: max, totalDays: days };
  }, [tasks]);

  const getTaskPosition = (task: Task) => {
    if (!task.startDate || !task.endDate) return null;

    const taskStart = task.startDate.getTime();
    const taskEnd = task.endDate.getTime();
    const chartStart = minDate.getTime();
    const chartEnd = maxDate.getTime();

    const left = ((taskStart - chartStart) / (chartEnd - chartStart)) * 100;
    const width = ((taskEnd - taskStart) / (chartEnd - chartStart)) * 100;

    return { left: `${left}%`, width: `${width}%` };
  };

  const generateMonthHeaders = () => {
    const months = [];
    const current = new Date(minDate);

    while (current <= maxDate) {
      const monthStart = new Date(current);
      const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
      const displayEnd = monthEnd > maxDate ? maxDate : monthEnd;

      const start = Math.max(monthStart.getTime(), minDate.getTime());
      const end = Math.min(displayEnd.getTime(), maxDate.getTime());
      const left = ((start - minDate.getTime()) / (maxDate.getTime() - minDate.getTime())) * 100;
      const width = ((end - start) / (maxDate.getTime() - minDate.getTime())) * 100;

      months.push({
        month: current.toLocaleDateString('ja-JP', { year: 'numeric', month: 'short' }),
        left: `${left}%`,
        width: `${width}%`,
      });

      current.setMonth(current.getMonth() + 1);
    }

    return months;
  };

  const validTasks = tasks.filter((t) => t.startDate && t.endDate);

  if (validTasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>ガントチャート</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            タスクの日程が設定されていません
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>ガントチャート</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          {/* 月ヘッダー */}
          <div className="flex border-b mb-2 pb-2">
            <div className="w-48 flex-shrink-0" />
            <div className="flex-1 relative h-6">
              {generateMonthHeaders().map((month, i) => (
                <div
                  key={i}
                  className="absolute text-xs font-medium text-center"
                  style={{ left: month.left, width: month.width }}
                >
                  {month.month}
                </div>
              ))}
            </div>
          </div>

          {/* タスク行 */}
          <div className="space-y-2">
            {validTasks.map((task) => {
              const position = getTaskPosition(task);
              if (!position) return null;

              return (
                <div key={task.id} className="flex items-center group">
                  <div className="w-48 flex-shrink-0 pr-4">
                    <div className="text-sm font-medium truncate" title={task.name}>
                      {task.name}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {task.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {task.progress}%
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 relative h-8">
                    {/* バックグラウンドグリッド */}
                    <div className="absolute inset-0 border-l border-dashed border-gray-200" />

                    {/* タスクバー */}
                    <div
                      className="absolute h-6 top-1 rounded group-hover:scale-105 transition-transform"
                      style={position}
                    >
                      <div
                        className={`h-full rounded ${statusColors[task.status] || 'bg-gray-400'} opacity-80`}
                      />
                      <div
                        className="absolute top-0 left-0 h-full bg-white opacity-30 rounded"
                        style={{ width: `${100 - task.progress}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white mix-blend-difference">
                        {task.progress}%
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 凡例 */}
          <div className="mt-6 pt-4 border-t flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-300" />
              <span>未着手</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-500" />
              <span>進行中</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500" />
              <span>完了</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
