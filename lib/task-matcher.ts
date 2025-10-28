/**
 * タスクマッチングロジック
 * ユーザーのスキル・業界経験とタスク要件をマッチングし、最適な割り当てを提案する
 */

type User = {
  id: string;
  name: string;
  email: string;
  skills: string[];
  industries: string[];
  preferences: any;
  agent?: {
    id: string;
    agentBanks: {
      performance: any;
      learningData: any;
    }[];
  } | null;
};

type Task = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  progress: number;
  assignedUserId: string | null;
};

type Project = {
  agent: {
    capabilities: any;
  } | null;
};

export type TaskMatchResult = {
  userId: string;
  userName: string;
  score: number;
  reasoning: string;
  matchedSkills: string[];
  matchedIndustries: string[];
};

/**
 * エージェントの過去実績に基づくボーナススコアを計算
 */
function calculateAgentPerformanceBonus(
  agentBanks: { performance: any; learningData: any }[],
  task: Task
): number {
  if (agentBanks.length === 0) return 0;

  // 平均スコアを計算
  const scores = agentBanks
    .filter(bank => bank.performance?.overallScore !== undefined)
    .map(bank => bank.performance.overallScore);

  if (scores.length === 0) return 0;

  const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;

  // 類似タスクの実績があるかチェック
  const taskType = inferTaskType(task.name);
  const hasSimilarExperience = agentBanks.some(bank => {
    const bankTaskType = bank.learningData?.taskType;
    return bankTaskType && bankTaskType === taskType;
  });

  // ベーススコア (0-15点)
  let bonus = 0;
  if (averageScore >= 90) {
    bonus = 15;
  } else if (averageScore >= 80) {
    bonus = 12;
  } else if (averageScore >= 70) {
    bonus = 8;
  } else {
    bonus = 5;
  }

  // 類似タスクの経験があればボーナス (0-5点)
  if (hasSimilarExperience) {
    bonus += 5;
  }

  return bonus;
}

/**
 * タスク名からタスクタイプを推測
 */
function inferTaskType(taskName: string): string {
  const lowerName = taskName.toLowerCase();
  if (lowerName.includes('設計')) return '設計';
  if (lowerName.includes('実装') || lowerName.includes('開発')) return '実装';
  if (lowerName.includes('テスト')) return 'テスト';
  if (lowerName.includes('デプロイ') || lowerName.includes('リリース')) return 'デプロイ';
  return 'その他';
}

/**
 * タスク名から必要なスキルを推測する
 */
function inferRequiredSkills(taskName: string): string[] {
  const skillMap: Record<string, string[]> = {
    'データベース': ['PostgreSQL', 'データ分析', 'SQL'],
    '認証': ['セキュリティ', 'Node.js', 'Java'],
    'API': ['Node.js', 'FastAPI', 'Java', 'Spring Boot'],
    'UI': ['React', 'UI/UX', 'TypeScript', 'デザインシステム'],
    'フロントエンド': ['React', 'TypeScript', 'UI/UX'],
    'バックエンド': ['Node.js', 'Java', 'Python', 'PostgreSQL'],
    'インフラ': ['AWS', 'Docker', 'Kubernetes', 'インフラ'],
    'セキュリティ': ['セキュリティ', 'コンプライアンス'],
    'AI': ['AI', 'Machine Learning', 'LLM', 'Python'],
    'チャット': ['AI', 'LLM', 'WebSocket', 'リアルタイム通信'],
    '決済': ['セキュリティ', 'コンプライアンス', 'Node.js'],
    'テスト': ['テスト', 'QA', '品質保証'],
    '監査': ['セキュリティ', 'コンプライアンス', '品質保証'],
  };

  const requiredSkills = new Set<string>();
  const lowerTaskName = taskName.toLowerCase();

  for (const [keyword, skills] of Object.entries(skillMap)) {
    if (lowerTaskName.includes(keyword.toLowerCase())) {
      skills.forEach((skill) => requiredSkills.add(skill));
    }
  }

  return Array.from(requiredSkills);
}

/**
 * ユーザーとタスクのマッチングスコアを計算
 */
