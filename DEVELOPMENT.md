# 🎉 ポチッと合コン 開発ガイド

## 👥 共同開発ルール

### ブランチ戦略
- `main`: 本番環境用（直接プッシュ禁止）
- `develop`: 開発統合ブランチ
- `feature/機能名`: 機能開発用
- `fix/修正内容`: バグ修正用

### 開発フロー
```bash
# 1. 最新のdevelopブランチを取得
git checkout develop
git pull origin develop

# 2. 機能ブランチ作成
git checkout -b feature/user-auth

# 3. 開発・コミット
git add .
git commit -m "feat: ユーザー認証機能を追加"

# 4. プッシュしてプルリクエスト作成
git push origin feature/user-auth
```

### コミットメッセージ規約
- `feat:` 新機能
- `fix:` バグ修正  
- `docs:` ドキュメント
- `style:` スタイル修正
- `refactor:` リファクタリング
- `test:` テスト追加

### プルリクエスト
- レビュー必須
- 機能説明とスクリーンショット添付
- テスト確認済みをチェック

## 🛠️ 開発環境
- Node.js 18+
- Next.js 14.2.x
- TypeScript
- Tailwind CSS

## 📝 タスク管理
- GitHub Issues で機能要求・バグ報告
- GitHub Projects でかんばん管理
- マイルストーン設定で進捗管理