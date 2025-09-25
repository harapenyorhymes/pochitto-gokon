# テスト用アカウント

## 開発環境でのテスト方法

### オプション1: メール確認スキップ
1. Supabaseダッシュボード > Authentication > Settings
2. 「Enable email confirmations」をOFFにする
3. サインアップ後すぐにログイン可能

### オプション2: テストアカウント手動作成
Supabase SQL Editorで実行：

```sql
-- テスト用ユーザー作成（メール確認済み状態）
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'test@example.com',
  crypt('password123', gen_salt('bf')),
  current_timestamp,
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  current_timestamp,
  current_timestamp,
  '',
  '',
  '',
  ''
);
```

### テスト用認証情報
- Email: test@example.com
- Password: password123
```