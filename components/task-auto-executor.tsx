'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Loader2, AlertCircle, Bot } from 'lucide-react';

type TaskAutoExecutorProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string;
  taskName: string;
  onCompleted: () => void;
};

type ExecutionStep = {
  step: number;
  total: number;
  description: string;
  result?: string;
  progress: number;
};

type ExecutionStatus = 'idle' | 'running' | 'completed' | 'error';

export function TaskAutoExecutor({
  open,
  onOpenChange,
  taskId,
  taskName,
  onCompleted,
}: TaskAutoExecutorProps) {
  const [status, setStatus] = useState<ExecutionStatus>('idle');
  const [currentProgress, setCurrentProgress] = useState(0);
  const [steps, setSteps] = useState<ExecutionStep[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const startExecution = async () => {
    setStatus('running');
    setCurrentProgress(0);
    setSteps([]);
    setCurrentStep(0);
    setErrorMessage('');

    try {
      const response = await fetch(`/api/tasks/${taskId}/execute`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to start execution');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);

            if (data.type === 'step_start') {
              setCurrentStep(data.step);
              setCurrentProgress(data.progress);
              setSteps(prev => [
                ...prev,
                {
                  step: data.step,
                  total: data.total,
                  description: data.description,
                  progress: data.progress,
                },
              ]);
            } else if (data.type === 'step_complete') {
              setSteps(prev =>
                prev.map(s =>
                  s.step === data.step
                    ? { ...s, result: data.result, progress: data.progress }
                    : s
                )
              );
              setCurrentProgress(data.progress);
            } else if (data.type === 'done') {
              setStatus('completed');
              setCurrentProgress(100);
              onCompleted();
            } else if (data.type === 'error') {
              setStatus('error');
              setErrorMessage(data.error);
            }
          } catch (e) {
            console.error('Failed to parse message:', e);
          }
        }
      }
    } catch (error) {
      console.error('Execution error:', error);
      setStatus('error');
      setErrorMessage('実行中にエラーが発生しました');
    }
  };

  const handleClose = () => {
    if (status === 'running') {
      if (!confirm('実行中です。本当に閉じますか?')) {
        return;
      }
    }
    onOpenChange(false);
    // リセット
    setStatus('idle');
    setCurrentProgress(0);
    setSteps([]);
    setCurrentStep(0);
    setErrorMessage('');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            AI自動実行
          </DialogTitle>
          <DialogDescription>{taskName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* ステータス表示 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {status === 'idle' && (
                <Badge variant="outline">待機中</Badge>
              )}
              {status === 'running' && (
                <Badge className="gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  実行中
                </Badge>
              )}
              {status === 'completed' && (
                <Badge className="gap-1 bg-green-600">
                  <CheckCircle2 className="h-3 w-3" />
                  完了
                </Badge>
              )}
              {status === 'error' && (
                <Badge variant="destructive" className="gap-1">
                  <AlertCircle className="h-3 w-3" />
                  エラー
                </Badge>
              )}
            </div>
            <span className="text-2xl font-bold text-primary">
              {currentProgress}%
            </span>
          </div>

          {/* プログレスバー */}
          <Progress value={currentProgress} className="w-full" />

          {/* エラーメッセージ */}
          {status === 'error' && errorMessage && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
              <p className="font-medium">エラー</p>
              <p className="mt-1">{errorMessage}</p>
            </div>
          )}

          {/* 実行ステップ一覧 */}
          {steps.length > 0 && (
            <div className="space-y-3 mt-6">
              <h4 className="text-sm font-medium">実行ログ</h4>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {steps.map((step) => (
                  <div
                    key={step.step}
                    className={`rounded-lg border p-3 transition-colors ${
                      step.result
                        ? 'bg-green-50 border-green-200'
                        : currentStep === step.step
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {step.result ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      ) : currentStep === step.step ? (
                        <Loader2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0 animate-spin" />
                      ) : (
                        <div className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground">
                            ステップ {step.step}/{step.total}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {step.progress}%
                          </span>
                        </div>
                        <p className="text-sm font-medium mt-1">
                          {step.description}
                        </p>
                        {step.result && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {step.result}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 初期状態の説明 */}
          {status === 'idle' && (
            <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
              <p className="font-medium flex items-center gap-2">
                <Bot className="h-4 w-4" />
                AIによる自動実行
              </p>
              <p className="mt-2">
                このタスクはAIエージェントが自動的に実行できます。
                実行を開始すると、AIがタスクを段階的に処理し、進捗をリアルタイムで表示します。
              </p>
            </div>
          )}

          {/* 完了メッセージ */}
          {status === 'completed' && (
            <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800">
              <p className="font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                実行完了
              </p>
              <p className="mt-2">
                タスクの自動実行が正常に完了しました。
                タスクのステータスが「完了」に更新されました。
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={status === 'running'}
          >
            {status === 'completed' ? '閉じる' : 'キャンセル'}
          </Button>
          {status === 'idle' && (
            <Button type="button" onClick={startExecution}>
              実行開始
            </Button>
          )}
          {status === 'error' && (
            <Button type="button" onClick={startExecution}>
              再試行
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
