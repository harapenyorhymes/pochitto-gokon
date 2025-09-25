# 08. LINE通知機能

## 概要
マッチング成立時やその他の重要なイベント時にLINE経由で通知を送信する機能を実装する。

## 作業内容

### LINE Messaging API設定
- [x] LINE Messaging APIの有効化
- [x] Webhookエンドポイントの設定
- [x] アクセストークンの管理
- [ ] LINE友達追加の導線設計（次フェーズ）

### 通知システム基盤
- [x] 通知送信ライブラリ (lib/line-notify.ts)
- [x] 通知テンプレート管理
- [x] 通知送信キュー（基本実装）
- [x] エラーハンドリング・リトライ機能

### 通知イベント実装
- [x] マッチング成立通知
- [ ] チャットルーム作成通知（次フェーズ）
- [ ] 新しいメッセージ通知（次フェーズ）
- [ ] イベント前日リマインド（将来実装）

### LINE友達追加フロー
- [ ] LINE友達追加QRコード表示（次フェーズ）
- [x] LINE連携確認画面
- [x] 連携成功・失敗処理
- [x] 連携解除機能

### 通知設定機能
- [x] 通知設定ページ (app/settings/notifications/page.tsx)
- [x] 通知種別のON/OFF切り替え
- [ ] 通知時間の設定（次フェーズ）
- [ ] 通知音・バイブレーション設定（次フェーズ）

### Webhookハンドリング
- [x] LINE Webhook受信エンドポイント (api/webhooks/line)
- [x] 友達追加イベント処理
- [ ] メッセージ受信処理（将来実装）
- [x] ブロック・友達削除イベント処理

## 完了条件
- マッチング成立時にLINE通知が送信される
- ユーザーが通知設定を変更できる
- LINE友達追加・連携が正常に動作する
- Webhookが適切に処理される
- エラーケースが適切にハンドリングされる

## 通知メッセージテンプレート

### マッチング成立通知
```
🎉 合コンが成立しました！

📅 日程: {date} {time}
📍 エリア: 名古屋栄
👥 参加者: {memberCount}名

チャットルームが作成されました。
メンバーと交流して当日を楽しみにしてくださいね！

📱 チャットを開く: {chatUrl}
```

### チャットルーム作成通知
```
💬 チャットルームが作成されました

合コンメンバーとの交流を始めましょう！
自己紹介や当日の話をして盛り上がってください。

📱 チャットを開く: {chatUrl}
```

## データ構造

### notifications テーブル
- id (UUID)
- user_id (FK to users)
- type ('match_success' | 'chat_created' | 'reminder')
- title (string)
- message (text)
- sent_at (timestamp)
- status ('pending' | 'sent' | 'failed')

### notification_settings テーブル
- id (UUID)
- user_id (FK to users)
- match_notifications (boolean)
- chat_notifications (boolean)
- reminder_notifications (boolean)
- line_connected (boolean)

## API設計

### 通知API
- POST /api/notifications/send - 通知送信
- GET /api/notifications - 通知履歴取得
- PUT /api/notifications/settings - 通知設定更新

### LINE連携API
- POST /api/line/connect - LINE連携開始
- DELETE /api/line/disconnect - LINE連携解除
- GET /api/line/status - 連携状態確認

### Webhook API
- POST /api/webhooks/line - LINE Webhook受信

## セキュリティ要件
- Webhook署名検証
- APIアクセス制限
- 個人情報の適切な取り扱い
- 通知内容の暗号化

## 注意事項
- LINE APIの利用制限に注意
- 通知の送信頻度制限
- ユーザーの通知設定の尊重
- プライバシー保護の徹底