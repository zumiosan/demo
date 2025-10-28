import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

const MEMBER_COUNT = 10;
const DEFAULT_SKILLS = ['React', 'TypeScript', 'AI'];
const DEFAULT_INDUSTRIES = ['AI', '医療系'];

type Role = 'PM' | 'MEMBER';

type RegisteredUser = {
  name: string;
  email: string;
  role: Role;
};

type ProjectInfo = {
  name: string;
  url: string;
};

type AssignedTaskInfo = {
  taskName: string;
  taskUrl: string;
  assignedTo: string;
} | null;

test.describe('デモストーリ再現用シナリオ', () => {
  test.setTimeout(10 * 60 * 1000);

  test('PMとメンバーによるエンドツーエンドデモ', async ({ page }) => {
    page.setDefaultTimeout(20000);
    page.setDefaultNavigationTimeout(45000);

    const timestamp = Date.now();

    const pmUser: RegisteredUser = {
      name: `PM 太郎 ${timestamp}`,
      email: `pm-${timestamp}@example.com`,
      role: 'PM',
    };

    const memberUsers: RegisteredUser[] = Array.from({ length: MEMBER_COUNT }, (_, index) => ({
      name: `メンバー ${index + 1} 花子 ${timestamp}`,
      email: `member-${index + 1}-${timestamp}@example.com`,
      role: 'MEMBER',
    }));

    // PMユーザーを登録
    await registerUser(page, pmUser);

    // プロジェクトを作成
    const projectInfo = await createProject(page, pmUser, timestamp);
    await generateTasksIfNeeded(page);

    // メンバーを順次登録
    for (const member of memberUsers) {
      await registerUser(page, member);
    }

    // 各メンバーで自動面接→オファー確認→承諾
    for (const member of memberUsers) {
      await selectUser(page, member.name);
      await runAutoInterviews(page);
      await openOffersAndAccept(page);
    }

    // PMでタスク自動生成と自動割り当て
    await selectUser(page, pmUser.name);
    await page.goto(projectInfo.url);
    await generateTasksIfNeeded(page);
    await autoAssignTasks(page);
    const assignedTask = await getFirstAssignedTask(page);

    // 担当タスクが見つからなかった場合はテスト継続不能なので明示
    expect(assignedTask).not.toBeNull();

    const assignedMemberName = assignedTask?.assignedTo ?? memberUsers[0].name;
    const targetMember =
      memberUsers.find((member) => member.name === assignedMemberName) ?? memberUsers[0];

    // 担当メンバーとしてタスクを確認し、エージェントと会話＆進捗更新
    await selectUser(page, targetMember.name);
    await viewProjectAndInteractWithTask(page, projectInfo, assignedTask);

    // PMとしてプロジェクトエージェントと会話し、タスクを自動実行
    await selectUser(page, pmUser.name);
    await page.goto(projectInfo.url);
    await talkWithProjectAgent(page);
    await runAiAutoExecution(page);
  });
});

async function registerUser(page: Page, user: RegisteredUser) {
  console.log(`[REGISTER] ${user.role} - ${user.name}`);
  await page.goto(`${BASE_URL}/register`);
  await page.waitForLoadState('networkidle');

  await page.fill('#name', user.name);
  await page.fill('#email', user.email);
  await page.selectOption('#role', user.role);

  const selectBadge = async (label: string) => {
    const badge = page.locator('div.cursor-pointer').filter({ hasText: label }).first();
    if (await badge.isVisible()) {
      await badge.click();
      await page.waitForTimeout(150);
    } else {
      console.warn(`[WARN] "${label}" のバッジが見つかりませんでした`);
    }
  };

  for (const skill of DEFAULT_SKILLS) {
    await selectBadge(skill);
  }

  for (const industry of DEFAULT_INDUSTRIES) {
    await selectBadge(industry);
  }

  const dialogPromise = page.waitForEvent('dialog').catch(() => null);
  await page.click('button[type="submit"]', { noWaitAfter: true });
  const dialog = await dialogPromise;

  if (dialog) {
    await dialog.accept();
  } else {
    const errorMessage = await page.locator('div.bg-red-50').first().textContent();
    throw new Error(`ユーザー登録に失敗しました: ${errorMessage ?? '原因不明のエラー'}`);
  }

  await page.waitForURL(`${BASE_URL}/`, { timeout: 15000 });
  await page.waitForLoadState('networkidle');
}

