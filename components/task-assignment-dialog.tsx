'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bot } from 'lucide-react';

type TaskMatchResult = {
  userId: string;
  userName: string;
  score: number;
  reasoning: string;
  matchedSkills: string[];
  matchedIndustries: string[];
};

type TaskAssignmentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  taskId: string;
  taskName: string;
  onAssigned: () => void;
};

export function TaskAssignmentDialog({
  open,
  onOpenChange,
  projectId,
  taskId,
  taskName,
  onAssigned,
}: TaskAssignmentDialogProps) {
  const [matches, setMatches] = useState<TaskMatchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    if (open) {
      fetchMatches();
    }
  }, [open, projectId, taskId]);

  const fetchMatches = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/tasks/${taskId}/matches`
      );
      const data = await response.json();
      setMatches(data);
    } catch (error) {
      console.error('Failed to fetch matches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssign = async (userId: string) => {
    setIsAssigning(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/tasks/${taskId}/assign`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId }),
        }
      );

      if (response.ok) {
        onAssigned();
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Failed to assign task:', error);
    } finally {
      setIsAssigning(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 60) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (score >= 40) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            タスク割り当て候補
          </DialogTitle>
          <DialogDescription>
            「{taskName}」に最適なメンバーを提案します
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">分析中...</p>
          </div>
        ) : matches.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">候補が見つかりませんでした</p>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((match, index) => (
              <div
                key={match.userId}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold">{match.userName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="outline"
                          className={getScoreColor(match.score)}
                        >
                          マッチ度: {match.score}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleAssign(match.userId)}
                    disabled={isAssigning}
                    size="sm"
                  >
                    {isAssigning ? '割り当て中...' : '割り当て'}
                  </Button>
                </div>

                <div className="pl-11 space-y-2">
                  <div className="text-sm text-muted-foreground">
                    <Bot className="inline h-3 w-3 mr-1" />
                    {match.reasoning}
                  </div>

                  {match.matchedSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {match.matchedSkills.map((skill) => (
                        <span
                          key={skill}
                          className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  {match.matchedIndustries.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {match.matchedIndustries.map((industry) => (
                        <span
                          key={industry}
                          className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-800"
                        >
                          {industry}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
