# Cristal Match Demo - プロジェクト管理ツール

## プロジェクト概要
AIエージェントによるプロジェクトマッチングと管理を支援するデモアプリケーション

## 主要機能

### 1. チーム編成機能（PM視点）
- プロジェクトに適したユーザーを集めてチームを編成
- プロジェクトエージェントとユーザーAIエージェントの面接によるマッチング

### 2. ユーザープロフィール管理（ユーザー視点）
- やりたい仕事情報の登録
- スキル: AI、医療系、銀行系、Java、Pythonなど

### 3. AIエージェント
- **プロジェクトエージェント**: プロジェクトごとに1体（モック実装）
- **ユーザーエージェント**: 各ユーザーに1体専属（モック実装）
- **タスクエージェント**: 各タスクごとに専門エージェント（モック実装）

### 4. エージェント面接機能
- プロジェクトエージェントとユーザーエージェントの会話
- シナリオベース（JSON/YAML）
- 面接会話画面の可視化

### 5. プロジェクト管理機能
- 要件定義書（Markdown）の読み込み
- AIによるタスク自動生成
- WBS作成
- ガントチャート表示

### 6. タスク管理機能
- プロジェクトエージェントによるタスク割り当て
- ユーザー特性に基づく最適な割り当て
- AIエージェントによるタスク実行サポート
- 自動実行可能タスクの実行（モック）

### 7. 進捗管理機能
- リアルタイム進捗更新
- プロジェクトエージェントによる進捗確認
- PMアクティビティのサポート

## 技術スタック

### フロントエンド/バックエンド
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI**: Tailwind CSS + shadcn/ui
- **Charts**: frappe-gantt / react-gantt-chart

### データベース
- **DB**: PostgreSQL
- **ORM**: Prisma
- **Environment**: Docker Compose

### リアルタイム通信
- Server-Sent Events (SSE) または polling

### AI（モック実装）
- シナリオファイル（JSON/YAML形式）
- 将来的に実際のLLM API（Claude API等）との統合を想定

## 開発方針

### 認証
- 簡易的なユーザー選択（ドロップダウン）
- 本格的なログイン機能は不要

### デモデータ
- サンプルプロジェクト要件定義書
- サンプルユーザーデータ
- エージェント面接シナリオ
- サンプルタスクデータ

### 開発環境
- ローカル開発のみ
- Docker Compose でPostgreSQLをセットアップ

## タスク管理

### タスクチケット
- `./doc/tasks/` ディレクトリにタスクごとのチケットを作成
- 各タスク完了時にアプリケーションを起動して動作確認

### 開発フロー
1. タスクチケット確認
2. 実装
3. アプリ起動・動作確認
4. 次のタスクへ

## ディレクトリ構成（予定）

```
cristal-match-demo/
├── src/
│   ├── app/              # Next.js App Router
│   ├── components/       # React コンポーネント
│   ├── lib/             # ユーティリティ、ヘルパー
│   ├── types/           # TypeScript型定義
│   └── data/            # モックデータ、シナリオ
├── prisma/
│   ├── schema.prisma    # Prismaスキーマ
│   └── seed.ts          # シードデータ
├── doc/
│   ├── tasks/           # タスクチケット
│   └── requirements/    # プロジェクト要件定義書（サンプル）
├── docker-compose.yml   # PostgreSQL設定
└── CLAUDE.md           # このファイル
```

## データモデル（概要）

### User（ユーザー）
- id, name, email
- skills (AI, 医療系, 銀行系, Java, Python等)
- preferences（希望職種、稼働時間等）
- agentId (専属AIエージェント)

### Project（プロジェクト）
- id, name, description
- requirementsDoc (Markdown形式)
- agentId (プロジェクトAIエージェント)
- status

### Task（タスク）
- id, projectId, name, description
- assignedUserId
- agentId (タスク専門AIエージェント)
- status, progress
- startDate, endDate

### Agent（AIエージェント）
- id, name, type (project/user/task)
- personality, capabilities

### Interview（面接）
- id, projectId, userId
- scenarioData (JSON)
- status, result

### TeamMember（チームメンバー）
- id, projectId, userId
- role, joinedAt

## 注意事項
- AIエージェントの動作は全てモック実装
- シナリオファイルベースで会話を再現
- 将来的なLLM統合を考慮した設計
- 日本語で会話
