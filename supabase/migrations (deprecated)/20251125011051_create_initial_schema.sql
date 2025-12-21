/*
  # Initial Schema for Project Review Platform

  ## Overview
  This migration creates the complete database schema for a Yelp-style project review platform
  for startup builders and freelancers to showcase projects, collect feedback, and manage funding.

  ## New Tables

  ### 1. creator_profiles
  - Extends auth.users with creator-specific information
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `display_name` (text)
  - `bio` (text, optional)
  - `avatar_url` (text, optional)
  - `created_at` (timestamptz)

  ### 2. projects
  - Main project information published by creators
  - `id` (uuid, primary key)
  - `creator_id` (uuid, references creator_profiles)
  - `name` (text)
  - `slug` (text, unique, for URL-friendly access)
  - `description` (text)
  - `category` (text: games, saas, tools, apps, etc.)
  - `status` (text: active, paused, completed)
  - `hero_image` (text, optional)
  - `is_published` (boolean, default false)
  - `average_rating` (numeric, default 0)
  - `total_reviews` (integer, default 0)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. reviews
  - User reviews with star ratings (1-5)
  - `id` (uuid, primary key)
  - `project_id` (uuid, references projects)
  - `reviewer_name` (text, optional)
  - `reviewer_email` (text, optional)
  - `rating` (integer, 1-5)
  - `title` (text)
  - `review_text` (text)
  - `is_verified` (boolean, default false)
  - `created_at` (timestamptz)

  ### 4. quick_feedback
  - Quick one-line feedback without ratings
  - `id` (uuid, primary key)
  - `project_id` (uuid, references projects)
  - `message` (text)
  - `sentiment` (text, optional: positive, neutral, negative)
  - `created_at` (timestamptz)

  ### 5. features
  - Roadmap features with voting
  - `id` (uuid, primary key)
  - `project_id` (uuid, references projects)
  - `title` (text)
  - `description` (text)
  - `status` (text: planned, in_progress, completed, on_hold)
  - `order_index` (integer)
  - `upvotes` (integer, default 0)
  - `downvotes` (integer, default 0)
  - `created_at` (timestamptz)

  ### 6. milestones
  - Project milestones with progress tracking
  - `id` (uuid, primary key)
  - `project_id` (uuid, references projects)
  - `title` (text)
  - `description` (text)
  - `completion_percentage` (integer, default 0)
  - `target_date` (date, optional)
  - `order_index` (integer)
  - `status` (text: planned, in_progress, completed)
  - `created_at` (timestamptz)

  ### 7. project_links
  - External links for projects (website, demo, GitHub, etc.)
  - `id` (uuid, primary key)
  - `project_id` (uuid, references projects)
  - `link_name` (text)
  - `url` (text)
  - `link_type` (text: website, demo, github, docs, other)
  - `click_count` (integer, default 0)

  ### 8. project_analytics
  - Page view tracking and referral sources
  - `id` (uuid, primary key)
  - `project_id` (uuid, references projects)
  - `page_views` (integer, default 1)
  - `unique_visitors` (integer, default 1)
  - `referral_source` (text, optional)
  - `visit_date` (date)

  ### 9. donation_goals
  - Funding goals for projects, features, or milestones
  - `id` (uuid, primary key)
  - `project_id` (uuid, references projects, optional)
  - `feature_id` (uuid, references features, optional)
  - `milestone_id` (uuid, references milestones, optional)
  - `goal_amount` (numeric)
  - `current_amount` (numeric, default 0)
  - `goal_type` (text: project, feature, milestone)
  - `description` (text)
  - `deadline` (date, optional)
  - `created_at` (timestamptz)

  ### 10. donations
  - Individual donation records
  - `id` (uuid, primary key)
  - `goal_id` (uuid, references donation_goals)
  - `amount` (numeric)
  - `donor_email` (text, optional)
  - `donor_name` (text, optional)
  - `stripe_payment_id` (text, optional)
  - `created_at` (timestamptz)

  ### 11. project_updates
  - Blog-style updates from creators
  - `id` (uuid, primary key)
  - `project_id` (uuid, references projects)
  - `title` (text)
  - `content` (text)
  - `is_pinned` (boolean, default false)
  - `published_at` (timestamptz)

  ## Security (Row Level Security)

  ### Public Tables (read-only for everyone):
  - projects (only published ones)
  - reviews
  - quick_feedback
  - features
  - milestones
  - project_links
  - donation_goals
  - project_updates

  ### Creator-Only Tables (write access for project owners):
  - creator_profiles (own profile only)
  - projects (own projects only)
  - All related tables require project ownership

  ### Anonymous Write Access:
  - reviews (anyone can submit)
  - quick_feedback (anyone can submit)
  - features (anyone can vote)
  - donations (anyone can donate)

  ## Indexes

  Created indexes for:
  - Project slug lookups
  - Project category filtering
  - Review and feedback project associations
  - Analytics date-based queries
*/

