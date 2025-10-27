# TASK-002: データモデル実装

## 目的
Prismaスキーマで全データモデルを定義し、マイグレーションを実行する

## 実装内容

### 1. Prismaスキーマ定義
- [x] User（ユーザー）- スキル、業界、希望条件
- [x] Agent（AIエージェント）- タイプ、性格、能力
- [x] Project（プロジェクト）- 要件定義書、ステータス
- [x] Task（タスク）- 進捗、日程、自動実行フラグ、依存関係
- [x] Interview（面接）- シナリオ、会話ログ、スコア
- [x] TeamMember（チームメンバー）- 役割

### 2. リレーション設定
- [x] User - Agent (1:1)
- [x] Project - Agent (1:1)
- [x] Task - Agent (1:1)
- [x] Project - Task (1:N)
- [x] Project - TeamMember (1:N)
- [x] User - TeamMember (1:N)
- [x] User - Task (1:N) - 割り当て
- [x] Interview - Project, User (N:1)
- [x] Task - Task (自己参照) - 依存関係

### 3. マイグレーション実行
- [x] DB Push成功
- [x] Prisma Client生成成功
- [x] lib/prisma.ts ラッパー作成

## 完了条件
- [x] Prismaスキーマが定義されていること
- [x] マイグレーションが成功すること
- [x] Prisma Clientが生成されること

## 次のタスク
TASK-003: シードデータ作成
