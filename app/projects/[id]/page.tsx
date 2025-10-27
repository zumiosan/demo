'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GanttChart } from '@/components/gantt-chart';
import { TaskAssignmentDialog } from '@/components/task-assignment-dialog';
import { TaskProgressUpdater } from '@/components/task-progress-updater';
import { TaskAutoExecutor } from '@/components/task-auto-executor';
import { useUser } from '@/components/user-context';
import { Bot, Users, CheckSquare, ArrowLeft, FileText, Calendar, UserPlus, Sparkles, TrendingUp, Zap } from 'lucide-react';

type ProjectDetail = {
  id: string;
  name: string;
  description: string | null;
  requirementsDoc: string | null;
  status: string;
  createdAt: string;
  agent: {
    id: string;
    name: string;
    type: string;
    personality: string | null;
    capabilities: any;
  } | null;
  teamMembers: {
    id: string;
    role: string | null;
    joinedAt: string;
    user: {
      id: string;
      name: string;
      email: string;
      skills: string[];
      agent: {
        id: string;
        name: string;
      } | null;
    };
  }[];
  tasks: {
    id: string;
    name: string;
    status: string;
    progress: number;
    startDate: string | null;
    endDate: string | null;
    autoExecutable: boolean;
    assignedUser: {
      id: string;
      name: string;
    } | null;
  }[];
  interviews: {
    id: string;
    status: string;
    result: string | null;
    score: number | null;
    createdAt: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }[];
};

const statusColors: Record<string, string> = {
  PLANNING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  RECRUITING: 'bg-blue-100 text-blue-800 border-blue-200',
  IN_PROGRESS: 'bg-green-100 text-green-800 border-green-200',
  COMPLETED: 'bg-gray-100 text-gray-800 border-gray-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
};

const statusLabels: Record<string, string> = {
  PLANNING: '計画中',
  RECRUITING: '募集中',
  IN_PROGRESS: '進行中',
  COMPLETED: '完了',
  CANCELLED: 'キャンセル',
};

