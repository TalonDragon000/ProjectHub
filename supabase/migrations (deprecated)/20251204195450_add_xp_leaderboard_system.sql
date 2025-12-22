/*
  # XP Leaderboard System with Bot Detection
  
  ## Overview
  Comprehensive XP system with gamification, bot detection, and admin controls.
  
  ## 1. Profile XP Enhancements
  Adds XP tracking columns to profiles table:
  - `total_xp` - Cumulative XP earned
  - `xp_level` - Calculated level based on XP
  - `leaderboard_rank` - Current position on leaderboard
  - `is_first_100` - Badge for first 100 registered users
  - `is_top_100` - Badge for top 100 XP earners
  - `bot_score` - Automated bot detection score (0-100)
  - `is_flagged_bot` - Manual or automated bot flag
  - `bot_alert_count` - Number of bot alerts triggered
  - `last_xp_award_at` - Rate limiting timestamp
  
  ## 2. XP Transactions Table
  Audit trail for all XP changes:
  - Tracks every XP gain/loss
  - Records reason and metadata
  - Links to triggering entities (projects, ideas, reviews)
  - Enables dispute resolution
  
  ## 3. Bot Alerts Table
  Tracks suspicious activity:
  - Alert type and severity
  - Evidence and metadata
  - Admin review status
  - User dispute capability
  
  ## 4. Admin Users Table
  Manages admin privileges:
  - Verified admins only (starting with talondragon000)
  - Role-based permissions
  - Activity logging
  
  ## 5. XP Rules (Implemented in triggers)
  - First Project Published: 50 XP (one-time)
  - Each Additional Project: 10 XP
  - Project Demo View: 1 XP (max 1 per viewer per project)
  - Idea Submitted: 5 XP
  - Idea Reaction Received: 2 XP (max 1 per user per idea)
  - Review Received: 5 XP
  
  ## 6. Bot Detection Rules
  - Score increases for rapid actions
  - Pattern detection for automated behavior
  - Rate limiting enforcement
  - Admin review workflow
  
  ## 7. Security
  - RLS policies for all tables
  - Admin-only access to bot management
  - Users can view own XP history
  - Public leaderboard read access
*/

-- Add XP columns to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'total_xp'
  ) THEN
    ALTER TABLE profiles ADD COLUMN total_xp integer DEFAULT 0 NOT NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'xp_level'
  ) THEN
    ALTER TABLE profiles ADD COLUMN xp_level integer DEFAULT 1 NOT NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'leaderboard_rank'
  ) THEN
    ALTER TABLE profiles ADD COLUMN leaderboard_rank integer;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_first_100'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_first_100 boolean DEFAULT false NOT NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_top_100'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_top_100 boolean DEFAULT false NOT NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'bot_score'
  ) THEN
    ALTER TABLE profiles ADD COLUMN bot_score integer DEFAULT 0 NOT NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_flagged_bot'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_flagged_bot boolean DEFAULT false NOT NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'bot_alert_count'
  ) THEN
    ALTER TABLE profiles ADD COLUMN bot_alert_count integer DEFAULT 0 NOT NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'last_xp_award_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_xp_award_at timestamptz;
  END IF;
END $$;

-- Create admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'admin' NOT NULL,
  granted_at timestamptz DEFAULT now() NOT NULL,
  granted_by uuid REFERENCES profiles(id),
  is_active boolean DEFAULT true NOT NULL,
  UNIQUE(profile_id)
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Insert talondragon000 as the first admin
DO $$
DECLARE
  admin_profile_id uuid;
BEGIN
  -- Find profile ID for talondragon000
  SELECT id INTO admin_profile_id
  FROM profiles
  WHERE username = 'talondragon000'
  LIMIT 1;
  
  -- Insert as admin if found
  IF admin_profile_id IS NOT NULL THEN
    INSERT INTO admin_users (profile_id, role, granted_by, is_active)
    VALUES (admin_profile_id, 'admin', admin_profile_id, true)
    ON CONFLICT (profile_id) DO NOTHING;
  END IF;
END $$;

