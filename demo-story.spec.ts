import { test, expect, Page, Locator } from '@playwright/test';
import { execSync } from 'node:child_process';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

const MEMBER_COUNT = 10;
const DEFAULT_SKILLS = ['React', 'TypeScript', 'AI'];
const DEFAULT_INDUSTRIES = ['AI', '医療系'];
const STEP_DELAY = 600;

test.beforeAll(async () => {
  await resetDatabase();
});

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

    // TOPページ表示
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await delay(page);

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

  const nameInput = page.locator('#name');
  await typeSlow(page, nameInput, user.name);

  const emailInput = page.locator('#email');
  await typeSlow(page, emailInput, user.email);

  const roleSelect = page.locator('#role');
  await bringPointer(page, roleSelect);
  await roleSelect.selectOption(user.role);
  await delay(page);

  const selectBadge = async (label: string) => {
    const badge = page.locator('div.cursor-pointer').filter({ hasText: label }).first();
    if (await badge.isVisible()) {
      await clickWithEffects(page, badge);
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

  const submitButton = page.locator('button[type="submit"]');
  const dialogPromise = page.waitForEvent('dialog').catch(() => null);
  await clickWithEffects(page, submitButton);
  const dialog = await dialogPromise;

  if (dialog) {
    await dialog.accept();
  } else {
    const errorMessage = await page.locator('div.bg-red-50').first().textContent();
    throw new Error(`ユーザー登録に失敗しました: ${errorMessage ?? '原因不明のエラー'}`);
  }

  await page.waitForURL(`${BASE_URL}/`, { timeout: 15000 });
  await page.waitForLoadState('networkidle');
  await delay(page);
}

async function selectUser(page: Page, userName: string) {
  console.log(`[SELECT USER] ${userName}`);
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');
  await delay(page);

  const trigger = page.locator('[role="combobox"]');
  await clickWithEffects(page, trigger);

  const option = page.getByRole('option', { name: userName });
  await clickWithEffects(page, option.first());
  await expect(trigger).toContainText(userName, { timeout: 5000 });
  await delay(page);
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

  await typeSlow(page, page.locator('#name'), projectName);
  await typeSlow(page, page.locator('#description'), 'Playwrightによるデモ録画用のプロジェクトです。');
  await typeSlow(page, page.locator('#requirementsDoc'), requirementsDoc);

  const dialogPromise = page.waitForEvent('dialog').catch(() => null);
  await clickWithEffects(page, page.locator('button:has-text("プロジェクトを作成")'));
  const dialog = await dialogPromise;
  if (dialog) {
    await dialog.accept();
  }

  await page.waitForURL(/\/projects\/[a-zA-Z0-9-]+$/, { timeout: 20000 }).catch(() => null);
  await delay(page);
  const projectUrl = page.url();

  expect(projectUrl).toContain('/projects/');
  console.log(`[PROJECT] 作成完了: ${projectName} (${projectUrl})`);

  return { name: projectName, url: projectUrl };
}

async function runAutoInterviews(page: Page) {
  console.log('[MEMBER] 全プロジェクト面接を自動実行');
  await page.goto(`${BASE_URL}/projects/browse`);
  await page.waitForLoadState('networkidle');
  await delay(page);

  const autoInterviewButton = page.locator('button:has-text("エージェントに全プロジェクトの面接を依頼")');
  await expect(autoInterviewButton).toBeVisible();

  const confirmHandled = new Promise<void>((resolve) => {
    page.once('dialog', (dialog) => {
      dialog.accept();
      resolve();
    });
  });

  await clickWithEffects(page, autoInterviewButton);
  await confirmHandled;

  const alertDialog = await page.waitForEvent('dialog').catch(() => null);
  if (alertDialog) {
    await alertDialog.accept();
  }

  await delay(page);
}

async function openOffersAndAccept(page: Page) {
  console.log('[MEMBER] オファーを確認して承諾');
  await page.goto(`${BASE_URL}/offers`);
  await page.waitForLoadState('networkidle');
  await delay(page);

  const conversationHeading = page.locator('text=AIエージェント会話ログ');
  const headingVisible = await conversationHeading.first().waitFor({ state: 'visible', timeout: 15000 }).then(() => true).catch(() => false);
  if (!headingVisible) {
    console.warn('[WARN] オファーに会話ログが見つかりませんでした。');
  }

  const acceptButton = page.locator('button:has-text("承諾する")').first();
  if (await acceptButton.isVisible()) {
    await clickWithEffects(page, acceptButton);
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
    await clickWithEffects(page, generateButton);
    await confirmHandled;

    const alertDialog = await page.waitForEvent('dialog').catch(() => null);
    if (alertDialog) {
      await alertDialog.accept();
    }

    await page.waitForSelector('button:has-text("AI自動実行")');
    await delay(page);
  } else {
    console.log('[PM] タスクは既に存在します');
  }
}

async function autoAssignTasks(page: Page) {
  console.log('[PM] タスクをAIで自動割り当て');
  await page.locator('div.flex.items-center.justify-between.p-3').first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => null);
  const assignButton = page.locator('button:has-text("AI自動割り当て")');
  await expect(assignButton).toBeVisible({ timeout: 15000 });
  await delay(page);

  await Promise.all([
    page.waitForResponse((response) =>
      response.url().includes('/auto-assign') && response.status() === 200
    ),
    clickWithEffects(page, assignButton),
  ]);

  await page.waitForSelector('span:has-text("担当:")');
  await delay(page);
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
  await delay(page);

  const chatInput = page.locator('input[placeholder*="メッセージ"]');
  await typeSlow(page, chatInput, 'このタスクの進め方についてアドバイスをください。');
  await clickWithEffects(page, chatInput.locator('xpath=ancestor::form[1]//button'));

  // プロジェクト詳細に戻って進捗更新
  console.log('[MEMBER] 進捗を更新');
  await page.goto(projectInfo.url);
  await page.waitForLoadState('networkidle');
  await delay(page);

  const taskCard = page
    .locator('div.flex.items-center.justify-between.p-3')
    .filter({ hasText: assignedTask.assignedTo });

  await expect(taskCard.first()).toBeVisible();
  await clickWithEffects(page, taskCard.first().locator('button:has-text("進捗更新")'));

  const dialog = page.locator('[role="dialog"]').last();
  const slider = dialog.locator('[role="slider"]').first();
  await slider.focus();
  for (let i = 0; i < 12; i += 1) {
    await slider.press('ArrowRight');
  }

  await clickWithEffects(page, dialog.locator('button:has-text("更新")'));
  await dialog.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => null);
  await delay(page);
}

