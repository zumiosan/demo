'use client';

import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, Circle } from 'lucide-react';

type TaskProgressUpdaterProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string;
  taskName: string;
  currentProgress: number;
  currentStatus: string;
  onUpdated: () => void;
};

const statusIcons = {
  TODO: <Circle className="h-4 w-4" />,
  IN_PROGRESS: <Clock className="h-4 w-4" />,
  COMPLETED: <CheckCircle2 className="h-4 w-4" />,
};

const statusLabels = {
  TODO: '未着手',
  IN_PROGRESS: '進行中',
  COMPLETED: '完了',
  REVIEW: 'レビュー中',
  CANCELLED: 'キャンセル',
};

export function TaskProgressUpdater({
  open,
  onOpenChange,
  taskId,
  taskName,
  currentProgress,
  currentStatus,
  onUpdated,
}: TaskProgressUpdaterProps) {
  const [progress, setProgress] = useState(currentProgress);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}/progress`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ progress }),
      });

      if (response.ok) {
        onUpdated();
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Failed to update progress:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // 進捗率から予想されるステータス
  const expectedStatus = progress === 0 ? 'TODO' :
                         progress === 100 ? 'COMPLETED' : 'IN_PROGRESS';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>進捗を更新</DialogTitle>
          <DialogDescription>{taskName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">現在のステータス</label>
              <Badge variant="outline" className="gap-1">
                {statusIcons[currentStatus as keyof typeof statusIcons]}
                {statusLabels[currentStatus as keyof typeof statusLabels] || currentStatus}
              </Badge>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">進捗率</label>
              <span className="text-2xl font-bold text-primary">{progress}%</span>
            </div>

            <Slider
              value={[progress]}
              onValueChange={(value) => setProgress(value[0])}
              max={100}
              step={5}
              className="w-full"
            />

            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {expectedStatus !== currentStatus && (
            <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
              <p className="font-medium">ステータスも自動更新されます</p>
              <p className="mt-1">
                {statusLabels[currentStatus as keyof typeof statusLabels]} → {statusLabels[expectedStatus as keyof typeof statusLabels]}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isUpdating}
          >
            キャンセル
          </Button>
          <Button
            type="button"
            onClick={handleUpdate}
            disabled={isUpdating || progress === currentProgress}
          >
            {isUpdating ? '更新中...' : '更新'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