async function selectUser(page: Page, userName: string) {
  console.log(`[SELECT USER] ${userName}`);
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');

  const trigger = page.locator('[role="combobox"]');
  await trigger.click();

  const option = page.getByRole('option', { name: userName });
  await option.first().click();
  await expect(trigger).toContainText(userName, { timeout: 5000 });
  await page.waitForTimeout(300);
}

async function createProject(page: Page, pmUser: RegisteredUser, timestamp: number): Promise<ProjectInfo> {
  console.log('[PROJECT] 新規プロジェクト作成');
  await selectUser(page, pmUser.name);
  await page.goto(`${BASE_URL}/projects/new`);
  await page.waitForLoadState('networkidle');

  const projectName = `AI医療デモプロジェクト ${timestamp}`;
  const requirementsDoc = `# デモプロジェクト要件

- AIによる問診支援
- 医療データの可視化
- セキュリティとプライバシーの確保`;

  await page.fill('#name', projectName);
  await page.fill('#description', 'Playwrightによるデモ録画用のプロジェクトです。');
  await page.fill('#requirementsDoc', requirementsDoc);

  const dialogPromise = page.waitForEvent('dialog').catch(() => null);
  await page.click('button:has-text("プロジェクトを作成")', { noWaitAfter: true });
  const dialog = await dialogPromise;
  if (dialog) {
    await dialog.accept();
  }

  await page.waitForURL(/\/projects\/[a-zA-Z0-9-]+$/, { timeout: 20000 }).catch(() => null);
  await page.waitForTimeout(1000);
  const projectUrl = page.url();

  expect(projectUrl).toContain('/projects/');
  console.log(`[PROJECT] 作成完了: ${projectName} (${projectUrl})`);

  return { name: projectName, url: projectUrl };
}

async function runAutoInterviews(page: Page) {
  console.log('[MEMBER] 全プロジェクト面接を自動実行');
  await page.goto(`${BASE_URL}/projects/browse`);
  await page.waitForLoadState('networkidle');

  const autoInterviewButton = page.locator('button:has-text("エージェントに全プロジェクトの面接を依頼")');
  await expect(autoInterviewButton).toBeVisible();

  const confirmHandled = new Promise<void>((resolve) => {
    page.once('dialog', (dialog) => {
      dialog.accept();
      resolve();
    });
  });

  await autoInterviewButton.click();
  await confirmHandled;

  const alertDialog = await page.waitForEvent('dialog');
  await alertDialog.accept();

  await page.waitForTimeout(500);
}

async function openOffersAndAccept(page: Page) {
  console.log('[MEMBER] オファーを確認して承諾');
  await page.goto(`${BASE_URL}/offers`);
  await page.waitForLoadState('networkidle');

  const conversationHeading = page.locator('text=AIエージェント会話ログ');
  const headingVisible = await conversationHeading.first().waitFor({ state: 'visible', timeout: 15000 }).then(() => true).catch(() => false);
  if (!headingVisible) {
    console.warn('[WARN] オファーに会話ログが見つかりませんでした。');
  }

  const acceptButton = page.locator('button:has-text("承諾する")').first();
  if (await acceptButton.isVisible()) {
    await acceptButton.click();
    await page.waitForTimeout(500);
  }
}

async function generateTasksIfNeeded(page: Page) {
  const generateButton = page.locator('button:has-text("AIでタスクを自動生成")');
  if (await generateButton.isVisible()) {
    console.log('[PM] タスクを自動生成');
    const confirmHandled = new Promise<void>((resolve) => {
      page.once('dialog', (dialog) => {
        dialog.accept();
        resolve();
      });
    });
    await generateButton.click();
    await confirmHandled;

    const alertDialog = await page.waitForEvent('dialog');
    await alertDialog.accept();

    await page.waitForSelector('button:has-text("AI自動実行")');
  } else {
    console.log('[PM] タスクは既に存在します');
  }
}

