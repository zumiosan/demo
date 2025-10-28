'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/components/user-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FolderPlus } from 'lucide-react';

export default function NewProjectPage() {
  const router = useRouter();
  const { currentUser } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [requirementsDoc, setRequirementsDoc] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // PMユーザーでない場合はアクセス拒否
  if (!currentUser || currentUser.role !== 'PM') {
    return (
      <div className="container mx-auto py-8 px-4 max-w-3xl">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              プロジェクトを作成するにはPM権限が必要です
            </p>
            <Button
              onClick={() => router.push('/projects')}
              className="mt-4"
            >
              プロジェクト一覧に戻る
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
          requirementsDoc,
          startDate: startDate || null,
          endDate: endDate || null,
          creatorId: currentUser.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'プロジェクト作成に失敗しました');
      }

      alert(`プロジェクトが作成されました！\nプロジェクトエージェント: ${data.project.agent.name}`);
      router.push(`/projects/${data.project.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <FolderPlus className="h-6 w-6" />
            新規プロジェクト作成
          </CardTitle>
          <CardDescription>
            プロジェクト情報を入力して、プロジェクトエージェントを作成しましょう
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* エラー表示 */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* 基本情報 */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">プロジェクト名 *</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="医療系AIチャットボット開発"
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="description">プロジェクト概要</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="医療業界向けのAIチャットボットを開発し、患者の問い合わせ対応を自動化します"
                  rows={3}
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="requirementsDoc">要件定義書（Markdown形式）</Label>
                <Textarea
                  id="requirementsDoc"
                  value={requirementsDoc}
                  onChange={(e) => setRequirementsDoc(e.target.value)}
                  placeholder="# プロジェクト要件
## 目的
- 患者からの問い合わせに24時間対応できるチャットボットを開発する

## 主要機能
1. 症状に関する質問応答
2. 予約受付
3. 医療機関情報の提供

## 技術要件
- LLM統合
- データベース: PostgreSQL
- フロントエンド: React
"
                  rows={10}
                  disabled={isLoading}
                  className="font-mono text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">開始予定日</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <Label htmlFor="endDate">完了予定日</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* 登録ボタン */}
            <div className="flex gap-3">
              <Button
                type="submit"
                className="flex-1"
                disabled={isLoading || !name}
              >
                {isLoading ? 'プロジェクト作成中...' : 'プロジェクトを作成'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/projects')}
                disabled={isLoading}
              >
                キャンセル
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
