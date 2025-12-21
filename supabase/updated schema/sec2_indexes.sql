-- ============================================================================
-- SECTION 2: INDEXES
-- ============================================================================
-- Profiles (username & slug have auto-indexes from UNIQUE constraint)
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_is_creator ON profiles(is_creator) WHERE is_creator = true;
CREATE INDEX IF NOT EXISTS idx_profiles_is_idea_maker ON profiles(is_idea_maker) WHERE is_idea_maker = true;
CREATE INDEX IF NOT EXISTS idx_profiles_total_xp ON profiles(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_leaderboard_rank ON profiles(leaderboard_rank) WHERE leaderboard_rank IS NOT NULL;
-- Projects
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_published ON projects(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_projects_average_rating ON projects(average_rating DESC);
-- Reviews
CREATE INDEX IF NOT EXISTS idx_reviews_project_id ON reviews(project_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);
-- Quick Feedback
CREATE INDEX IF NOT EXISTS idx_quick_feedback_project_id ON quick_feedback(project_id);
CREATE INDEX IF NOT EXISTS idx_quick_feedback_user_id ON quick_feedback(user_id) WHERE user_id IS NOT NULL;
-- Project Ideas
CREATE INDEX IF NOT EXISTS idx_project_ideas_need_count ON project_ideas(need_count DESC);
CREATE INDEX IF NOT EXISTS idx_project_ideas_keywords ON project_ideas USING GIN(keywords);
-- Idea Reactions
CREATE INDEX IF NOT EXISTS idx_idea_reactions_project_id ON idea_reactions(project_id);
CREATE INDEX IF NOT EXISTS idx_idea_reactions_user_id ON idea_reactions(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_idea_reactions_session_id ON idea_reactions(session_id) WHERE session_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_idea_reactions_project_user_unique ON idea_reactions(project_id, user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_idea_reactions_project_session_unique ON idea_reactions(project_id, session_id) WHERE user_id IS NULL AND session_id IS NOT NULL;
-- Features
CREATE INDEX IF NOT EXISTS idx_features_project_id ON features(project_id);
-- Milestones
CREATE INDEX IF NOT EXISTS idx_milestones_project_id ON milestones(project_id);
-- Donation Goals
CREATE INDEX IF NOT EXISTS idx_donation_goals_project_id ON donation_goals(project_id);
CREATE INDEX IF NOT EXISTS idx_donation_goals_feature_id ON donation_goals(feature_id);
CREATE INDEX IF NOT EXISTS idx_donation_goals_milestone_id ON donation_goals(milestone_id);
-- Donations
CREATE INDEX IF NOT EXISTS idx_donations_goal_id ON donations(goal_id);
-- Project Links
CREATE INDEX IF NOT EXISTS idx_project_links_project_id ON project_links(project_id);
-- Project Analytics
CREATE INDEX IF NOT EXISTS idx_project_analytics_project_id ON project_analytics(project_id);
CREATE INDEX IF NOT EXISTS idx_project_analytics_visit_date ON project_analytics(visit_date DESC);
-- Project Updates
CREATE INDEX IF NOT EXISTS idx_project_updates_project_id ON project_updates(project_id);
CREATE INDEX IF NOT EXISTS idx_project_updates_published_at ON project_updates(published_at DESC);
-- Conversations
CREATE INDEX IF NOT EXISTS idx_conversations_participant_1 ON conversations(participant_1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_2 ON conversations(participant_2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);
-- Messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_unread ON messages(receiver_id, is_read) WHERE is_read = false;
-- Demo Views
CREATE INDEX IF NOT EXISTS idx_demo_views_project_id ON demo_views(project_id);
CREATE INDEX IF NOT EXISTS idx_demo_views_viewer_profile_id ON demo_views(viewer_profile_id) WHERE viewer_profile_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_demo_views_viewer_session_id ON demo_views(viewer_session_id) WHERE viewer_session_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_demo_views_unique_profile ON demo_views(project_id, viewer_profile_id) WHERE viewer_profile_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_demo_views_unique_session ON demo_views(project_id, viewer_session_id) WHERE viewer_session_id IS NOT NULL;