-- LINE OAuth state verification table
-- モバイルでCookieが保持されない問題に対応するため、stateをDBで管理

CREATE TABLE IF NOT EXISTS line_oauth_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state TEXT NOT NULL UNIQUE,
  nonce TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes'),
  used BOOLEAN NOT NULL DEFAULT FALSE
);

-- 期限切れのstateを自動削除するインデックス
CREATE INDEX idx_line_oauth_states_expires_at ON line_oauth_states(expires_at);
CREATE INDEX idx_line_oauth_states_state ON line_oauth_states(state);

-- 10分経過したstateは自動的に無効とみなす
-- 定期的なクリーンアップは別途実装
