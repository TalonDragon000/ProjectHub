/*
  # Fix Messaging System Security and Performance Issues

  1. Indexes
    - Add missing index on messages.sender_id foreign key for optimal query performance
    - Drop unused indexes that are not being utilized

  2. RLS Policy Optimization
    - Update all RLS policies to use (select auth.uid()) instead of auth.uid()
    - This prevents re-evaluation for each row, significantly improving performance at scale

  3. Function Security
    - Add immutable search_path to all custom functions to prevent security vulnerabilities
    - Use SET search_path = '' to ensure functions only reference schema-qualified objects

  4. Important Notes
    - Unused indexes are kept as they may be used in future queries
    - The application is still in development, so indexes remain for when features are utilized
    - Auth password leak protection must be enabled via Supabase dashboard settings
*/

-- Add missing index on messages.sender_id for foreign key performance
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);

-- Drop and recreate RLS policies with optimized auth.uid() calls for conversations table
DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON conversations;

CREATE POLICY "Users can view their own conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (
    (select auth.uid()) IN (
      SELECT user_id FROM profiles WHERE id = participant_1_id
      UNION
      SELECT user_id FROM profiles WHERE id = participant_2_id
    )
  );

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (
    (select auth.uid()) IN (
      SELECT user_id FROM profiles WHERE id = participant_1_id
      UNION
      SELECT user_id FROM profiles WHERE id = participant_2_id
    )
  );

CREATE POLICY "Users can update their own conversations"
  ON conversations FOR UPDATE
  TO authenticated
  USING (
    (select auth.uid()) IN (
      SELECT user_id FROM profiles WHERE id = participant_1_id
      UNION
      SELECT user_id FROM profiles WHERE id = participant_2_id
    )
  );

-- Drop and recreate RLS policies with optimized auth.uid() calls for messages table
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can update their received messages" ON messages;

CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  TO authenticated
  USING (
    (select auth.uid()) IN (
      SELECT user_id FROM profiles WHERE id = sender_id
      UNION
      SELECT user_id FROM profiles WHERE id = receiver_id
    )
  );

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    (select auth.uid()) = (SELECT user_id FROM profiles WHERE id = sender_id)
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
    (select auth.uid()) = (SELECT user_id FROM profiles WHERE id = receiver_id)
  )
  WITH CHECK (
    (select auth.uid()) = (SELECT user_id FROM profiles WHERE id = receiver_id)
  );

-- Update functions with immutable search_path for security
CREATE OR REPLACE FUNCTION get_or_create_conversation(
  user1_profile_id uuid,
  user2_profile_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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
  FROM public.conversations
  WHERE participant_1_id = ordered_user1_id
    AND participant_2_id = ordered_user2_id;

  -- If not found, create new conversation
  IF conversation_id IS NULL THEN
    INSERT INTO public.conversations (participant_1_id, participant_2_id)
    VALUES (ordered_user1_id, ordered_user2_id)
    RETURNING id INTO conversation_id;
  END IF;

  RETURN conversation_id;
END;
$$;

CREATE OR REPLACE FUNCTION get_unread_message_count(user_profile_id uuid)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  unread_count bigint;
BEGIN
  SELECT COUNT(*)
  INTO unread_count
  FROM public.messages
  WHERE receiver_id = user_profile_id
    AND is_read = false;

  RETURN COALESCE(unread_count, 0);
END;
$$;

CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$;