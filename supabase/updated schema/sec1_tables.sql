-- ============================================================================
-- ProjectHub Complete Database Schema
-- Consolidated, clean version - Safe to run from scratch
-- ============================================================================

-- ============================================================================
-- SECTION 1: TABLES
-- ============================================================================

-- -----------------------------------------------------------------------------
-- 1.1 PROFILES TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- Basic Info
  display_name text NOT NULL,
  username text UNIQUE NOT NULL,
  avatar_url text,
  bio text CHECK (char_length(bio) <= 500),
  
  -- Settings
  allow_messages_from_users boolean DEFAULT false,
  open_to_beta_test boolean DEFAULT false,
  
  -- Creator & User Flags
  is_creator boolean DEFAULT false,
  is_idea_maker boolean DEFAULT false,
  
  -- Review/Feedback Anonymity Preferences
  post_reviews_anonymously boolean DEFAULT false,
  post_feedback_anonymously boolean DEFAULT false,
  
  -- Payment Integration
  payment_provider text CHECK (payment_provider IN ('paypal', 'stripe', 'ko-fi')),
  payment_username text,
  
  -- XP & Gamification
  total_xp integer DEFAULT 0 NOT NULL,
  xp_level integer DEFAULT 1 NOT NULL,
  leaderboard_rank integer,
  is_first_100 boolean DEFAULT false NOT NULL,
  is_top_100 boolean DEFAULT false NOT NULL,
  
  -- Bot Detection
  bot_score integer DEFAULT 0 NOT NULL CHECK (bot_score >= 0 AND bot_score <= 100),
  is_flagged_bot boolean DEFAULT false NOT NULL,
  bot_alert_count integer DEFAULT 0 NOT NULL,
  last_xp_award_at timestamptz,
  
  -- Tracking
  validation_count integer DEFAULT 0 NOT NULL,
  reviewer_count integer DEFAULT 0 NOT NULL,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 1.2 PROJECTS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  hero_image text,
  is_published boolean DEFAULT false,
  average_rating numeric(3, 2) DEFAULT 0.0,
  total_reviews integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 1.3 REVIEWS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  project_slug text NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text NOT NULL,
  review_text text NOT NULL,
  review_identity_public boolean DEFAULT true,
  session_id text,
  created_by_auth_uid uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  last_edited_at timestamptz,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 1.4 QUICK_FEEDBACK TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quick_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,  -- Always required for logged-in
  message text NOT NULL,
  feedback_identity_public boolean DEFAULT true,  -- NEW: tracks if THIS feedback is public
  created_by_auth_uid uuid REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,  -- Always required
  last_edited_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE quick_feedback ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 1.5 PROJECT IDEAS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS project_ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid UNIQUE NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  problem_area text NOT NULL,
  keywords text[] DEFAULT '{}',
  need_count integer DEFAULT 0,
  curious_count integer DEFAULT 0,
  rethink_count integer DEFAULT 0,
  collaboration_open boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE project_ideas ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 1.6 IDEA REACTIONS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS idea_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  session_id text,
  reaction_type text NOT NULL CHECK (reaction_type IN ('need', 'curious', 'rethink')),
  created_by_auth_uid uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  CHECK (
    (user_id IS NOT NULL AND session_id IS NULL) OR
    (user_id IS NULL AND session_id IS NOT NULL)
  )
);

ALTER TABLE idea_reactions ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 1.7 FEATURES TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  status text DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'on_hold')),
  order_index integer DEFAULT 0,
  upvotes integer DEFAULT 0,
  downvotes integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE features ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 1.8 MILESTONES TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  completion_percentage integer DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  target_date date,
  order_index integer DEFAULT 0,
  status text DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 1.9 DONATION GOALS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS donation_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  feature_id uuid REFERENCES features(id) ON DELETE CASCADE,
  milestone_id uuid REFERENCES milestones(id) ON DELETE CASCADE,
  goal_amount numeric(10, 2) NOT NULL,
  current_amount numeric(10, 2) DEFAULT 0.0,
  goal_type text NOT NULL CHECK (goal_type IN ('project', 'feature', 'milestone')),
  description text,
  deadline date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE donation_goals ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 1.10 DONATIONS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid REFERENCES donation_goals(id) ON DELETE CASCADE NOT NULL,
  amount numeric(10, 2) NOT NULL,
  donor_email text,
  donor_name text,
  stripe_payment_id text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 1.11 PROJECT LINKS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS project_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  link_name text NOT NULL,
  url text NOT NULL,
  link_type text NOT NULL CHECK (link_type IN ('website', 'demo', 'github', 'docs', 'other')),
  click_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE project_links ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 1.12 PROJECT ANALYTICS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS project_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  page_views integer DEFAULT 0,
  unique_visitors integer DEFAULT 0,
  referral_source text,
  visit_date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE project_analytics ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 1.13 PROJECT UPDATES TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS project_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  is_pinned boolean DEFAULT false,
  published_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE project_updates ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 1.14 CONVERSATIONS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  participant_2_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT different_participants CHECK (participant_1_id != participant_2_id),
  CONSTRAINT ordered_participants CHECK (participant_1_id < participant_2_id)
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 1.15 MESSAGES TABLE
-- -----------------------------------------------------------------------------
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

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 1.16 DEMO VIEWS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS demo_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  viewer_profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  viewer_session_id text,
  link_id uuid REFERENCES project_links(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  CHECK (
    (viewer_profile_id IS NOT NULL AND viewer_session_id IS NULL) OR
    (viewer_profile_id IS NULL AND viewer_session_id IS NOT NULL)
  )
);

ALTER TABLE demo_views ENABLE ROW LEVEL SECURITY;