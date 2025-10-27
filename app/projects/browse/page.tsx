'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/components/user-context';
import Link from 'next/link';

interface Project {
  id: string;
  name: string;
  description: string;
  startDate: string | null;
  endDate: string | null;
  status: string;
  agent: {
    name: string;
    personality: string;
    capabilities: any;
  } | null;
  teamMembers: Array<{
    user: {
      id: string;
      name: string;
    };
  }>;
  tasks: Array<{
    id: string;
    status: string;
  }>;
  interviews?: Array<{
    id: string;
    userId: string;
    status: string;
    result: string | null;
  }>;
}

export default function BrowseProjectsPage() {
  const { currentUser } = useUser();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);

  useEffect(() => {
    fetchAllProjects();
  }, []);

  const fetchAllProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/projects?all=true');
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyInterview = async (projectId: string) => {
    if (!currentUser) {
      alert('ユーザー情報が必要です');
      return;
    }

    try {
      setApplying(projectId);
      const response = await fetch(`/api/projects/${projectId}/interview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: currentUser.id }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.result === 'PASSED') {
          alert(`面接に合格しました！スコア: ${result.score}点\nオファーページで詳細を確認してください。`);
        } else {
          alert(`面接の結果、今回は見送りとなりました。スコア: ${result.score}点`);
        }
        await fetchAllProjects();
      } else {
        const error = await response.json();
        alert(error.error || '面接の申し込みに失敗しました');
      }
    } catch (error) {
      console.error('Failed to apply for interview:', error);
      alert('面接の申し込みに失敗しました');
    } finally {
      setApplying(null);
    }
  };

  const getInterviewStatus = (project: Project) => {
    if (!currentUser || !project.interviews) return null;
    return project.interviews.find((i) => i.userId === currentUser.id);
  };

  const isTeamMember = (project: Project) => {
    if (!currentUser) return false;
    return project.teamMembers.some((tm) => tm.user.id === currentUser.id);
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      PLANNING: 'bg-gray-100 text-gray-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      ON_HOLD: 'bg-yellow-100 text-yellow-800',
    };
    const labels = {
      PLANNING: '計画中',
      IN_PROGRESS: '進行中',
      COMPLETED: '完了',
      ON_HOLD: '保留',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[status as keyof typeof colors]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">プロジェクトを読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">全プロジェクト</h1>
          <p className="mt-2 text-gray-600">
            興味のあるプロジェクトに面接を申し込むことができます
          </p>
          <div className="mt-4 flex gap-4">
            <Link
              href="/projects"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← 参加中のプロジェクト
            </Link>
            <Link
              href="/offers"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              オファー一覧を見る →
            </Link>
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">プロジェクトがありません</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => {
              const interview = getInterviewStatus(project);
              const isMember = isTeamMember(project);
              const completedTasks = project.tasks.filter(
                (t) => t.status === 'COMPLETED'
              ).length;
              const progressPercentage = project.tasks.length > 0
                ? Math.round((completedTasks / project.tasks.length) * 100)
                : 0;

              return (
                <div
                  key={project.id}
                  className="bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h2 className="text-lg font-bold text-gray-900">
                        {project.name}
                      </h2>
                      {getStatusBadge(project.status)}
                    </div>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {project.description}
                    </p>

                    <div className="space-y-2 mb-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">エージェント:</span>
                        <span className="font-medium">
                          {project.agent?.name || 'なし'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">メンバー:</span>
                        <span className="font-medium">
                          {project.teamMembers.length}名
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">タスク:</span>
                        <span className="font-medium">
                          {completedTasks} / {project.tasks.length}
                        </span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>進捗</span>
                        <span>{progressPercentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                    </div>

                    {isMember ? (
                      <Link
                        href={`/projects/${project.id}`}
                        className="block w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-center transition-colors"
                      >
                        参加中 - プロジェクトを見る
                      </Link>
                    ) : interview ? (
                      interview.result === 'PASSED' ? (
                        <Link
                          href="/offers"
                          className="block w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-center transition-colors"
                        >
                          合格 - オファーを確認
                        </Link>
                      ) : interview.result === 'FAILED' ? (
                        <div className="w-full px-4 py-2 bg-gray-300 text-gray-600 rounded-md text-center">
                          面接結果: 不合格
                        </div>
                      ) : (
                        <div className="w-full px-4 py-2 bg-yellow-100 text-yellow-800 rounded-md text-center">
                          面接中...
                        </div>
                      )
                    ) : (
                      <button
                        onClick={() => handleApplyInterview(project.id)}
                        disabled={applying === project.id || !currentUser}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {applying === project.id
                          ? '面接実施中...'
                          : '面接を申し込む'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