-- Create creator_profiles table
CREATE TABLE IF NOT EXISTS creator_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  display_name text NOT NULL,
  bio text,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES creator_profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  hero_image text,
  is_published boolean DEFAULT false,
  average_rating numeric DEFAULT 0,
  total_reviews integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  reviewer_name text,
  reviewer_email text,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text NOT NULL,
  review_text text NOT NULL,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create quick_feedback table
CREATE TABLE IF NOT EXISTS quick_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  sentiment text CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  created_at timestamptz DEFAULT now()
);

-- Create features table
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

-- Create milestones table
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

-- Create project_links table
CREATE TABLE IF NOT EXISTS project_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  link_name text NOT NULL,
  url text NOT NULL,
  link_type text DEFAULT 'other' CHECK (link_type IN ('website', 'demo', 'github', 'docs', 'other')),
  click_count integer DEFAULT 0
);

-- Create project_analytics table
CREATE TABLE IF NOT EXISTS project_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  page_views integer DEFAULT 1,
  unique_visitors integer DEFAULT 1,
  referral_source text,
  visit_date date DEFAULT CURRENT_DATE
);

-- Create donation_goals table
CREATE TABLE IF NOT EXISTS donation_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  feature_id uuid REFERENCES features(id) ON DELETE CASCADE,
  milestone_id uuid REFERENCES milestones(id) ON DELETE CASCADE,
  goal_amount numeric NOT NULL,
  current_amount numeric DEFAULT 0,
  goal_type text NOT NULL CHECK (goal_type IN ('project', 'feature', 'milestone')),
  description text NOT NULL,
  deadline date,
  created_at timestamptz DEFAULT now()
);

-- Create donations table
CREATE TABLE IF NOT EXISTS donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid REFERENCES donation_goals(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL,
  donor_email text,
  donor_name text,
  stripe_payment_id text,
  created_at timestamptz DEFAULT now()
);

-- Create project_updates table
CREATE TABLE IF NOT EXISTS project_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  is_pinned boolean DEFAULT false,
  published_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_creator ON projects(creator_id);
CREATE INDEX IF NOT EXISTS idx_projects_published ON projects(is_published);
CREATE INDEX IF NOT EXISTS idx_reviews_project ON reviews(project_id);
CREATE INDEX IF NOT EXISTS idx_feedback_project ON quick_feedback(project_id);
CREATE INDEX IF NOT EXISTS idx_features_project ON features(project_id);
CREATE INDEX IF NOT EXISTS idx_milestones_project ON milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_analytics_project ON project_analytics(project_id);
CREATE INDEX IF NOT EXISTS idx_analytics_date ON project_analytics(visit_date);

-- Enable Row Level Security on all tables
ALTER TABLE creator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE quick_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE features ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_updates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for creator_profiles
CREATE POLICY "Anyone can view creator profiles"
  ON creator_profiles FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can create own profile"
  ON creator_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON creator_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for projects
