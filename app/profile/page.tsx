'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useUser } from '@/components/user-context';
import { ProfileEditDialog } from '@/components/profile-edit-dialog';
import { AgentPerformanceCard } from '@/components/agent-performance-card';
import { Bot, Mail, Briefcase, Calendar, Crown, Edit, Users } from 'lucide-react';

type UserProfile = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  skills: string[];
  industries: string[];
  preferences: any;
  agent: {
    id: string;
    name: string;
    personality: string | null;
    capabilities: any;
  } | null;
  teamMembers: {
    id: string;
    role: string | null;
    joinedAt: string;
    project: {
      id: string;
      name: string;
      status: string;
    };
  }[];
  assignedTasks: {
    id: string;
    name: string;
    status: string;
    progress: number;
    project: {
      id: string;
      name: string;
    };
  }[];
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

export default function ProfilePage() {
  const { currentUser } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const fetchProfile = async () => {
    if (!currentUser) return;

    try {
      const response = await fetch(`/api/users/${currentUser.id}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [currentUser]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">プロフィールが見つかりません</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            {profile.name}
            <Badge variant={profile.role === 'PM' ? 'default' : 'outline'}>
              {profile.role === 'PM' ? (
                <>
                  <Crown className="h-3 w-3 mr-1" />
                  PM
                </>
              ) : (
                'メンバー'
              )}
            </Badge>
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <Mail className="h-4 w-4" />
            {profile.email}
          </p>
        </div>
        <Button onClick={() => setIsEditDialogOpen(true)} className="gap-2">
          <Edit className="h-4 w-4" />
          プロフィールを編集
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 専属エージェント */}
        {profile.agent && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                専属AIエージェント
              </CardTitle>
              <CardDescription>あなたをサポートするエージェント</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{profile.agent.name}</h3>
                {profile.agent.personality && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {profile.agent.personality}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* スキル */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              スキル
            </CardTitle>
            <CardDescription>保有スキル・技術</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <Badge key={skill} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 興味のある業界 */}
        <Card>
          <CardHeader>
            <CardTitle>興味のある業界</CardTitle>
            <CardDescription>希望する業界・分野</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {profile.industries.map((industry) => (
                <Badge key={industry} variant="outline">
                  {industry}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 希望条件 */}
        {profile.preferences && Object.keys(profile.preferences).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>希望条件</CardTitle>
              <CardDescription>働き方・条件の希望</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2">
                {Object.entries(profile.preferences).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <dt className="text-muted-foreground">{key}:</dt>
                    <dd className="font-medium">
                      {typeof value === 'object'
                        ? JSON.stringify(value)
                        : String(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 参加中のプロジェクト */}
      {profile.teamMembers.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              参加中のプロジェクト
            </CardTitle>
            <CardDescription>
              {profile.teamMembers.length}件のプロジェクトに参加中
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {profile.teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-medium">{member.project.name}</h4>
                    {member.role && (
                      <p className="text-sm text-muted-foreground mt-1">
                        役割: {member.role}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">
                      {statusLabels[member.project.status]}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.location.href = `/projects/${member.project.id}`}
                    >
                      詳細を見る
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 割り当てられたタスク */}
      {profile.assignedTasks.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              割り当てられたタスク
            </CardTitle>
            <CardDescription>
              {profile.assignedTasks.length}件のタスクを担当中
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {profile.assignedTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-medium">{task.name}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      プロジェクト: {task.project.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-medium">{task.progress}%</div>
                      <Badge variant="outline" className="text-xs">
                        {taskStatusLabels[task.status]}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.location.href = `/projects/${task.project.id}`}
                    >
                      詳細を見る
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* エージェント実績分析 */}
      {profile.agent && (
        <div className="mt-6">
          <AgentPerformanceCard
            agentId={profile.agent.id}
            agentName={profile.agent.name}
          />
        </div>
      )}

      {/* プロフィール編集ダイアログ */}
      <ProfileEditDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        user={profile}
        onUpdated={fetchProfile}
      />
    </div>
  );
}
