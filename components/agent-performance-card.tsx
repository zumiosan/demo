'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Bot, TrendingUp, Award, AlertCircle } from 'lucide-react';

interface AgentPerformanceProps {
  agentId: string;
  agentName: string;
}

interface PerformanceAnalysis {
  agentId: string;
  totalProjects: number;
  averageScore: number;
  successRate: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  categoryAverages: { category: string; score: number }[];
  recentProjects: {
    projectId: string;
    projectName: string;
    projectStatus: string;
    score: number;
    registeredAt: string;
  }[];
}

export function AgentPerformanceCard({ agentId, agentName }: AgentPerformanceProps) {
  const [analysis, setAnalysis] = useState<PerformanceAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalysis();
  }, [agentId]);

  const fetchAnalysis = async () => {
    try {
      const response = await fetch(`/api/agent-bank/analyze?agentId=${agentId}`);
      if (response.ok) {
        const data = await response.json();
        setAnalysis(data);
      }
    } catch (error) {
      console.error('Failed to fetch agent analysis:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            エージェント実績分析
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">読み込み中...</p>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return null;
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 80) return 'text-blue-600 bg-blue-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 90) return 'bg-green-600';
    if (score >= 80) return 'bg-blue-600';
    if (score >= 70) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          {agentName}の実績分析
        </CardTitle>
        <CardDescription>
          過去のプロジェクトパフォーマンスに基づく分析結果
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 総合スコア */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">総プロジェクト数</p>
            <p className="text-2xl font-bold">{analysis.totalProjects}</p>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">平均スコア</p>
            <div className="flex items-center justify-center gap-2">
              <p className={`text-2xl font-bold ${getScoreColor(analysis.averageScore)}`}>
                {analysis.averageScore}
              </p>
              <span className="text-sm text-muted-foreground">/ 100</span>
            </div>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">成功率</p>
            <div className="flex items-center justify-center gap-2">
              <p className={`text-2xl font-bold ${getScoreColor(analysis.successRate)}`}>
                {analysis.successRate}%
              </p>
            </div>
          </div>
        </div>

        {/* カテゴリ別スコア */}
        {analysis.categoryAverages.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              カテゴリ別評価
            </h3>
            <div className="space-y-2">
              {analysis.categoryAverages.map((cat) => (
                <div key={cat.category} className="flex items-center justify-between">
                  <span className="text-sm">{cat.category}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getScoreBadgeColor(cat.score)}`}
                        style={{ width: `${cat.score}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-12 text-right">
                      {cat.score}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 強み */}
        {analysis.strengths.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Award className="h-4 w-4 text-green-600" />
              強み
            </h3>
            <div className="flex flex-wrap gap-2">
              {analysis.strengths.map((strength, idx) => (
                <Badge key={idx} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {strength}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* 弱み */}
        {analysis.weaknesses.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              改善点
            </h3>
            <div className="flex flex-wrap gap-2">
              {analysis.weaknesses.map((weakness, idx) => (
                <Badge key={idx} variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                  {weakness}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* レコメンデーション */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm">レコメンデーション</h3>
          <ul className="space-y-1">
            {analysis.recommendations.map((rec, idx) => (
              <li key={idx} className="text-sm text-muted-foreground pl-4 relative before:content-['•'] before:absolute before:left-0">
                {rec}
              </li>
            ))}
          </ul>
        </div>

        {/* 最近のプロジェクト */}
        {analysis.recentProjects.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">最近のプロジェクト</h3>
            <div className="space-y-2">
              {analysis.recentProjects.map((project) => (
                <div
                  key={project.projectId}
                  className="flex items-center justify-between p-2 border rounded text-sm"
                >
                  <div className="flex-1">
                    <p className="font-medium">{project.projectName}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(project.registeredAt).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                  {project.score && (
                    <Badge className={getScoreColor(project.score)}>
                      {project.score}点
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