CREATE POLICY "Anyone can view published projects"
  ON projects FOR SELECT
  TO public
  USING (is_published = true);

CREATE POLICY "Creators can view own projects"
  ON projects FOR SELECT
  TO authenticated
  USING (creator_id IN (SELECT id FROM creator_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Authenticated users can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (creator_id IN (SELECT id FROM creator_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Creators can update own projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (creator_id IN (SELECT id FROM creator_profiles WHERE user_id = auth.uid()))
  WITH CHECK (creator_id IN (SELECT id FROM creator_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Creators can delete own projects"
  ON projects FOR DELETE
  TO authenticated
  USING (creator_id IN (SELECT id FROM creator_profiles WHERE user_id = auth.uid()));

-- RLS Policies for reviews
CREATE POLICY "Anyone can view reviews for published projects"
  ON reviews FOR SELECT
  TO public
  USING (project_id IN (SELECT id FROM projects WHERE is_published = true));

CREATE POLICY "Anyone can submit reviews"
  ON reviews FOR INSERT
  TO public
  WITH CHECK (project_id IN (SELECT id FROM projects WHERE is_published = true));

-- RLS Policies for quick_feedback
CREATE POLICY "Anyone can view feedback for published projects"
  ON quick_feedback FOR SELECT
  TO public
  USING (project_id IN (SELECT id FROM projects WHERE is_published = true));

CREATE POLICY "Anyone can submit feedback"
  ON quick_feedback FOR INSERT
  TO public
  WITH CHECK (project_id IN (SELECT id FROM projects WHERE is_published = true));

-- RLS Policies for features
CREATE POLICY "Anyone can view features for published projects"
  ON features FOR SELECT
  TO public
  USING (project_id IN (SELECT id FROM projects WHERE is_published = true));

CREATE POLICY "Creators can manage features for own projects"
  ON features FOR INSERT
  TO authenticated
  WITH CHECK (project_id IN (
    SELECT p.id FROM projects p
    JOIN creator_profiles cp ON p.creator_id = cp.id
    WHERE cp.user_id = auth.uid()
  ));

CREATE POLICY "Creators can update features for own projects"
  ON features FOR UPDATE
  TO authenticated
  USING (project_id IN (
    SELECT p.id FROM projects p
    JOIN creator_profiles cp ON p.creator_id = cp.id
    WHERE cp.user_id = auth.uid()
  ))
  WITH CHECK (project_id IN (
    SELECT p.id FROM projects p
    JOIN creator_profiles cp ON p.creator_id = cp.id
    WHERE cp.user_id = auth.uid()
  ));

CREATE POLICY "Creators can delete features for own projects"
  ON features FOR DELETE
  TO authenticated
  USING (project_id IN (
    SELECT p.id FROM projects p
    JOIN creator_profiles cp ON p.creator_id = cp.id
    WHERE cp.user_id = auth.uid()
  ));

-- RLS Policies for milestones
CREATE POLICY "Anyone can view milestones for published projects"
  ON milestones FOR SELECT
  TO public
  USING (project_id IN (SELECT id FROM projects WHERE is_published = true));

CREATE POLICY "Creators can manage milestones for own projects"
  ON milestones FOR INSERT
  TO authenticated
  WITH CHECK (project_id IN (
    SELECT p.id FROM projects p
    JOIN creator_profiles cp ON p.creator_id = cp.id
    WHERE cp.user_id = auth.uid()
  ));

CREATE POLICY "Creators can update milestones for own projects"
  ON milestones FOR UPDATE
  TO authenticated
  USING (project_id IN (
    SELECT p.id FROM projects p
    JOIN creator_profiles cp ON p.creator_id = cp.id
    WHERE cp.user_id = auth.uid()
  ))
  WITH CHECK (project_id IN (
    SELECT p.id FROM projects p
    JOIN creator_profiles cp ON p.creator_id = cp.id
    WHERE cp.user_id = auth.uid()
  ));

CREATE POLICY "Creators can delete milestones for own projects"
  ON milestones FOR DELETE
  TO authenticated
  USING (project_id IN (
    SELECT p.id FROM projects p
    JOIN creator_profiles cp ON p.creator_id = cp.id
    WHERE cp.user_id = auth.uid()
  ));

-- RLS Policies for project_links
CREATE POLICY "Anyone can view links for published projects"
  ON project_links FOR SELECT
  TO public
  USING (project_id IN (SELECT id FROM projects WHERE is_published = true));

CREATE POLICY "Creators can manage links for own projects"
  ON project_links FOR INSERT
  TO authenticated
  WITH CHECK (project_id IN (
    SELECT p.id FROM projects p
    JOIN creator_profiles cp ON p.creator_id = cp.id
    WHERE cp.user_id = auth.uid()
  ));

CREATE POLICY "Creators can update links for own projects"
  ON project_links FOR UPDATE
  TO authenticated
  USING (project_id IN (
    SELECT p.id FROM projects p
    JOIN creator_profiles cp ON p.creator_id = cp.id
    WHERE cp.user_id = auth.uid()
  ))
  WITH CHECK (project_id IN (
    SELECT p.id FROM projects p
    JOIN creator_profiles cp ON p.creator_id = cp.id
    WHERE cp.user_id = auth.uid()
  ));

CREATE POLICY "Creators can delete links for own projects"
  ON project_links FOR DELETE
  TO authenticated
  USING (project_id IN (
    SELECT p.id FROM projects p
    JOIN creator_profiles cp ON p.creator_id = cp.id
    WHERE cp.user_id = auth.uid()
  ));

-- RLS Policies for project_analytics
CREATE POLICY "Creators can view analytics for own projects"
  ON project_analytics FOR SELECT
  TO authenticated
  USING (project_id IN (
    SELECT p.id FROM projects p
    JOIN creator_profiles cp ON p.creator_id = cp.id
    WHERE cp.user_id = auth.uid()
  ));

CREATE POLICY "Anyone can track page views"
  ON project_analytics FOR INSERT
  TO public
  WITH CHECK (project_id IN (SELECT id FROM projects WHERE is_published = true));

-- RLS Policies for donation_goals
CREATE POLICY "Anyone can view donation goals for published projects"
  ON donation_goals FOR SELECT
  TO public
  USING (
    (project_id IN (SELECT id FROM projects WHERE is_published = true))
    OR (feature_id IN (SELECT id FROM features WHERE project_id IN (SELECT id FROM projects WHERE is_published = true)))
    OR (milestone_id IN (SELECT id FROM milestones WHERE project_id IN (SELECT id FROM projects WHERE is_published = true)))
  );

CREATE POLICY "Creators can manage donation goals for own projects"
  ON donation_goals FOR INSERT
  TO authenticated
  WITH CHECK (
    (project_id IN (
      SELECT p.id FROM projects p
      JOIN creator_profiles cp ON p.creator_id = cp.id
      WHERE cp.user_id = auth.uid()
    ))
    OR (feature_id IN (
      SELECT f.id FROM features f
      JOIN projects p ON f.project_id = p.id
      JOIN creator_profiles cp ON p.creator_id = cp.id
      WHERE cp.user_id = auth.uid()
    ))
    OR (milestone_id IN (
      SELECT m.id FROM milestones m
      JOIN projects p ON m.project_id = p.id
      JOIN creator_profiles cp ON p.creator_id = cp.id
      WHERE cp.user_id = auth.uid()
    ))
  );

CREATE POLICY "Creators can update donation goals for own projects"
  ON donation_goals FOR UPDATE
  TO authenticated
  USING (
    (project_id IN (
      SELECT p.id FROM projects p
      JOIN creator_profiles cp ON p.creator_id = cp.id
      WHERE cp.user_id = auth.uid()
    ))
    OR (feature_id IN (
      SELECT f.id FROM features f
      JOIN projects p ON f.project_id = p.id
      JOIN creator_profiles cp ON p.creator_id = cp.id
      WHERE cp.user_id = auth.uid()
    ))
    OR (milestone_id IN (
      SELECT m.id FROM milestones m
      JOIN projects p ON m.project_id = p.id
      JOIN creator_profiles cp ON p.creator_id = cp.id
      WHERE cp.user_id = auth.uid()
    ))
  )
  WITH CHECK (
    (project_id IN (
      SELECT p.id FROM projects p
      JOIN creator_profiles cp ON p.creator_id = cp.id
      WHERE cp.user_id = auth.uid()
    ))
    OR (feature_id IN (
      SELECT f.id FROM features f
      JOIN projects p ON f.project_id = p.id
      JOIN creator_profiles cp ON p.creator_id = cp.id
      WHERE cp.user_id = auth.uid()
    ))
    OR (milestone_id IN (
      SELECT m.id FROM milestones m
      JOIN projects p ON m.project_id = p.id
      JOIN creator_profiles cp ON p.creator_id = cp.id
      WHERE cp.user_id = auth.uid()
    ))
  );

CREATE POLICY "Creators can delete donation goals for own projects"
  ON donation_goals FOR DELETE
  TO authenticated
  USING (
    (project_id IN (
      SELECT p.id FROM projects p
      JOIN creator_profiles cp ON p.creator_id = cp.id
      WHERE cp.user_id = auth.uid()
    ))
    OR (feature_id IN (
      SELECT f.id FROM features f
      JOIN projects p ON f.project_id = p.id
      JOIN creator_profiles cp ON p.creator_id = cp.id
      WHERE cp.user_id = auth.uid()
    ))
    OR (milestone_id IN (
      SELECT m.id FROM milestones m
      JOIN projects p ON m.project_id = p.id
      JOIN creator_profiles cp ON p.creator_id = cp.id
      WHERE cp.user_id = auth.uid()
    ))
  );

-- RLS Policies for donations
CREATE POLICY "Anyone can view donations for published projects"
  ON donations FOR SELECT
  TO public
  USING (goal_id IN (SELECT id FROM donation_goals));

CREATE POLICY "Anyone can make donations"
  ON donations FOR INSERT
  TO public
  WITH CHECK (goal_id IN (SELECT id FROM donation_goals));

-- RLS Policies for project_updates
CREATE POLICY "Anyone can view updates for published projects"
  ON project_updates FOR SELECT
  TO public
  USING (project_id IN (SELECT id FROM projects WHERE is_published = true));

CREATE POLICY "Creators can manage updates for own projects"
  ON project_updates FOR INSERT
  TO authenticated
  WITH CHECK (project_id IN (
    SELECT p.id FROM projects p
    JOIN creator_profiles cp ON p.creator_id = cp.id
    WHERE cp.user_id = auth.uid()
  ));

CREATE POLICY "Creators can update updates for own projects"
  ON project_updates FOR UPDATE
  TO authenticated
  USING (project_id IN (
    SELECT p.id FROM projects p
    JOIN creator_profiles cp ON p.creator_id = cp.id
    WHERE cp.user_id = auth.uid()
  ))
  WITH CHECK (project_id IN (
    SELECT p.id FROM projects p
    JOIN creator_profiles cp ON p.creator_id = cp.id
    WHERE cp.user_id = auth.uid()
  ));

CREATE POLICY "Creators can delete updates for own projects"
  ON project_updates FOR DELETE
  TO authenticated
  USING (project_id IN (
    SELECT p.id FROM projects p
    JOIN creator_profiles cp ON p.creator_id = cp.id
    WHERE cp.user_id = auth.uid()
  ));
