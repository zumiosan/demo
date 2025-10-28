'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/components/user-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Sparkles, X } from 'lucide-react';

const AVAILABLE_SKILLS = [
  'React', 'TypeScript', 'Node.js', 'Python', 'Java',
  'PostgreSQL', 'AI', 'Machine Learning', 'LLM',
  'UI/UX', 'デザイン', 'セキュリティ', 'データ分析',
  'FastAPI', 'Spring Boot', 'Kubernetes', 'AWS',
];

const AVAILABLE_INDUSTRIES = [
  '医療系', 'ヘルスケア', '金融', '銀行系',
  'AI', 'テクノロジー', 'データサイエンス',
  'デザイン', 'Eコマース', '教育',
];

export default function RegisterPage() {
  const router = useRouter();
  const { reloadUsers } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // フォーム状態
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'PM' | 'MEMBER'>('MEMBER');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState('');
  const [customIndustry, setCustomIndustry] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          role,
          skills: selectedSkills,
          industries: selectedIndustries,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'ユーザー登録に失敗しました');
      }

      // 成功したらユーザーリストを再読み込みして新しいユーザーに切り替え
      const agentName = data.user?.agent?.name || 'エージェント';
      alert(`${data.message}\nエージェント名: ${agentName}`);

      if (data.user?.id) {
        await reloadUsers(data.user.id);
      }

      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const toggleIndustry = (industry: string) => {
    if (selectedIndustries.includes(industry)) {
      setSelectedIndustries(selectedIndustries.filter(i => i !== industry));
    } else {
      setSelectedIndustries([...selectedIndustries, industry]);
    }
  };

  const addCustomSkill = () => {
    if (customSkill.trim() && !selectedSkills.includes(customSkill.trim())) {
      setSelectedSkills([...selectedSkills, customSkill.trim()]);
      setCustomSkill('');
    }
  };

  const addCustomIndustry = () => {
    if (customIndustry.trim() && !selectedIndustries.includes(customIndustry.trim())) {
      setSelectedIndustries([...selectedIndustries, customIndustry.trim()]);
      setCustomIndustry('');
    }
  };

  const removeSkill = (skill: string) => {
    setSelectedSkills(selectedSkills.filter(s => s !== skill));
  };

  const removeIndustry = (industry: string) => {
    setSelectedIndustries(selectedIndustries.filter(i => i !== industry));
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <UserPlus className="h-6 w-6" />
            新規ユーザー登録
          </CardTitle>
          <CardDescription>
            あなたの情報を入力して、専属AIエージェントを作成しましょう
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
                <Label htmlFor="name">名前 *</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="山田 太郎"
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="email">メールアドレス *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yamada@example.com"
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="role">役割</Label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'PM' | 'MEMBER')}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isLoading}
                >
                  <option value="MEMBER">メンバー</option>
                  <option value="PM">プロジェクトマネージャー</option>
                </select>
              </div>
            </div>

            {/* スキル選択 */}
            <div className="space-y-3">
              <Label>スキル（複数選択可）</Label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_SKILLS.map((skill) => (
                  <Badge
                    key={skill}
                    variant={selectedSkills.includes(skill) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => !isLoading && toggleSkill(skill)}
                  >
                    {skill}
                  </Badge>
                ))}
              </div>

              {/* カスタムスキル追加 */}
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  placeholder="カスタムスキルを追加"
                  disabled={isLoading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomSkill();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addCustomSkill}
                  disabled={isLoading || !customSkill.trim()}
                >
                  追加
                </Button>
              </div>

              {/* 選択されたスキル */}
              {selectedSkills.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-md">
                  {selectedSkills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="gap-1">
                      {skill}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => !isLoading && removeSkill(skill)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* 興味のある業界 */}
            <div className="space-y-3">
              <Label>興味のある業界（複数選択可）</Label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_INDUSTRIES.map((industry) => (
                  <Badge
                    key={industry}
                    variant={selectedIndustries.includes(industry) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => !isLoading && toggleIndustry(industry)}
                  >
                    {industry}
                  </Badge>
                ))}
              </div>

              {/* カスタム業界追加 */}
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={customIndustry}
                  onChange={(e) => setCustomIndustry(e.target.value)}
                  placeholder="カスタム業界を追加"
                  disabled={isLoading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomIndustry();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addCustomIndustry}
                  disabled={isLoading || !customIndustry.trim()}
                >
                  追加
                </Button>
              </div>

              {/* 選択された業界 */}
              {selectedIndustries.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-md">
                  {selectedIndustries.map((industry) => (
                    <Badge key={industry} variant="secondary" className="gap-1">
                      {industry}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => !isLoading && removeIndustry(industry)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* AI エージェント作成の説明 */}
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="font-semibold">専属AIエージェント</span>
              </div>
              <p className="text-sm text-muted-foreground">
                登録すると、あなたのスキルと興味に基づいた専属AIエージェントが自動生成されます。
                エージェントはプロジェクトマッチングや面接サポートを行います。
              </p>
            </div>

            {/* 登録ボタン */}
            <div className="flex gap-3">
              <Button
                type="submit"
                className="flex-1"
                disabled={isLoading || !name || !email}
              >
                {isLoading ? '登録中...' : '登録してエージェントを作成'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/')}
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
