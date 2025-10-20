# ポチッと合コン Git管理フロー

## 📋 概要

このドキュメントでは、ポチッと合コンアプリの安全で効率的な開発を行うためのGit管理フローを定義します。

## 🌳 ブランチ戦略

```
main (本番環境 - Vercel自動デプロイ)
└── develop (開発メイン - ここから作業開始)
    ├── feature/機能名 (新機能開発)
    ├── fix/修正内容 (バグ修正)
    ├── style/UI変更名 (UI/スタイル変更)
    └── backup/節目名 (重要な変更前のバックアップ)
```

## 📝 コミットメッセージルール

**プレフィックス**
- `feat:` 新機能追加
- `fix:` バグ修正
- `style:` UI/スタイル変更
- `refactor:` コードのリファクタリング
- `docs:` ドキュメント更新
- `deploy:` デプロイ関連
- `build:` ビルド関連の修正

**例**
```bash
git commit -m "feat: プロフィール編集機能を追加"
git commit -m "fix: ログイン時のエラーハンドリング修正"
git commit -m "style: ボタンのデザインをモダンに変更"
```

## 🏷️ 重要なタグ履歴

| タグ名 | 日付 | 内容 |
|--------|------|------|
| `v1.0.0` | 2025-01-25 | 初期リリース版 |
| `v1.1.0-ui-modern` | 2025-01-26 | モダンUI実装完了・Vercelデプロイ成功版 |

## 🚀 日常の開発フロー

### 1. 新機能開発時

```bash
# 1. 最新の develop ブランチに移動
git checkout develop
git pull origin develop

# 2. 新しい機能ブランチを作成
git checkout -b feature/チャット機能

# 3. 開発作業（小さな変更ごとにコミット）
git add components/Chat.tsx
git commit -m "feat: チャットコンポーネントの基本構造を追加"

git add app/chat/page.tsx
git commit -m "feat: チャットページのレイアウト実装"

# 4. 開発完了後、develop にマージ
git checkout develop
git merge feature/チャット機能

# 5. リモートにプッシュ
git push origin develop

# 6. 不要になったブランチを削除
git branch -d feature/チャット機能
```

### 2. バグ修正時

```bash
# 1. 修正ブランチを作成
git checkout -b fix/ログインエラー修正

# 2. 修正作業
git add lib/auth.ts
git commit -m "fix: 認証トークンの有効期限チェック修正"

# 3. develop にマージ
git checkout develop
git merge fix/ログインエラー修正
git push origin develop

# 4. ブランチ削除
git branch -d fix/ログインエラー修正
```

### 3. UI変更時

```bash
# 1. スタイルブランチを作成
git checkout -b style/プロフィールページUI改善

# 2. UI変更作業
git add app/profile/page.tsx
git commit -m "style: プロフィールカードのグラデーション効果追加"

# 3. develop にマージ
git checkout develop
git merge style/プロフィールページUI改善
git push origin develop
```

## ⏪ 前の状態に戻す方法

### A. 特定のファイルだけ前の状態に戻す
```bash
# 特定のファイルを1つ前のコミットの状態に戻す
git checkout HEAD~1 -- app/page.tsx

# 特定のタグの状態に戻す
git checkout v1.1.0-ui-modern -- app/page.tsx
```

### B. コミット全体を安全に取り消す（推奨）
```bash
# 直前のコミットを取り消すコミットを作成
git revert HEAD

# 特定のコミットを取り消す
git revert a0ca68f
```

### C. 特定のタグの状態を確認する
```bash
# タグ一覧を確認
git tag

# 特定のタグの状態をチェックアウト（読み取り専用）
git checkout v1.1.0-ui-modern

# 元のブランチに戻る
git checkout develop
```

### D. 危険な完全リセット（非推奨 - 変更が失われる）
```bash
# ⚠️ 注意：これは変更を完全に消去します
git reset --hard HEAD~1  # 1つ前のコミットに戻す
git reset --hard v1.1.0-ui-modern  # 特定のタグに戻す
```

## 🏷️ 重要な節目でのタグ作成

### 重要な機能完成時
```bash
# 1. 現在の状態にタグを付ける
git tag -a v1.2.0-matching-system -m "マッチングシステム実装完了"

# 2. リモートにプッシュ
git push origin v1.2.0-matching-system
```

### バージョン番号の規則
- `v1.x.0` - メジャー機能追加
- `v1.x.y` - 小さな機能追加・修正
- `v1.x.y-機能名` - 特定機能の完成時

## 🔒 大きな変更前のバックアップ

重要な変更を行う前に、現在の状態をバックアップ：

```bash
# 1. バックアップブランチを作成
git checkout -b backup/UI大幅変更前

# 2. リモートにプッシュしてバックアップ
git push origin backup/UI大幅変更前

# 3. 開発ブランチに戻る
git checkout develop
```

## 🚨 緊急時の対応

### 本番環境で問題が発生した場合
```bash
# 1. 前の安定バージョンにロールバック
git checkout v1.1.0-ui-modern

# 2. 新しいブランチとして作成
git checkout -b hotfix/緊急修正

# 3. 修正後、直接 main にマージ
git checkout main
git merge hotfix/緊急修正
git push origin main  # Vercelに自動デプロイ

# 4. develop にも反映
git checkout develop
git merge hotfix/緊急修正
git push origin develop
```

## 📊 現在の状態確認コマンド

```bash
# ブランチ一覧確認
git branch -a

# タグ一覧確認
git tag

# コミット履歴確認
git log --oneline -10

# 現在の変更状況確認
git status

# リモートとの差分確認
git diff origin/develop
```

## 💡 開発のコツ

1. **こまめにコミット**: 小さな変更でもコミットして履歴を残す
2. **意味のあるコミットメッセージ**: 後で見返したときに分かりやすく
3. **定期的なプッシュ**: ローカルだけでなくリモートにも保存
4. **重要な節目でタグ**: 安定した状態は必ずタグ付け
5. **大きな変更前はバックアップ**: 安心して実験できる環境作り

## 🔗 関連リンク

- [GitHub Repository](https://github.com/harapenyorhymes/pochitto-gokon)
- [Vercel Deployment](https://pochitto-gokon-8wioyvotm-kusopes-projects.vercel.app)
- [Supabase Dashboard](https://supabase.com/dashboard/project/zzounpnqvddnunbcjswb)