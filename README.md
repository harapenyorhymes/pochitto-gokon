# ポチッと合コン

マッチングアプリ疲れした20代〜30代前半を対象に、ソロ参加も友達参加もOKなWebアプリ。AI幹事が日程調整・グループマッチング・おすすめ店舗提示を代行し、ユーザーは「空いてる日を登録 → グループ成立通知 → 当日お店に行くだけ」のシンプル体験を提供する。

## 技術スタック

- **フロントエンド**: Next.js 14.2 + TypeScript + Tailwind CSS
- **バックエンド**: Supabase (PostgreSQL + Auth + Realtime)
- **通知**: LINE Messaging API
- **デプロイ**: Vercel

## 主要機能

- ✅ メール認証・LINE連携ログイン
- ✅ プロフィール作成・編集
- ✅ 日程・エリア登録（複数日程選択可能）
- ✅ 自動マッチングアルゴリズム（性別・年齢バランス考慮）
- ✅ リアルタイムグループチャット
- ✅ LINE通知（マッチング成立時）
- ✅ 通知設定管理

## セットアップ手順

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example`を参考に`.env.local`ファイルを作成し、以下の環境変数を設定してください：

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# LINE API Configuration
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token
LINE_CHANNEL_SECRET=your_line_channel_secret

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. データベースセットアップ

Supabaseプロジェクトで以下のSQLファイルを実行してください：

1. `docs/database_schema.sql` - テーブル作成
2. `docs/rls_policies.sql` - セキュリティポリシー設定
3. `docs/master_data.sql` - マスターデータ投入

### 4. 開発サーバー起動

```bash
npm run dev
```

http://localhost:3000 でアクセス可能になります。

## デプロイ手順

### Vercelでのデプロイ

1. **Vercelアカウント作成・ログイン**
   ```bash
   npm i -g vercel
   vercel login
   ```

2. **プロジェクトデプロイ**
   ```bash
   vercel
   ```

3. **環境変数設定**
   Vercelダッシュボードで以下の環境変数を設定：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `LINE_CHANNEL_ACCESS_TOKEN`
   - `LINE_CHANNEL_SECRET`
   - `NEXT_PUBLIC_APP_URL` (本番URL)

4. **LINEWebhook設定**
   LINE Developer Consoleで以下のWebhook URLを設定：
   ```
   https://your-domain.vercel.app/api/webhooks/line
   ```

## 開発・運用について

### 型チェック
```bash
npm run type-check
```

### ビルド
```bash
npm run build
```

### Lint
```bash
npm run lint
```

## 機能説明

### ユーザーフロー
1. **新規登録** - メール認証でアカウント作成
2. **プロフィール作成** - 基本情報・自己紹介入力
3. **日程登録** - 参加希望日程と参加方式選択
4. **マッチング成立** - 自動マッチング後LINE通知
5. **グループチャット** - メンバー間でリアルタイムチャット
6. **合コン参加** - 当日指定の場所で開催

### 管理機能
- マッチング実行: `/api/matching/execute` (POST)
- ユーザー統計: ダッシュボードで確認可能
- 通知設定: ユーザーごとに個別設定可能

## ライセンス

このプロジェクトはMITライセンスです。

## 貢献

プルリクエストやイシューの報告をお待ちしています。

## サポート

技術的な質問や不具合報告は、GitHubのIssuesまでお願いします。