async function autoAssignTasks(page: Page) {
  console.log('[PM] タスクをAIで自動割り当て');
  await page.locator('div.flex.items-center.justify-between.p-3').first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => null);
  const assignButton = page.locator('button:has-text("AI自動割り当て")');
  await expect(assignButton).toBeVisible({ timeout: 15000 });

  await Promise.all([
    page.waitForResponse((response) =>
      response.url().includes('/auto-assign') && response.status() === 200
    ),
    assignButton.click(),
  ]);

  await page.waitForSelector('span:has-text("担当:")');
}

async function getFirstAssignedTask(page: Page): Promise<AssignedTaskInfo> {
  return page.evaluate(() => {
    const cards = Array.from(
      document.querySelectorAll<HTMLDivElement>('div.flex.items-center.justify-between.p-3')
    );

    for (const card of cards) {
      const assignedSpan = card.querySelector<HTMLSpanElement>('span');
      if (assignedSpan && assignedSpan.textContent?.includes('担当:')) {
        const assignedTo = assignedSpan.textContent.replace('担当:', '').trim();
        const link = card.querySelector<HTMLAnchorElement>('a[href*="/tasks/"]');
        if (link) {
          return {
            taskName: link.textContent?.trim() ?? '',
            taskUrl: link.getAttribute('href') ?? '',
            assignedTo,
          };
        }
      }
    }
    return null;
  });
}

async function viewProjectAndInteractWithTask(
  page: Page,
  projectInfo: ProjectInfo,
  assignedTask: AssignedTaskInfo
) {
  if (!assignedTask) return;

  console.log(`[MEMBER] タスク「${assignedTask.taskName}」でエージェントと会話`);
  await page.goto(`${BASE_URL}${assignedTask.taskUrl}`);
  await page.waitForLoadState('networkidle');

  const chatInput = page.locator('input[placeholder*="メッセージ"]');
  await chatInput.fill('このタスクの進め方についてアドバイスをください。');
  await page.click('button:has-text("送信")');
  await page.waitForTimeout(1500);

  // プロジェクト詳細に戻って進捗更新
  console.log('[MEMBER] 進捗を更新');
  await page.goto(projectInfo.url);
  await page.waitForLoadState('networkidle');

  const taskCard = page
    .locator('div.flex.items-center.justify-between.p-3')
    .filter({ hasText: assignedTask.assignedTo });

  await expect(taskCard.first()).toBeVisible();
  await taskCard.first().locator('button:has-text("進捗更新")').click();

  const dialog = page.locator('[role="dialog"]').last();
  const slider = dialog.locator('[role="slider"]').first();
  await slider.focus();
  for (let i = 0; i < 12; i += 1) {
    await slider.press('ArrowRight');
  }

  await dialog.locator('button:has-text("更新")').click();
  await dialog.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => null);
  await page.waitForTimeout(1000);
}

async function talkWithProjectAgent(page: Page) {
  console.log('[PM] プロジェクトエージェントと会話');
  const openButton = page.getByRole('button', { name: 'プロジェクトエージェントとチャット' });
  const closeButton = page.getByRole('button', { name: 'チャットを閉じる' });

  if (!(await closeButton.isVisible())) {
    await openButton.scrollIntoViewIfNeeded();
    await openButton.click();
    await expect(closeButton).toBeVisible({ timeout: 5000 });
  }

  const agentInput = page.getByPlaceholder('メッセージを入力...');
  const inputField = agentInput.first();
  await expect(inputField).toBeVisible();
  await inputField.fill('チームの進捗状況を教えてください。');

  await inputField.evaluate((input: HTMLInputElement) => {
    const form = input.closest('form');
    (form?.querySelector('button') as HTMLButtonElement | null)?.click();
  });
  await page.waitForTimeout(1500);
}

async function runAiAutoExecution(page: Page) {
  console.log('[PM] AI自動実行を開始');
  const autoExecButton = page.locator('button:has-text("AI自動実行")').first();
  await expect(autoExecButton).toBeVisible();
  await autoExecButton.click();

  const dialog = page.locator('[role="dialog"]').last();
  await dialog.locator('button:has-text("実行開始")').click();
  await dialog.locator('text=実行完了').waitFor({ timeout: 20_000 });
  await dialog.locator('button:has-text("閉じる")').click();
}
