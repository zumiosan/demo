'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Briefcase, Users, Sparkles, TrendingUp, Shield, Zap } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useUser } from '@/components/user-context';

export default function HomePage() {
  const { currentUser } = useUser();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 space-y-6">
              <div className="flex items-center gap-2">
                <Image src="/logo.png" alt="Cristal Match" width={48} height={48} className="rounded" />
                <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Cristal Match
                </h1>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                AIエージェントが実現する
                <br />
                次世代プロジェクトマッチング
              </p>
              <p className="text-xl text-gray-600">
                あなたのスキルと経験を最大限に活かせるプロジェクトを、
                <br />
                専属AIエージェントが見つけ出します
              </p>
              <div className="flex gap-4">
                {currentUser ? (
                  <Link href="/dashboard">
                    <Button size="lg" className="text-lg px-8">
                      ダッシュボードへ
                    </Button>
                  </Link>
                ) : (
                  <Link href="/register">
                    <Button size="lg" className="text-lg px-8">
                      無料で始める
                    </Button>
                  </Link>
                )}
                <Link href="/projects/browse">
                  <Button size="lg" variant="outline" className="text-lg px-8">
                    プロジェクトを見る
                  </Button>
                </Link>
              </div>
            </div>
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg blur-3xl opacity-20"></div>
                <Card className="relative">
                  <CardContent className="p-8">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                        <Bot className="h-8 w-8 text-blue-600" />
                        <div>
                          <p className="font-semibold">AIエージェントがマッチング</p>
                          <p className="text-sm text-gray-600">あなたに最適なプロジェクトを提案</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                        <Sparkles className="h-8 w-8 text-purple-600" />
                        <div>
                          <p className="font-semibold">自動面接システム</p>
                          <p className="text-sm text-gray-600">エージェント同士が事前に適性を判断</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-pink-50 rounded-lg">
                        <TrendingUp className="h-8 w-8 text-pink-600" />
                        <div>
                          <p className="font-semibold">キャリア成長支援</p>
                          <p className="text-sm text-gray-600">継続的なスキル分析とアドバイス</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">主要機能</h2>
            <p className="text-gray-600">AIエージェントが提供する革新的な機能</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Bot className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle>専属AIエージェント</CardTitle>
                <CardDescription>
                  各ユーザーに1体の専属AIエージェントが付き、スキル・経験・希望を深く理解してサポート
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Users className="h-12 w-12 text-purple-600 mb-4" />
                <CardTitle>自動マッチング</CardTitle>
                <CardDescription>
                  プロジェクトエージェントとユーザーエージェントが面接を行い、最適なマッチングを実現
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Briefcase className="h-12 w-12 text-pink-600 mb-4" />
                <CardTitle>プロジェクト管理</CardTitle>
                <CardDescription>
                  タスク自動生成、進捗管理、チーム編成など、AIがプロジェクト運営を強力にサポート
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Zap className="h-12 w-12 text-yellow-600 mb-4" />
                <CardTitle>リアルタイム通知</CardTitle>
                <CardDescription>
                  オファー、タスク割り当て、進捗状況などをリアルタイムで通知
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Shield className="h-12 w-12 text-green-600 mb-4" />
                <CardTitle>スキル分析</CardTitle>
                <CardDescription>
                  プロジェクト参加履歴から自動でスキルを分析し、成長を可視化
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <TrendingUp className="h-12 w-12 text-indigo-600 mb-4" />
                <CardTitle>キャリア提案</CardTitle>
                <CardDescription>
                  AIが長期的なキャリアパスを考慮し、成長につながるプロジェクトを提案
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">利用の流れ</h2>
            <p className="text-gray-600">簡単3ステップでスタート</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-bold mb-2">登録</h3>
              <p className="text-gray-600">
                スキル、経験、希望する業界・職種を登録。専属AIエージェントが生成されます。
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-bold mb-2">マッチング</h3>
              <p className="text-gray-600">
                AIエージェントが全プロジェクトと自動面接を実施。最適なプロジェクトからオファーが届きます。
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-pink-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-bold mb-2">参加</h3>
              <p className="text-gray-600">
                オファーを承認してプロジェクトに参加。AIがタスク管理やチーム運営をサポートします。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold mb-4">今すぐ始めましょう</h2>
          <p className="text-xl mb-8 opacity-90">
            AIエージェントがあなたのキャリアを次のレベルへ導きます
          </p>
          <div className="flex gap-4 justify-center">
            {currentUser ? (
              <Link href="/dashboard">
                <Button size="lg" variant="secondary" className="text-lg px-8">
                  ダッシュボードへ
                </Button>
              </Link>
            ) : (
              <Link href="/register">
                <Button size="lg" variant="secondary" className="text-lg px-8">
                  無料で登録する
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
