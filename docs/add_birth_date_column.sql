-- プロフィールテーブルに生年月日カラムを追加
ALTER TABLE profiles
ADD COLUMN birth_date DATE;

-- 生年月日カラムにインデックスを追加（年齢での検索を高速化）
CREATE INDEX idx_profiles_birth_date ON profiles(birth_date);

-- 既存データがある場合、ageから逆算して生年月日を設定（おおよその値）
-- 注意: 実際のデータベースでは手動で正確な値を設定することを推奨
UPDATE profiles
SET birth_date = CURRENT_DATE - INTERVAL '1 year' * age - INTERVAL '6 months'
WHERE birth_date IS NULL AND age IS NOT NULL;