const taskStatusLabels: Record<string, string> = {
  TODO: '未着手',
  IN_PROGRESS: '進行中',
  REVIEW: 'レビュー中',
  COMPLETED: '完了',
  CANCELLED: 'キャンセル',
};

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { currentUser } = useUser();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showRequirements, setShowRequirements] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedTaskForProgress, setSelectedTaskForProgress] = useState<{
    id: string;
    name: string;
    progress: number;
    status: string;
  } | null>(null);
  const [selectedTaskForAutoExec, setSelectedTaskForAutoExec] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isAutoAssigning, setIsAutoAssigning] = useState(false);

  // PMかどうかを判定
  const isPM = currentUser?.role === 'PM';

  const fetchProject = () => {
    fetch(`/api/projects/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setProject(data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Failed to fetch project:', error);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchProject();
  }, [id]);

  const handleAutoAssign = async () => {
    setIsAutoAssigning(true);
    try {
      const response = await fetch(`/api/projects/${id}/auto-assign`, {
        method: 'POST',
      });
      if (response.ok) {
        fetchProject();
      }
    } catch (error) {
      console.error('Failed to auto-assign:', error);
    } finally {
      setIsAutoAssigning(false);
    }
  };

  const handleTaskAssigned = () => {
    fetchProject();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">プロジェクトが見つかりません</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/projects">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            <Badge
              className={statusColors[project.status] || ''}
              variant="outline"
            >
              {statusLabels[project.status] || project.status}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-2">{project.description}</p>
        </div>
      </div>

      {/* プロジェクトエージェント */}
      {project.agent && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              プロジェクトAIエージェント
            </CardTitle>
            <CardDescription>このプロジェクトを管理するAIエージェント</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-semibold text-lg">{project.agent.name}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {project.agent.personality}
              </p>
            </div>
            {project.agent.capabilities && (
              <div className="pt-3 border-t">
                <p className="text-sm font-medium mb-2">専門分野・重視事項</p>
                <div className="text-sm text-muted-foreground">
                  {project.agent.capabilities.domain && (
                    <p>領域: {project.agent.capabilities.domain}</p>
                  )}
                  {project.agent.capabilities.focus && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {project.agent.capabilities.focus.map((item: string) => (
                        <Badge key={item} variant="secondary">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* チームメンバー */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            チームメンバー ({project.teamMembers.length})
          </CardTitle>
          <CardDescription>このプロジェクトに参加しているメンバー</CardDescription>
        </CardHeader>
        <CardContent>
          {project.teamMembers.length > 0 ? (
            <div className="space-y-4">
              {project.teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-start justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{member.user.name}</p>
                      {member.role && (
                        <Badge variant="secondary">{member.role}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {member.user.email}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {member.user.skills.map((skill) => (
                        <span
                          key={skill}
                          className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                    {member.user.agent && (
                      <p className="text-xs text-muted-foreground mt-2">
                        専属エージェント: {member.user.agent.name}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              まだメンバーが参加していません
            </p>
          )}
        </CardContent>
      </Card>

      {/* タスク */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5" />
                タスク ({project.tasks.length})
              </CardTitle>
              <CardDescription>プロジェクトのタスク一覧</CardDescription>
            </div>
            {isPM && (
              <Button
                onClick={handleAutoAssign}
                disabled={isAutoAssigning}
                variant="outline"
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                {isAutoAssigning ? '割り当て中...' : 'AI自動割り当て'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {project.tasks.length > 0 ? (
            <div className="space-y-3">
              {project.tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium">{task.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {taskStatusLabels[task.status] || task.status}
                      </Badge>
                      {task.assignedUser ? (
                        <span className="text-xs text-muted-foreground">
                          担当: {task.assignedUser.name}
                        </span>
                      ) : (
                        <span className="text-xs text-yellow-600">
                          未割り当て
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-muted-foreground">
                      {task.progress}%
                    </div>
                    {task.assignedUser && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedTaskForProgress({
                          id: task.id,
                          name: task.name,
                          progress: task.progress,
                          status: task.status,
                        })}
                        className="gap-1"
                      >
                        <TrendingUp className="h-3 w-3" />
                        進捗更新
                      </Button>
                    )}
                    {task.autoExecutable && task.status !== 'COMPLETED' && isPM && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => setSelectedTaskForAutoExec({
                          id: task.id,
                          name: task.name,
                        })}
                        className="gap-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                      >
                        <Zap className="h-3 w-3" />
                        AI自動実行
                      </Button>
                    )}
                    {!task.assignedUser && isPM && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedTaskId(task.id)}
                        className="gap-1"
                      >
                        <UserPlus className="h-3 w-3" />
                        割り当て
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              タスクがまだ作成されていません
            </p>
          )}
        </CardContent>
      </Card>

      {/* ガントチャート */}
      {project.tasks.length > 0 && (
        <GanttChart
          tasks={project.tasks.map((task) => ({
            ...task,
            startDate: task.startDate ? new Date(task.startDate) : null,
            endDate: task.endDate ? new Date(task.endDate) : null,
          }))}
        />
      )}

      {/* 要件定義書 */}
      {project.requirementsDoc && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                要件定義書
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRequirements(!showRequirements)}
              >
                {showRequirements ? '閉じる' : '表示'}
              </Button>
            </div>
          </CardHeader>
          {showRequirements && (
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg">
                  {project.requirementsDoc}
                </pre>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* タスク割り当てダイアログ */}
      {selectedTaskId && (
        <TaskAssignmentDialog
          open={!!selectedTaskId}
          onOpenChange={(open) => !open && setSelectedTaskId(null)}
          projectId={id}
          taskId={selectedTaskId}
          taskName={
            project.tasks.find((t) => t.id === selectedTaskId)?.name || ''
          }
          onAssigned={handleTaskAssigned}
        />
      )}

      {/* タスク進捗更新ダイアログ */}
      {selectedTaskForProgress && (
        <TaskProgressUpdater
          open={!!selectedTaskForProgress}
          onOpenChange={(open) => !open && setSelectedTaskForProgress(null)}
          taskId={selectedTaskForProgress.id}
          taskName={selectedTaskForProgress.name}
          currentProgress={selectedTaskForProgress.progress}
          currentStatus={selectedTaskForProgress.status}
          onUpdated={fetchProject}
        />
      )}

      {/* AI自動実行ダイアログ */}
      {selectedTaskForAutoExec && (
        <TaskAutoExecutor
          open={!!selectedTaskForAutoExec}
          onOpenChange={(open) => !open && setSelectedTaskForAutoExec(null)}
          taskId={selectedTaskForAutoExec.id}
          taskName={selectedTaskForAutoExec.name}
          onCompleted={fetchProject}
        />
      )}
    </div>
  );
}
