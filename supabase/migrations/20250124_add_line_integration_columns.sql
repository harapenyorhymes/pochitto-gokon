-- Add LINE integration fields to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS line_access_token TEXT,
  ADD COLUMN IF NOT EXISTS line_refresh_token TEXT,
  ADD COLUMN IF NOT EXISTS line_access_token_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS line_friend_flag BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS line_friend_checked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS line_linked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS level INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_users_line_user_id ON users(line_user_id);

ALTER TABLE line_oauth_states
  ADD COLUMN IF NOT EXISTS return_to TEXT;

-- Track LINE push notification history
CREATE TABLE IF NOT EXISTS line_message_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL,
  message_payload JSONB NOT NULL,
  delivered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'sent',
  error TEXT
);

CREATE INDEX IF NOT EXISTS idx_line_message_logs_user_id ON line_message_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_line_message_logs_delivered_at ON line_message_logs(delivered_at);

-- Track match confirmation acknowledgements and penalty executions
CREATE TABLE IF NOT EXISTS match_acknowledgements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  acknowledged_at TIMESTAMPTZ,
  initial_notification_sent_at TIMESTAMPTZ,
  reminder_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(match_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_match_acknowledgements_user_id ON match_acknowledgements(user_id);
CREATE INDEX IF NOT EXISTS idx_match_acknowledgements_match_id ON match_acknowledgements(match_id);

CREATE TABLE IF NOT EXISTS penalty_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_id UUID,
  penalty_type TEXT NOT NULL,
  points_delta INTEGER NOT NULL,
  detail TEXT,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_penalty_logs_user_id ON penalty_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_penalty_logs_processed_at ON penalty_logs(processed_at);
