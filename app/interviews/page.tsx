'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Users, Bot } from 'lucide-react';
import Link from 'next/link';

const demoScenarios = [
  {
    id: 'healthcare-interview-01',
    projectName: '医療ポータルシステム開発',
    userName: '田中 太郎',
    description: '医療系システム開発経験者との面接',
  },
  {
    id: 'banking-interview-01',
    projectName: '銀行API統合プラットフォーム開発',
    userName: '佐藤 花子',
    description: '金融システム開発経験者との面接',
  },
];

export default function InterviewsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">面接</h1>
        <p className="text-muted-foreground mt-2">
          AIエージェント同士の面接シーンを確認できます
        </p>
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <MessageSquare className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">面接機能について</p>
              <p className="text-sm text-blue-700 mt-1">
                プロジェクトAIエージェントとユーザーAIエージェントが会話し、
                スキルマッチングを行います。以下のデモシナリオで面接の様子を確認できます。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {demoScenarios.map((scenario) => (
          <Card key={scenario.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">{scenario.projectName}</CardTitle>
              <CardDescription>{scenario.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{scenario.userName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-muted-foreground" />
                  <span>AIエージェント面接</span>
                </div>
              </div>
              <Link href={`/interviews/${scenario.id}`}>
                <Button className="w-full">面接を見る</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
