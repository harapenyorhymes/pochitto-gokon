-- Row Level Security (RLS) ポリシー設定

-- RLS有効化
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- areasテーブルは全ユーザーが読み取り可能
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Areas are publicly readable" ON areas FOR SELECT USING (true);

-- usersテーブル：自分のレコードのみアクセス可能
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- profilesテーブル：自分のプロフィールのみアクセス可能
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- eventsテーブル：自分が作成したイベントのみアクセス可能
CREATE POLICY "Users can view own events" ON events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own events" ON events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own events" ON events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own events" ON events FOR DELETE USING (auth.uid() = user_id);

-- event_participantsテーブル：関連するユーザーのみアクセス可能
CREATE POLICY "Users can view participants of their events" ON event_participants FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM events
    WHERE events.id = event_participants.event_id
    AND events.user_id = auth.uid()
  ) OR auth.uid() = user_id
);
CREATE POLICY "Event organizers can insert participants" ON event_participants FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM events
    WHERE events.id = event_id
    AND events.user_id = auth.uid()
  )
);
CREATE POLICY "Users can update their participation" ON event_participants FOR UPDATE USING (auth.uid() = user_id);

-- groupsテーブル：グループメンバーのみアクセス可能
CREATE POLICY "Group members can view groups" ON groups FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = groups.id
    AND group_members.user_id = auth.uid()
  )
);

-- group_membersテーブル：グループメンバーのみアクセス可能
CREATE POLICY "Group members can view group members" ON group_members FOR SELECT USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = group_members.group_id
    AND gm.user_id = auth.uid()
  )
);

-- group_chatsテーブル：グループメンバーのみアクセス可能
CREATE POLICY "Group members can view group chats" ON group_chats FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = group_chats.group_id
    AND group_members.user_id = auth.uid()
  )
);

-- messagesテーブル：グループメンバーのみアクセス可能
CREATE POLICY "Group members can view messages" ON messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM group_chats
    JOIN group_members ON group_members.group_id = group_chats.group_id
    WHERE group_chats.id = messages.chat_id
    AND group_members.user_id = auth.uid()
  )
);
CREATE POLICY "Group members can insert messages" ON messages FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM group_chats
    JOIN group_members ON group_members.group_id = group_chats.group_id
    WHERE group_chats.id = chat_id
    AND group_members.user_id = auth.uid()
  )
);
CREATE POLICY "Users can update own messages" ON messages FOR UPDATE USING (auth.uid() = user_id);

-- message_readsテーブル：自分の既読情報のみアクセス可能
CREATE POLICY "Users can view own message reads" ON message_reads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own message reads" ON message_reads FOR INSERT WITH CHECK (auth.uid() = user_id);

-- notificationsテーブル：自分の通知のみアクセス可能
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);

-- notification_settingsテーブル：自分の設定のみアクセス可能
CREATE POLICY "Users can view own notification settings" ON notification_settings FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own notification settings" ON notification_settings FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own notification settings" ON notification_settings FOR UPDATE USING (auth.uid() = id);