/*
  # Add Direct Messaging System

  1. New Tables
    - `conversations`
      - `id` (uuid, primary key)
      - `participant_1_id` (uuid, references profiles)
      - `participant_2_id` (uuid, references profiles)
      - `last_message_at` (timestamptz)
      - `created_at` (timestamptz)
    
    - `messages`
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, references conversations)
      - `sender_id` (uuid, references profiles)
      - `receiver_id` (uuid, references profiles)
      - `content` (text)
      - `is_read` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Users can only view conversations they participate in
    - Users can only view messages in their conversations
    - Users can only send messages to conversations they're part of
    - Users can only mark their own received messages as read

  3. Functions
    - `get_or_create_conversation(user1_id, user2_id)` - Gets existing conversation or creates new one
    - `get_unread_message_count(user_id)` - Returns count of unread messages for a user

  4. Indexes
    - Index on conversation participants for efficient lookups
    - Index on message conversation_id for fast message retrieval
    - Index on message receiver_id and is_read for unread count queries
*/

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  participant_2_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT different_participants CHECK (participant_1_id != participant_2_id),
  CONSTRAINT ordered_participants CHECK (participant_1_id < participant_2_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_participant_1 ON conversations(participant_1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_2 ON conversations(participant_2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_unread ON messages(receiver_id, is_read) WHERE is_read = false;

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Conversations policies
CREATE POLICY "Users can view their own conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM profiles WHERE id = participant_1_id
      UNION
      SELECT user_id FROM profiles WHERE id = participant_2_id
    )
  );

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM profiles WHERE id = participant_1_id
      UNION
      SELECT user_id FROM profiles WHERE id = participant_2_id
    )
  );

CREATE POLICY "Users can update their own conversations"
  ON conversations FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM profiles WHERE id = participant_1_id
      UNION
      SELECT user_id FROM profiles WHERE id = participant_2_id
    )
  );

-- Messages policies
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM profiles WHERE id = sender_id
      UNION
      SELECT user_id FROM profiles WHERE id = receiver_id
    )
  );

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = sender_id)
    AND EXISTS (
      SELECT 1 FROM conversations
      WHERE id = conversation_id
      AND (
        sender_id IN (participant_1_id, participant_2_id)
        AND receiver_id IN (participant_1_id, participant_2_id)
      )
    )
  );

CREATE POLICY "Users can update their received messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = receiver_id)
  )
  WITH CHECK (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = receiver_id)
  );

-- Function to get or create a conversation between two users
CREATE OR REPLACE FUNCTION get_or_create_conversation(
  user1_profile_id uuid,
  user2_profile_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  conversation_id uuid;
  ordered_user1_id uuid;
  ordered_user2_id uuid;
BEGIN
  -- Ensure consistent ordering
  IF user1_profile_id < user2_profile_id THEN
    ordered_user1_id := user1_profile_id;
    ordered_user2_id := user2_profile_id;
  ELSE
    ordered_user1_id := user2_profile_id;
    ordered_user2_id := user1_profile_id;
  END IF;

  -- Try to find existing conversation
  SELECT id INTO conversation_id
  FROM conversations
  WHERE participant_1_id = ordered_user1_id
    AND participant_2_id = ordered_user2_id;

  -- If not found, create new conversation
  IF conversation_id IS NULL THEN
    INSERT INTO conversations (participant_1_id, participant_2_id)
    VALUES (ordered_user1_id, ordered_user2_id)
    RETURNING id INTO conversation_id;
  END IF;

  RETURN conversation_id;
END;
$$;

-- Function to get unread message count for a user
CREATE OR REPLACE FUNCTION get_unread_message_count(user_profile_id uuid)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  unread_count bigint;
BEGIN
  SELECT COUNT(*)
  INTO unread_count
  FROM messages
  WHERE receiver_id = user_profile_id
    AND is_read = false;

  RETURN COALESCE(unread_count, 0);
END;
$$;

-- Trigger to update last_message_at on conversations
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_conversation_timestamp
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_timestamp();