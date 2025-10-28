# TASK-019: リアルタイムプロジェクト進捗通知機能

## 目的
タスクの進捗更新やステータス変更時に、PMにリアルタイムで通知を送信する機能を実装する

## 実装内容

### 1. 通知システムの実装
- [x] タスクステータス変更時の通知生成
- [x] タスク進捗更新時の通知生成（25%以上の変更）
- [x] タスク完了時の通知生成
- [x] プロジェクトの全PMへの通知配信

### 2. 自動通知機能
- [x] タスク進捗更新APIに通知生成ロジックを統合
- [x] 通知タイプの分類（info/warning/error/success）
- [x] 未読/既読管理

### 3. データモデル更新
- [x] ProjectNotification モデル（既存）を活用
- [x] 通知の既読管理

### 4. API実装
- [x] GET /api/notifications?userId=xxx - ユーザーの通知一覧取得
- [x] POST /api/notifications - 通知作成
- [x] PATCH /api/notifications/[id] - 通知を既読にする
- [x] DELETE /api/notifications/[id] - 通知削除
- [x] タスク進捗更新API（/api/tasks/[id]/progress）に通知生成を統合

### 5. UI実装
- [x] ヘッダーに通知ベルアイコン追加
- [x] 未読件数バッジ表示
- [x] 通知ドロップダウン（クリックでプロジェクトへ遷移）
- [x] 通知タイプ別の色分け表示
- [x] 30秒ごとの自動更新

## 完了条件
- [x] タスク進捗・ステータス更新時に通知が生成されること
- [x] PMが通知を受け取れること
- [x] 通知をクリックしてプロジェクトへ遷移できること
- [x] 未読/既読管理ができること

## 実装済みファイル
- `/app/api/notifications/route.ts` - 通知一覧取得・作成API
- `/app/api/notifications/[id]/route.ts` - 通知の既読・削除API
- `/app/api/tasks/[id]/progress/route.ts` - タスク進捗更新API（通知生成ロジック含む）
- `/components/header.tsx` - 通知ベルアイコンとドロップダウンUI

## 次のタスク
TASK-020: AIエージェントバンク機能
