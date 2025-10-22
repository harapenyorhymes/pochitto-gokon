-- 友達招待コードテーブルの追加
-- Created: 2025-10-22

-- 招待コードテーブル
CREATE TABLE invitation_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(20) UNIQUE NOT NULL,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  max_uses INTEGER DEFAULT 5,
  current_uses INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days'),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'full')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- event_participantsテーブルにinvitation_code_id列を追加
ALTER TABLE event_participants
ADD COLUMN invitation_code_id UUID REFERENCES invitation_codes(id) ON DELETE SET NULL;

-- インデックス作成
CREATE INDEX idx_invitation_codes_code ON invitation_codes(code);
CREATE INDEX idx_invitation_codes_organizer ON invitation_codes(organizer_id);
CREATE INDEX idx_invitation_codes_event ON invitation_codes(event_id);
CREATE INDEX idx_invitation_codes_status ON invitation_codes(status);
CREATE INDEX idx_event_participants_invitation_code ON event_participants(invitation_code_id);

-- 更新日時トリガー設定
CREATE TRIGGER update_invitation_codes_updated_at
BEFORE UPDATE ON invitation_codes
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 招待コード生成関数（ランダムな6桁の英数字）
CREATE OR REPLACE FUNCTION generate_invitation_code()
RETURNS VARCHAR AS $$
DECLARE
  chars VARCHAR := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- 混同しやすい文字を除外
  result VARCHAR := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
  END LOOP;

  -- 既存のコードと重複していないかチェック
  WHILE EXISTS (SELECT 1 FROM invitation_codes WHERE code = result) LOOP
    result := '';
    FOR i IN 1..6 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
    END LOOP;
  END LOOP;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- コメント追加
COMMENT ON TABLE invitation_codes IS '友達招待コード管理テーブル';
COMMENT ON COLUMN invitation_codes.code IS '招待コード（6桁の英数字）';
COMMENT ON COLUMN invitation_codes.max_uses IS '最大利用回数';
COMMENT ON COLUMN invitation_codes.current_uses IS '現在の利用回数';
COMMENT ON COLUMN invitation_codes.expires_at IS '有効期限（デフォルト7日間）';
COMMENT ON COLUMN event_participants.invitation_code_id IS '使用された招待コードID';
