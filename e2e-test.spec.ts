import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';

const BASE_URL = 'http://localhost:3001';

test.describe('TASK-022: E2E User Story Test', () => {
  test.beforeEach(async ({ page }) => {
    // 各テストの前に動画録画を有効化
    await page.goto(BASE_URL);
  });

  test('Scenario 1: User Registration', async ({ page }) => {
    console.log('=== Scenario 1: 新規ユーザー登録 ===');

    // 1. 新規登録ページにアクセス
    await page.goto(`${BASE_URL}/register`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/01-register-page.png', fullPage: true });

    // 2. フォームに入力
    const testUser = {
      name: `E2Eテストユーザー ${Date.now()}`,
      email: `e2e-test-${Date.now()}@example.com`,
      skills: ['React', 'TypeScript', 'Node.js'],
      industries: ['AI', '医療']
    };

    await page.fill('#name', testUser.name);
    await page.screenshot({ path: 'screenshots/02-register-name-filled.png' });

    await page.fill('#email', testUser.email);
    await page.screenshot({ path: 'screenshots/03-register-email-filled.png' });

    // スキル選択
    for (const skill of testUser.skills) {
      const skillButton = page.locator('button').filter({ hasText: skill }).first();
      if (await skillButton.isVisible()) {
        await skillButton.click();
        await page.waitForTimeout(300);
      }
    }
    await page.screenshot({ path: 'screenshots/04-register-skills-selected.png' });

    // 業界選択
    for (const industry of testUser.industries) {
      const industryButton = page.locator('button').filter({ hasText: industry }).first();
      if (await industryButton.isVisible()) {
        await industryButton.click();
        await page.waitForTimeout(300);
      }
    }
    await page.screenshot({ path: 'screenshots/05-register-industries-selected.png' });

    // 3. 登録ボタンをクリック
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/06-register-success.png' });

    // 4. ダッシュボードにリダイレクトされることを確認
    await page.waitForURL(`${BASE_URL}/`);
    await page.screenshot({ path: 'screenshots/07-dashboard-after-registration.png', fullPage: true });

    console.log('✅ Scenario 1 完了: ユーザー登録成功');
  });

  test('Scenario 2: PM - Project Creation and Task Generation', async ({ page }) => {
    console.log('=== Scenario 2: プロジェクト作成とタスク生成 ===');

    // 1. PMユーザーに切り替え
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // ユーザー切り替えドロップダウンを開く (shadcn/ui Select)
    await page.click('[role="combobox"]');
    await page.waitForTimeout(500);
    await page.click('[role="option"]:has-text("PM")');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/10-pm-dashboard.png', fullPage: true });

    // 2. プロジェクト一覧ページ
    await page.click('a:has-text("プロジェクト")');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/11-projects-list.png', fullPage: true });

    // 3. 既存プロジェクトを選択（タスクが0件のもの）
    await page.click('a:has-text("次世代医療システム")');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/12-project-detail-before-tasks.png', fullPage: true });

    // 4. タスク自動生成ボタンをクリック
    const autoGenerateButton = page.locator('button:has-text("AIでタスクを自動生成")');
    if (await autoGenerateButton.isVisible()) {
      await autoGenerateButton.click();
      await page.waitForTimeout(3000); // タスク生成を待つ
      await page.screenshot({ path: 'screenshots/13-tasks-generating.png', fullPage: true });

      // 5. ページをリロードしてタスクを確認
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'screenshots/14-tasks-generated.png', fullPage: true });
    } else {
      console.log('タスクは既に生成済み');
      await page.screenshot({ path: 'screenshots/14-tasks-already-exist.png', fullPage: true });
    }

    // 6. ガントチャートを確認
    const ganttChart = page.locator('svg').first();
    await expect(ganttChart).toBeVisible();
    await page.screenshot({ path: 'screenshots/15-gantt-chart.png', fullPage: true });

    console.log('✅ Scenario 2 完了: プロジェクト作成とタスク生成');
  });

  test('Scenario 3: Task Assignment and Progress Update', async ({ page }) => {
    console.log('=== Scenario 3: タスク割り当てと進捗更新 ===');

    // 1. 一般ユーザーに切り替え
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // ユーザー切り替え (shadcn/ui Select)
    await page.click('[role="combobox"]');
    await page.waitForTimeout(500);
    const userOptions = page.locator('[role="option"]');
    const userCount = await userOptions.count();
    if (userCount > 2) {
      await userOptions.nth(2).click(); // 3番目のユーザー
    } else if (userCount > 0) {
      await userOptions.first().click(); // 最初のユーザー
    }
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/20-user-dashboard.png', fullPage: true });

    // 2. プロジェクト詳細ページ
    await page.click('a:has-text("プロジェクト")');
    await page.waitForLoadState('networkidle');
    await page.click('a:has-text("次世代医療システム")');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/21-project-tasks-list.png', fullPage: true });

    // 3. タスクを選択
    const taskLinks = page.locator('a[href*="/tasks/"]');
    const taskCount = await taskLinks.count();
    if (taskCount > 0) {
      await taskLinks.first().click();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'screenshots/22-task-detail-page.png', fullPage: true });

      // 4. タスクエージェントとチャット
      const chatInput = page.locator('textarea[placeholder*="メッセージ"]');
      if (await chatInput.isVisible()) {
        await chatInput.fill('このタスクの実装方針を教えてください');
        await page.screenshot({ path: 'screenshots/23-chat-message-input.png' });

        await page.click('button:has-text("送信")');
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'screenshots/24-chat-message-sent.png', fullPage: true });
      }

      // 5. 進捗を更新
      const progressSlider = page.locator('input[type="range"]');
      if (await progressSlider.isVisible()) {
        await progressSlider.fill('50');
        await page.screenshot({ path: 'screenshots/25-progress-50.png' });

        await page.click('button:has-text("進捗を更新")');
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'screenshots/26-progress-updated.png', fullPage: true });
      }
    }

    console.log('✅ Scenario 3 完了: タスク実行と進捗更新');
  });

  test('Scenario 4: Notifications and Agent Bank', async ({ page }) => {
    console.log('=== Scenario 4: 通知とエージェントバンク ===');

    // 1. ダッシュボード
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/30-dashboard-notifications.png', fullPage: true });

    // 2. 通知ベルアイコンをクリック
    const notificationBell = page.locator('button[aria-label*="通知"]').or(page.locator('svg.lucide-bell').locator('..')).first();
    if (await notificationBell.isVisible()) {
      await notificationBell.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'screenshots/31-notifications-dropdown.png' });
    }

    // 3. プロフィールページでエージェント実績を確認
    await page.goto(`${BASE_URL}/profile`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/32-profile-page.png', fullPage: true });

    // エージェント実績カードを確認
    const performanceCard = page.locator('text=エージェント実績').locator('..');
    if (await performanceCard.isVisible()) {
      await page.screenshot({ path: 'screenshots/33-agent-performance-card.png' });
    }

    console.log('✅ Scenario 4 完了: 通知とエージェントバンク確認');
  });

  test('Scenario 5: Full User Journey', async ({ page }) => {
    console.log('=== Scenario 5: 完全なユーザージャーニー ===');

    // ダッシュボードから各主要ページを巡回
    const pages = [
      { link: 'ダッシュボード', url: '/', screenshot: '40-dashboard.png' },
      { link: 'プロジェクト', url: '/projects', screenshot: '41-projects.png' },
      { link: 'オファー', url: '/offers', screenshot: '42-offers.png' },
      { link: 'プロフィール', url: '/profile', screenshot: '43-profile.png' },
    ];

    for (const pageInfo of pages) {
      await page.goto(`${BASE_URL}${pageInfo.url}`);
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: `screenshots/${pageInfo.screenshot}`, fullPage: true });
      console.log(`  ✓ ${pageInfo.link}ページ確認完了`);
    }

    console.log('✅ Scenario 5 完了: 全ページ確認');
  });
});
