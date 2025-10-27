import { PrismaClient, AgentType, ProjectStatus, UserRole } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // クリーンアップ
  console.log('🧹 Cleaning up existing data...');
  await prisma.interview.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.user.deleteMany();

  // ユーザーとエージェントの作成
  console.log('👥 Creating users and their agents...');

  const users = [
    // PMユーザー（3名）
    {
      name: '木村 健一',
      email: 'kimura@example.com',
      role: UserRole.PM,
      skills: ['プロジェクトマネジメント', 'アジャイル', 'スクラム', '医療系'],
      industries: ['医療系', 'ヘルスケア'],
      preferences: {
        workStyle: 'フルタイム',
        experience: '10年以上'
      },
      agentName: 'PMAdvisor',
      agentPersonality: 'プロジェクト全体を俯瞰し、チームを成功に導く経験豊富なアドバイザー'
    },
    {
      name: '松本 美紀',
      email: 'matsumoto@example.com',
      role: UserRole.PM,
      skills: ['プロジェクトマネジメント', 'リスク管理', '銀行系', 'コンプライアンス'],
      industries: ['金融', '銀行系'],
      preferences: {
        workStyle: 'フルタイム',
        experience: '15年以上'
      },
      agentName: 'FinancePMAdvisor',
      agentPersonality: '金融業界の経験を活かし、堅実なプロジェクト運営をサポート'
    },
    {
      name: '小林 拓也',
      email: 'kobayashi@example.com',
      role: UserRole.PM,
      skills: ['プロジェクトマネジメント', 'AI', 'プロダクトマネジメント'],
      industries: ['AI', 'テクノロジー'],
      preferences: {
        workStyle: 'フルタイム',
        experience: '8年以上'
      },
      agentName: 'AIPMAdvisor',
      agentPersonality: 'AI技術とビジネスをつなぐ、革新的なプロジェクト推進をサポート'
    },
    // メンバーユーザー（8名）
    {
      name: '田中 太郎',
      email: 'tanaka@example.com',
      role: UserRole.MEMBER,
      skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', '医療系'],
      industries: ['医療系', 'ヘルスケア'],
      preferences: {
        workStyle: 'フルタイム',
        remote: true,
        teamSize: '中規模(10-30人)'
      },
      agentName: 'TechAdvisor',
      agentPersonality: '技術的な視点で最適なプロジェクトを提案する、論理的で頼れるアドバイザー'
    },
    {
      name: '佐藤 花子',
      email: 'sato@example.com',
      role: UserRole.MEMBER,
      skills: ['Java', 'Spring Boot', 'Kubernetes', 'Kafka', '銀行系'],
      industries: ['金融', '銀行系'],
      preferences: {
        workStyle: 'フルタイム',
        remote: true,
        expertise: 'マイクロサービス'
      },
      agentName: 'CareerNavigator',
      agentPersonality: 'キャリアの長期的な成長を重視し、適切な挑戦を提案する戦略的アドバイザー'
    },
    {
      name: '鈴木 一郎',
      email: 'suzuki@example.com',
      role: UserRole.MEMBER,
      skills: ['Python', 'AI', 'Machine Learning', 'LLM', 'FastAPI'],
      industries: ['AI', 'テクノロジー'],
      preferences: {
        workStyle: 'フルタイム',
        interests: ['自然言語処理', 'チャットボット']
      },
      agentName: 'AICareerCoach',
      agentPersonality: '最先端技術への挑戦を後押しする、革新的で前向きなコーチ'
    },
    {
      name: '高橋 美咲',
      email: 'takahashi@example.com',
      role: UserRole.MEMBER,
      skills: ['React', 'UI/UX', 'デザインシステム', 'Figma', 'TypeScript'],
      industries: ['テクノロジー', 'デザイン'],
      preferences: {
        workStyle: 'フルタイム',
        focus: 'ユーザー体験'
      },
      agentName: 'DesignAdvisor',
      agentPersonality: 'ユーザー中心の開発を重視し、美しく使いやすいプロダクト作りをサポート'
    },
    {
      name: '山田 健太',
      email: 'yamada@example.com',
      role: UserRole.MEMBER,
      skills: ['Python', 'データ分析', 'PostgreSQL', 'BI', '医療系'],
      industries: ['医療系', 'データサイエンス'],
      preferences: {
        workStyle: 'フルタイム',
        interests: ['医療データ分析']
      },
      agentName: 'DataInsightAdvisor',
      agentPersonality: 'データに基づいた意思決定をサポートする、分析的で洞察力のあるアドバイザー'
    },
    {
      name: '伊藤 結衣',
      email: 'ito@example.com',
      role: UserRole.MEMBER,
      skills: ['Java', 'セキュリティ', 'PostgreSQL', '銀行系', 'コンプライアンス'],
      industries: ['金融', '銀行系'],
      preferences: {
        workStyle: 'フルタイム',
        expertise: 'セキュリティ'
      },
      agentName: 'SecurityAdvisor',
      agentPersonality: 'セキュリティとコンプライアンスを最優先し、安全なシステム構築を支援'
    },
    {
      name: '渡辺 翔太',
      email: 'watanabe@example.com',
      role: UserRole.MEMBER,
      skills: ['Python', 'AWS', 'Docker', 'Kubernetes', 'インフラ'],
      industries: ['テクノロジー', 'クラウド'],
      preferences: {
        workStyle: 'フルタイム',
        expertise: 'DevOps'
      },
      agentName: 'InfraAdvisor',
      agentPersonality: 'スケーラブルで信頼性の高いインフラ構築をサポートする実践的アドバイザー'
    },
    {
      name: '中村 愛',
      email: 'nakamura@example.com',
      role: UserRole.MEMBER,
      skills: ['Python', 'AI', 'ベクトルDB', 'LangChain', 'FastAPI'],
      industries: ['AI', 'テクノロジー'],
      preferences: {
        workStyle: 'フルタイム',
        interests: ['LLMアプリケーション']
      },
      agentName: 'AIEngineerAdvisor',
      agentPersonality: 'AI技術の実用化を推進し、革新的なソリューション開発をサポート'
    }
  ];

  const createdUsers: any[] = [];
  for (const userData of users) {
    const user = await prisma.user.create({
      data: {
        name: userData.name,
        email: userData.email,
        role: userData.role,
        skills: userData.skills,
        industries: userData.industries,
        preferences: userData.preferences,
        agent: {
          create: {
            name: userData.agentName,
            type: AgentType.USER,
            personality: userData.agentPersonality,
            capabilities: {
              skills: userData.skills,
              focus: userData.preferences
            }
          }
        }
      },
      include: {
        agent: true
      }
    });
    createdUsers.push(user);
    const roleLabel = user.role === UserRole.PM ? '[PM]' : '[メンバー]';
    console.log(`  ✓ Created user: ${user.name} ${roleLabel} with agent: ${user.agent?.name}`);
  }

  // プロジェクトとプロジェクトエージェントの作成
  console.log('📁 Creating projects and their agents...');

  // 医療ポータルプロジェクト
  const healthcareDoc = fs.readFileSync(
    path.join(__dirname, '../doc/requirements/healthcare-portal.md'),
    'utf-8'
  );

  const healthcareProject = await prisma.project.create({
    data: {
      name: '医療ポータルシステム開発',
      description: '患者と医療機関をつなぐオンライン医療ポータルシステムの開発',
      requirementsDoc: healthcareDoc,
      status: ProjectStatus.RECRUITING,
      agent: {
        create: {
          name: 'MediCare Assistant',
          type: AgentType.PROJECT,
          personality: '医療分野の専門知識を持ち、患者の安全とデータセキュリティを最優先する責任感の強いプロジェクトマネージャー',
          capabilities: {
            domain: '医療系システム',
            focus: ['セキュリティ', '個人情報保護', 'UI/UX', 'リアルタイム通信'],
            requiredSkills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', '医療系']
          }
        }
      }
    },
    include: {
      agent: true
    }
  });
  console.log(`  ✓ Created project: ${healthcareProject.name}`);

  // 銀行APIプロジェクト
  const bankingDoc = fs.readFileSync(
    path.join(__dirname, '../doc/requirements/banking-api.md'),
    'utf-8'
  );

  const bankingProject = await prisma.project.create({
    data: {
      name: '銀行API統合プラットフォーム開発',
      description: '複数の銀行システムと連携するAPI統合プラットフォームの開発',
      requirementsDoc: bankingDoc,
      status: ProjectStatus.RECRUITING,
      agent: {
        create: {
          name: 'BankTech Assistant',
          type: AgentType.PROJECT,
          personality: '金融規制とセキュリティに精通し、高可用性システムの構築を重視する厳格なプロジェクトマネージャー',
          capabilities: {
            domain: '金融システム',
            focus: ['セキュリティ', 'コンプライアンス', 'マイクロサービス', '高可用性'],
            requiredSkills: ['Java', 'Spring Boot', 'Kubernetes', 'PostgreSQL', '銀行系']
          }
        }
      }
    },
    include: {
      agent: true
    }
  });
  console.log(`  ✓ Created project: ${bankingProject.name}`);

  // AIチャットボットプロジェクト
  const aiChatbotDoc = fs.readFileSync(
    path.join(__dirname, '../doc/requirements/ai-chatbot.md'),
    'utf-8'
  );

  const aiProject = await prisma.project.create({
    data: {
      name: 'AIカスタマーサポートチャットボット開発',
      description: '自然言語処理を活用した企業向けカスタマーサポートチャットボット',
      requirementsDoc: aiChatbotDoc,
      status: ProjectStatus.PLANNING,
      agent: {
        create: {
          name: 'AI Innovation Assistant',
          type: AgentType.PROJECT,
          personality: '最新のAI技術を追求し、ユーザー体験の向上を重視する革新的なプロジェクトマネージャー',
          capabilities: {
            domain: 'AI/機械学習',
            focus: ['LLM', '自然言語処理', 'UI/UX', 'スケーラビリティ'],
            requiredSkills: ['Python', 'AI', 'LLM', 'FastAPI', 'React']
          }
        }
      }
    },
    include: {
      agent: true
    }
  });
  console.log(`  ✓ Created project: ${aiProject.name}`);

  // タスクの作成
  console.log('📋 Creating tasks...');

  // ユーザーを取得
  const allUsers = await prisma.user.findMany();
  const tanaka = allUsers.find(u => u.email === 'tanaka@example.com');
  const sato = allUsers.find(u => u.email === 'sato@example.com');
  const yamada = allUsers.find(u => u.email === 'yamada@example.com');
  const ito = allUsers.find(u => u.email === 'ito@example.com');

  // 医療ポータルプロジェクトのタスク
  const healthcareTasks = [
    { name: '要件定義・設計', days: 14, progress: 100, assignedUserId: tanaka?.id, autoExecutable: false },
    { name: 'データベース設計', days: 7, progress: 100, assignedUserId: yamada?.id, autoExecutable: false },
    { name: 'ユーザー認証機能開発', days: 10, progress: 80, assignedUserId: ito?.id, autoExecutable: false },
    { name: 'オンライン予約システム開発', days: 14, progress: 60, assignedUserId: tanaka?.id, autoExecutable: false },
    { name: '電子カルテ連携API開発', days: 14, progress: 40, assignedUserId: yamada?.id, autoExecutable: false },
    { name: 'オンライン診療機能開発', days: 21, progress: 20, assignedUserId: null, autoExecutable: false },
    { name: '決済システム統合', days: 10, progress: 0, assignedUserId: null, autoExecutable: false },
    { name: 'セキュリティ監査', days: 7, progress: 0, assignedUserId: null, autoExecutable: true },
    { name: 'テスト・品質保証', days: 14, progress: 0, assignedUserId: null, autoExecutable: true },
  ];

  let startDate = new Date('2025-01-06');
  for (const [index, taskData] of healthcareTasks.entries()) {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + taskData.days);

    const status = taskData.progress === 100 ? 'COMPLETED' :
                   taskData.progress > 0 ? 'IN_PROGRESS' : 'TODO';

    await prisma.task.create({
      data: {
        name: taskData.name,
        description: `${healthcareProject.name}の${taskData.name}`,
        status,
        progress: taskData.progress,
        startDate,
        endDate,
        projectId: healthcareProject.id,
        assignedUserId: taskData.assignedUserId,
        autoExecutable: taskData.autoExecutable,
      },
    });

    startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() + 1);
  }
  console.log(`  ✓ Created ${healthcareTasks.length} tasks for ${healthcareProject.name}`);

  // チームメンバーの追加
  console.log('👥 Creating team members...');

  // PMユーザーを取得
  const kimura = createdUsers.find(u => u.email === 'kimura@example.com');
  const matsumoto = createdUsers.find(u => u.email === 'matsumoto@example.com');
  const kobayashi = createdUsers.find(u => u.email === 'kobayashi@example.com');

  // 医療ポータルプロジェクト: PM + 4名のメンバー
  const healthcareMembers = [
    { userId: kimura!.id, role: 'プロジェクトマネージャー' },
    { userId: tanaka!.id, role: 'フロントエンドエンジニア' },
    { userId: yamada!.id, role: 'データエンジニア' },
    { userId: ito!.id, role: 'バックエンド・セキュリティエンジニア' },
    { userId: createdUsers.find(u => u.email === 'takahashi@example.com')!.id, role: 'UI/UXデザイナー' },
  ];

  for (const member of healthcareMembers) {
    await prisma.teamMember.create({
      data: {
        projectId: healthcareProject.id,
        userId: member.userId,
        role: member.role,
      },
    });
  }
  console.log(`  ✓ Added ${healthcareMembers.length} team members to ${healthcareProject.name}`);

  // 銀行APIプロジェクト: PM + 3名のメンバー
  const bankingMembers = [
    { userId: matsumoto!.id, role: 'プロジェクトマネージャー' },
    { userId: sato!.id, role: 'バックエンドエンジニア' },
    { userId: ito!.id, role: 'セキュリティエンジニア' },
    { userId: createdUsers.find(u => u.email === 'watanabe@example.com')!.id, role: 'インフラエンジニア' },
  ];

  for (const member of bankingMembers) {
    await prisma.teamMember.create({
      data: {
        projectId: bankingProject.id,
        userId: member.userId,
        role: member.role,
      },
    });
  }
  console.log(`  ✓ Added ${bankingMembers.length} team members to ${bankingProject.name}`);

  // AIチャットボットプロジェクト: PM + 3名のメンバー
  const aiMembers = [
    { userId: kobayashi!.id, role: 'プロジェクトマネージャー' },
    { userId: createdUsers.find(u => u.email === 'suzuki@example.com')!.id, role: 'AI/MLエンジニア' },
    { userId: createdUsers.find(u => u.email === 'nakamura@example.com')!.id, role: 'AIエンジニア' },
    { userId: tanaka!.id, role: 'フロントエンドエンジニア' },
  ];

  for (const member of aiMembers) {
    await prisma.teamMember.create({
      data: {
        projectId: aiProject.id,
        userId: member.userId,
        role: member.role,
      },
    });
  }
  console.log(`  ✓ Added ${aiMembers.length} team members to ${aiProject.name}`);

  console.log('✅ Seeding completed successfully!');
  console.log(`
Summary:
  - Users: ${users.length} (PM: 3, Member: 8)
  - User Agents: ${users.length}
  - Projects: 3
  - Project Agents: 3
  - Team Members: ${healthcareMembers.length + bankingMembers.length + aiMembers.length}
  - Tasks: ${healthcareTasks.length}
  `);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
