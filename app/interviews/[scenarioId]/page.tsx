'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Bot, Play, Pause, RotateCcw, CheckCircle, XCircle } from 'lucide-react';

type InterviewMessage = {
  role: 'project_agent' | 'user_agent';
  content: string;
  timestamp: number;
};

type InterviewScenario = {
  scenarioId: string;
  projectName: string;
  userName: string;
  messages: InterviewMessage[];
  result: {
    decision: 'PASSED' | 'FAILED';
    score: number;
    reasoning: string;
  };
};

export default function InterviewDetailPage({
  params,
}: {
  params: Promise<{ scenarioId: string }>;
}) {
  const { scenarioId } = use(params);
  const [scenario, setScenario] = useState<InterviewScenario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    fetch(`/api/scenarios/${scenarioId}`)
      .then((res) => res.json())
      .then((data) => {
        setScenario(data);
        const totalMessages = Array.isArray(data.messages) ? data.messages.length : 0;
        setCurrentMessageIndex(totalMessages > 0 ? totalMessages - 1 : 0);
        setShowResult(true);
        setIsPlaying(false);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Failed to fetch scenario:', error);
        setIsLoading(false);
      });
  }, [scenarioId]);

  useEffect(() => {
    if (!isPlaying || !scenario) return;

    if (currentMessageIndex >= scenario.messages.length) {
      setIsPlaying(false);
      setShowResult(true);
      return;
    }

    const currentMessage = scenario.messages[currentMessageIndex];
    const nextMessage = scenario.messages[currentMessageIndex + 1];

    const delay = nextMessage
      ? nextMessage.timestamp - currentMessage.timestamp
      : 2000;

    const timer = setTimeout(() => {
      setCurrentMessageIndex((prev) => prev + 1);
    }, delay);

    return () => clearTimeout(timer);
  }, [isPlaying, currentMessageIndex, scenario]);

  const handlePlay = () => {
    if (!scenario) return;
    if (currentMessageIndex >= scenario.messages.length - 1) {
      setCurrentMessageIndex(0);
    }
    setShowResult(false);
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentMessageIndex(0);
    setShowResult(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  if (!scenario) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">シナリオが見つかりません</p>
      </div>
    );
  }

  const displayedMessages = scenario.messages.slice(
    0,
    Math.min(currentMessageIndex + 1, scenario.messages.length)
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/interviews">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{scenario.projectName}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            候補者: {scenario.userName}
          </p>
        </div>
      </div>

      {/* コントロールパネル */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                onClick={isPlaying ? handlePause : handlePlay}
                variant="default"
                size="sm"
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    一時停止
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    {currentMessageIndex === 0 ? '開始' : '再開'}
                  </>
                )}
              </Button>
              <Button onClick={handleReset} variant="outline" size="sm">
                <RotateCcw className="h-4 w-4 mr-2" />
                リセット
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              {Math.min(currentMessageIndex + 1, scenario.messages.length)} /{' '}
              {scenario.messages.length} メッセージ
            </div>
          </div>
        </CardContent>
      </Card>

      {/* チャット画面 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            面接会話
          </CardTitle>
          <CardDescription>
            AIエージェント同士がスキルマッチングのための会話を行います
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 min-h-[400px] max-h-[600px] overflow-y-auto">
            {displayedMessages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === 'project_agent' ? 'justify-start' : 'justify-end'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.role === 'project_agent'
                      ? 'bg-blue-100 text-blue-900'
                      : 'bg-green-100 text-green-900'
                  } animate-in slide-in-from-bottom-2 duration-300`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Bot className="h-3.5 w-3.5" />
                    <span className="text-xs font-semibold">
                      {message.role === 'project_agent'
                        ? 'プロジェクトエージェント'
                        : 'ユーザーエージェント'}
                    </span>
                  </div>
                  <p className="text-sm">{message.content}</p>
                </div>
              </div>
            ))}
            {displayedMessages.length === 0 && (
              <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                「開始」ボタンを押して面接を開始してください
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 面接結果 */}
      {showResult && (
        <Card
          className={`border-2 ${
            scenario.result.decision === 'PASSED'
              ? 'border-green-200 bg-green-50'
              : 'border-red-200 bg-red-50'
          } animate-in slide-in-from-bottom-4 duration-500`}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {scenario.result.decision === 'PASSED' ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-green-900">面接結果: 合格</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="text-red-900">面接結果: 不合格</span>
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-1">マッチングスコア</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      scenario.result.decision === 'PASSED'
                        ? 'bg-green-500'
                        : 'bg-red-500'
                    } transition-all duration-1000`}
                    style={{ width: `${scenario.result.score}%` }}
                  />
                </div>
                <Badge
                  variant={
                    scenario.result.decision === 'PASSED' ? 'default' : 'destructive'
                  }
                >
                  {scenario.result.score}点
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">評価理由</p>
              <p
                className={`text-sm ${
                  scenario.result.decision === 'PASSED'
                    ? 'text-green-800'
                    : 'text-red-800'
                }`}
              >
                {scenario.result.reasoning}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