-- Create XP transactions table for audit trail
CREATE TABLE IF NOT EXISTS xp_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  xp_amount integer NOT NULL,
  xp_reason text NOT NULL,
  related_project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  related_idea_id uuid REFERENCES project_ideas(id) ON DELETE SET NULL,
  related_review_id uuid REFERENCES reviews(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;

-- Create bot alerts table
CREATE TABLE IF NOT EXISTS bot_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  alert_type text NOT NULL,
  severity text DEFAULT 'medium' NOT NULL,
  evidence jsonb DEFAULT '{}'::jsonb NOT NULL,
  bot_score_increase integer DEFAULT 10 NOT NULL,
  is_reviewed boolean DEFAULT false NOT NULL,
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamptz,
  admin_notes text,
  user_dispute_message text,
  disputed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE bot_alerts ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_total_xp ON profiles(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_leaderboard_rank ON profiles(leaderboard_rank) WHERE leaderboard_rank IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_bot_score ON profiles(bot_score DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_is_flagged_bot ON profiles(is_flagged_bot) WHERE is_flagged_bot = true;
CREATE INDEX IF NOT EXISTS idx_xp_transactions_profile_id ON xp_transactions(profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_created_at ON xp_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bot_alerts_profile_id ON bot_alerts(profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bot_alerts_is_reviewed ON bot_alerts(is_reviewed, created_at DESC);

-- RLS Policies for admin_users
CREATE POLICY "Admins can view all admin users"
  ON admin_users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      JOIN profiles p ON p.id = au.profile_id
      WHERE p.user_id = auth.uid() AND au.is_active = true
    )
  );

CREATE POLICY "Only system can insert admin users"
  ON admin_users FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY "Admins can update admin users"
  ON admin_users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      JOIN profiles p ON p.id = au.profile_id
      WHERE p.user_id = auth.uid() AND au.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users au
      JOIN profiles p ON p.id = au.profile_id
      WHERE p.user_id = auth.uid() AND au.is_active = true
    )
  );

-- RLS Policies for xp_transactions
CREATE POLICY "Users can view own XP transactions"
  ON xp_transactions FOR SELECT
  TO authenticated
  USING (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can view all XP transactions"
  ON xp_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      JOIN profiles p ON p.id = au.profile_id
      WHERE p.user_id = auth.uid() AND au.is_active = true
    )
  );

CREATE POLICY "Only system can insert XP transactions"
  ON xp_transactions FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- RLS Policies for bot_alerts
CREATE POLICY "Users can view own bot alerts"
  ON bot_alerts FOR SELECT
  TO authenticated
  USING (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can view all bot alerts"
  ON bot_alerts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      JOIN profiles p ON p.id = au.profile_id
      WHERE p.user_id = auth.uid() AND au.is_active = true
    )
  );

CREATE POLICY "Users can dispute own bot alerts"
  ON bot_alerts FOR UPDATE
  TO authenticated
  USING (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) AND
    is_reviewed = false
  )
  WITH CHECK (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) AND
    user_dispute_message IS NOT NULL AND
    disputed_at IS NOT NULL
  );

CREATE POLICY "Admins can update bot alerts"
  ON bot_alerts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      JOIN profiles p ON p.id = au.profile_id
      WHERE p.user_id = auth.uid() AND au.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users au
      JOIN profiles p ON p.id = au.profile_id
      WHERE p.user_id = auth.uid() AND au.is_active = true
    )
  );

CREATE POLICY "Only system can insert bot alerts"
  ON bot_alerts FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- Function to calculate XP level from total XP
CREATE OR REPLACE FUNCTION calculate_xp_level(total_xp integer)
RETURNS integer AS $$
BEGIN
  -- Level formula: sqrt(total_xp / 100) + 1
  -- Level 1: 0-99 XP
  -- Level 2: 100-399 XP
  -- Level 3: 400-899 XP
  -- Level 4: 900-1599 XP
  -- etc.
  RETURN GREATEST(1, FLOOR(SQRT(total_xp::numeric / 100.0)) + 1);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update leaderboard ranks
CREATE OR REPLACE FUNCTION update_leaderboard_ranks()
RETURNS void AS $$
BEGIN
  -- Update ranks based on total_xp
  WITH ranked_profiles AS (
    SELECT
      id,
      ROW_NUMBER() OVER (ORDER BY total_xp DESC, created_at ASC) as new_rank
    FROM profiles
    WHERE is_flagged_bot = false
  )
  UPDATE profiles p
  SET leaderboard_rank = rp.new_rank
  FROM ranked_profiles rp
  WHERE p.id = rp.id;
  
  -- Update is_top_100 badge
  UPDATE profiles
  SET is_top_100 = (leaderboard_rank IS NOT NULL AND leaderboard_rank <= 100);
END;
$$ LANGUAGE plpgsql;

-- Function to mark first 100 users
CREATE OR REPLACE FUNCTION mark_first_100_users()
RETURNS void AS $$
BEGIN
  WITH first_100 AS (
    SELECT id
    FROM profiles
    ORDER BY created_at ASC
    LIMIT 100
  )
  UPDATE profiles p
  SET is_first_100 = true
  FROM first_100 f
  WHERE p.id = f.id;
END;
$$ LANGUAGE plpgsql;

-- Mark first 100 users
SELECT mark_first_100_users();