export function calculateMatchScore(
  user: User,
  task: Task,
  project: Project
): TaskMatchResult {
  let score = 0;
  const matchedSkills: string[] = [];
  const matchedIndustries: string[] = [];
  const reasoningParts: string[] = [];

  // タスク名から必要なスキルを推測
  const requiredSkills = inferRequiredSkills(task.name);

  // プロジェクトの要求スキル
  const projectRequiredSkills = project.agent?.capabilities?.requiredSkills || [];
  const allRequiredSkills = Array.from(
    new Set([...requiredSkills, ...projectRequiredSkills])
  );

  // スキルマッチング (最大50点)
  if (allRequiredSkills.length > 0) {
    const skillMatchCount = user.skills.filter((userSkill) => {
      const matched = allRequiredSkills.some((reqSkill) =>
        userSkill.toLowerCase().includes(reqSkill.toLowerCase()) ||
        reqSkill.toLowerCase().includes(userSkill.toLowerCase())
      );
      if (matched) matchedSkills.push(userSkill);
      return matched;
    }).length;

    const skillScore = Math.min(
      50,
      (skillMatchCount / Math.max(allRequiredSkills.length, 1)) * 50
    );
    score += skillScore;

    if (matchedSkills.length > 0) {
      reasoningParts.push(
        `必要なスキル「${allRequiredSkills.slice(0, 3).join('、')}」に対して、${matchedSkills.slice(0, 3).join('、')}のスキルが一致しています。`
      );
    }
  } else {
    // スキル要件がない場合は基本点を付与
    score += 25;
    if (user.skills.length > 0) {
      matchedSkills.push(...user.skills.slice(0, 2));
      reasoningParts.push(
        `${user.skills.slice(0, 2).join('、')}のスキルを持っており、幅広いタスクに対応可能です。`
      );
    }
  }

  // 業界経験マッチング (最大30点)
  const projectDomain = project.agent?.capabilities?.domain;
  if (projectDomain && user.industries.length > 0) {
    const industryMatch = user.industries.some((industry) => {
      const matched = projectDomain.toLowerCase().includes(industry.toLowerCase()) ||
        industry.toLowerCase().includes(projectDomain.toLowerCase());
      if (matched) matchedIndustries.push(industry);
      return matched;
    });

    if (industryMatch) {
      score += 30;
      reasoningParts.push(
        `${projectDomain}の分野で${matchedIndustries.join('、')}の経験があります。`
      );
    } else {
      score += 10; // 業界は異なるが経験はある
    }
  } else {
    score += 15; // 業界情報がない場合は中間点
  }

  // タスクステータスに基づくボーナス (最大20点)
  if (task.status === 'TODO') {
    score += 20; // 未着手タスクは優先的に割り当て
    reasoningParts.push('このタスクは未着手のため、早期の着手が推奨されます。');
  } else if (task.status === 'IN_PROGRESS') {
    score += 10; // 進行中タスクは引き継ぎ可能
    reasoningParts.push('進行中のタスクの引き継ぎが可能です。');
  }

  // エージェント実績に基づくボーナス (最大20点)
  if (user.agent?.agentBanks && user.agent.agentBanks.length > 0) {
    const performanceBonus = calculateAgentPerformanceBonus(user.agent.agentBanks, task);
    score += performanceBonus;

    if (performanceBonus > 10) {
      reasoningParts.push('過去の実績から、このタスクに適していると判断されます。');
    }
  }

  // スコアを0-100に正規化
  score = Math.min(100, Math.max(0, score));

  // 理由が空の場合のデフォルト
  if (reasoningParts.length === 0) {
    reasoningParts.push('このタスクに対応可能なスキルセットを持っています。');
  }

  return {
    userId: user.id,
    userName: user.name,
    score: Math.round(score),
    reasoning: reasoningParts.join(' '),
    matchedSkills,
    matchedIndustries,
  };
}

/**
 * タスクに対する全ユーザーのマッチングスコアを計算し、上位候補を返す
 */
export function findBestMatches(
  users: User[],
  task: Task,
  project: Project,
  limit: number = 5
): TaskMatchResult[] {
  const results = users.map((user) =>
    calculateMatchScore(user, task, project)
  );

  // スコアの降順でソート
  results.sort((a, b) => b.score - a.score);

  return results.slice(0, limit);
}

/**
 * プロジェクト全体のタスク割り当てを自動で提案
 */
export function suggestTaskAssignments(
  users: User[],
  tasks: Task[],
  project: Project
): Map<string, TaskMatchResult> {
  const assignments = new Map<string, TaskMatchResult>();
  const assignedUsers = new Set<string>();

  // 未割り当てタスクのみを対象
  const unassignedTasks = tasks.filter((task) => !task.assignedUserId);

  // タスクごとに最適なユーザーを割り当て
  for (const task of unassignedTasks) {
    const availableUsers = users.filter((user) => !assignedUsers.has(user.id));

    if (availableUsers.length === 0) {
      // 全ユーザーが割り当て済みの場合は、全ユーザーを対象に再度検索
      const matches = findBestMatches(users, task, project, 1);
      if (matches.length > 0) {
        assignments.set(task.id, matches[0]);
      }
    } else {
      const matches = findBestMatches(availableUsers, task, project, 1);
      if (matches.length > 0) {
        assignments.set(task.id, matches[0]);
        assignedUsers.add(matches[0].userId);
      }
    }
  }

  return assignments;
}