async function talkWithProjectAgent(page: Page) {
  console.log('[PM] プロジェクトエージェントと会話');
  const openButton = page.getByRole('button', { name: 'プロジェクトエージェントとチャット' });
  const closeButton = page.getByRole('button', { name: 'チャットを閉じる' });

  if (!(await closeButton.isVisible())) {
    await clickWithEffects(page, openButton);
    await expect(closeButton).toBeVisible({ timeout: 5000 });
  }

  const agentInput = page.getByPlaceholder('メッセージを入力...');
  const inputField = agentInput.first();
  await expect(inputField).toBeVisible();
  await typeSlow(page, inputField, 'チームの進捗状況を教えてください。');

  await inputField.evaluate((input: HTMLInputElement) => {
    const form = input.closest('form');
    (form?.querySelector('button') as HTMLButtonElement | null)?.click();
  });
  await delay(page, 2);
}

async function runAiAutoExecution(page: Page) {
  console.log('[PM] AI自動実行を開始');
  const autoExecButton = page.locator('button:has-text("AI自動実行")').first();
  await expect(autoExecButton).toBeVisible();
  await clickWithEffects(page, autoExecButton);

  const dialog = page.locator('[role="dialog"]').last();
  await clickWithEffects(page, dialog.locator('button:has-text("実行開始")'));
  await dialog.locator('text=実行完了').waitFor({ timeout: 20_000 });
  await clickWithEffects(page, dialog.locator('button:has-text("閉じる")'));
}

async function resetDatabase() {
  console.log('[DB] Resetting database...');
  execSync('npm run db:reset', { stdio: 'inherit' });
  console.log('[DB] Seeding database with sample data...');
  execSync('npm run seed', { stdio: 'inherit' });
}

async function delay(page: Page, factor = 1) {
  await page.waitForTimeout(STEP_DELAY * factor);
}

async function bringPointer(page: Page, locator: Locator) {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 20 });
  }
  await page.waitForTimeout(120);
}

async function clickWithEffects(page: Page, locator: Locator) {
  await bringPointer(page, locator);
  await locator.click({ delay: 60 });
  await delay(page);
}

async function typeSlow(page: Page, locator: Locator, text: string) {
  await bringPointer(page, locator);
  await locator.click({ clickCount: 3 });
  await locator.fill('');
  await locator.type(text, { delay: 70 });
  await delay(page);
}
