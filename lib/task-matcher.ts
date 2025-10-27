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

  // 既に担当しているタスクがある場合は少し減点
  // （実際のアプリではユーザーの現在の負荷を考慮する）
  // これは簡易実装のため省略

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
