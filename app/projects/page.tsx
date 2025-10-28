'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@/components/user-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bot, Users, CheckSquare, Calendar, Plus } from 'lucide-react';

type Project = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: string;
  agent: {
    id: string;
    name: string;
    personality: string | null;
  } | null;
  _count: {
    tasks: number;
    teamMembers: number;
    interviews: number;
  };
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

export default function ProjectsPage() {
  const { currentUser } = useUser();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      fetch(`/api/projects?userId=${currentUser.id}`)
        .then((res) => res.json())
        .then((data) => {
          setProjects(data);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error('Failed to fetch projects:', error);
          setIsLoading(false);
        });
    }
  }, [currentUser]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">参加中のプロジェクト</h1>
          <p className="text-muted-foreground mt-2">
            あなたが参加しているプロジェクトの一覧
          </p>
          <div className="mt-3 flex gap-4">
            <Link
              href="/projects/browse"
              className="text-sm text-primary hover:underline"
            >
              全プロジェクトを見る →
            </Link>
            <Link
              href="/offers"
              className="text-sm text-primary hover:underline"
            >
              オファー一覧を見る →
            </Link>
          </div>
        </div>
        {currentUser?.role === 'PM' && (
          <Link href="/projects/new">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              新規プロジェクト作成
            </Button>
          </Link>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Link key={project.id} href={`/projects/${project.id}`}>
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <Badge
                    className={statusColors[project.status] || ''}
                    variant="outline"
                  >
                    {statusLabels[project.status] || project.status}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2">
                  {project.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {project.agent && (
                  <div className="flex items-start gap-2 text-sm">
                    <Bot className="h-4 w-4 mt-0.5 text-primary" />
                    <div>
                      <p className="font-medium">{project.agent.name}</p>
                      <p className="text-muted-foreground text-xs line-clamp-2">
                        {project.agent.personality}
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 pt-2 border-t text-sm">
                  <div className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {project._count.teamMembers}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckSquare className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {project._count.tasks}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {project._count.interviews}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {projects.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              まだプロジェクトに参加していません
            </p>
            <Link
              href="/projects/browse"
              className="text-primary hover:underline"
            >
              プロジェクトを探す
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
