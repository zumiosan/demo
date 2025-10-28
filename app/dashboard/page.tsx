'use client';

import { useState } from 'react';
import { useUser } from '@/components/user-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, Briefcase, Users, CheckCircle, Crown, Sparkles } from 'lucide-react';

export default function Home() {
  const { currentUser, isLoading } = useUser();
  const [autoInterviewing, setAutoInterviewing] = useState(false);
  const [autoInterviewResult, setAutoInterviewResult] = useState<any>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">ユーザーを選択してください</p>
      </div>
    );
  }

  const handleAutoInterview = async () => {
    if (!currentUser) return;

    try {
      setAutoInterviewing(true);
      setAutoInterviewResult(null);

      const response = await fetch(`/api/users/${currentUser.id}/auto-interview`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setAutoInterviewResult(data);
      } else {
        const error = await response.json();
        alert(error.error || '自動面接に失敗しました');
      }
    } catch (error) {
      console.error('Failed to auto-interview:', error);
      alert('自動面接に失敗しました');
    } finally {
      setAutoInterviewing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">ダッシュボード</h1>
        <p className="text-muted-foreground mt-2">
          AIエージェントによるプロジェクトマッチングと管理
        </p>
      </div>

      {/* ユーザー情報カード */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            ユーザー情報
          </CardTitle>
          <CardDescription>現在選択中のユーザー</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-lg">{currentUser.name}</p>
              {currentUser.role === 'PM' && <Crown className="h-4 w-4 text-yellow-600" />}
              <Badge variant={currentUser.role === 'PM' ? 'default' : 'outline'}>
                {currentUser.role === 'PM' ? 'プロジェクトマネージャー' : 'メンバー'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{currentUser.email}</p>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">スキル</p>
            <div className="flex flex-wrap gap-2">
              {currentUser.skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">興味のある業界</p>
            <div className="flex flex-wrap gap-2">
              {currentUser.industries.map((industry) => (
                <span
                  key={industry}
                  className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800"
                >
                  {industry}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 専属エージェント情報 */}
      {currentUser.agent && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              専属AIエージェント
            </CardTitle>
            <CardDescription>あなたをサポートするAIエージェント</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-semibold text-lg">{currentUser.agent.name}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {currentUser.agent.personality}
              </p>
            </div>
            <div className="pt-3 border-t">
              <button
                onClick={handleAutoInterview}
                disabled={autoInterviewing}
                className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                {autoInterviewing ? '面接実施中...' : 'エージェントに全プロジェクトの面接を依頼'}
              </button>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                AIエージェントが自動的に全プロジェクトと面接を行い、オファーを取得します
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 自動面接結果 */}
      {autoInterviewResult && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <CheckCircle className="h-5 w-5" />
              自動面接完了
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-blue-800">
                {autoInterviewResult.interviewsCompleted}件のプロジェクトと面接を実施しました
              </p>
              <div className="space-y-2">
                {autoInterviewResult.results.map((result: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-md text-sm ${
                      result.result === 'PASSED'
                        ? 'bg-green-100 text-green-900'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{result.projectName}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs">スコア: {result.score}点</span>
                        <Badge
                          variant={result.result === 'PASSED' ? 'default' : 'outline'}
                          className={result.result === 'PASSED' ? 'bg-green-600' : ''}
                        >
                          {result.result === 'PASSED' ? '合格・オファー送信済み' : '不合格'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <a
                href="/offers"
                className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors mt-4"
              >
                オファー一覧を見る
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ステータスカード */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              参加プロジェクト
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">
              現在参加中のプロジェクト
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              完了タスク
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">
              今月完了したタスク
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              面接実施
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">
              実施済みの面接
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
