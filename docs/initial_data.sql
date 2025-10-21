-- ポチッと合コン 初期データ投入SQL
-- areasテーブルに名古屋栄エリアを追加

-- 既存データがあれば削除（開発環境用）
DELETE FROM areas WHERE id = '00000000-0000-0000-0000-000000000001';

-- 名古屋栄エリアを固定UUIDで挿入
INSERT INTO areas (id, name, prefecture, city, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '名古屋栄エリア',
  '愛知県',
  '名古屋市',
  CURRENT_TIMESTAMP
);

-- 確認用クエリ
SELECT * FROM areas;
