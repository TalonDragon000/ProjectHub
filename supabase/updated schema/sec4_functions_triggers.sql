-- ============================================================================
-- SECTION 4: FUNCTIONS AND TRIGGERS
-- Safe to run multiple times - drops existing triggers before creating
-- ============================================================================

-- -----------------------------------------------------------------------------
-- 4.1 UTILITY FUNCTIONS
-- -----------------------------------------------------------------------------

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Calculate XP level from total XP
CREATE OR REPLACE FUNCTION calculate_xp_level(total_xp integer)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Level formula: Level = floor(sqrt(total_xp / 10)) + 1
  -- Requires 10 XP for level 2, 40 for level 3, 90 for level 4, etc.
  RETURN GREATEST(1, FLOOR(SQRT(total_xp / 10.0)) + 1);
END;
$$;

-- -----------------------------------------------------------------------------
-- 4.2 PROFILES TRIGGERS
-- -----------------------------------------------------------------------------

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 4.3 PROJECTS FUNCTIONS & TRIGGERS
-- -----------------------------------------------------------------------------

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Set is_creator flag when first project is published
CREATE OR REPLACE FUNCTION set_creator_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.is_published = true AND (OLD IS NULL OR OLD.is_published = false) THEN
    UPDATE profiles
    SET is_creator = true
    WHERE id = NEW.user_id
    AND is_creator = false;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_creator_on_publish ON projects;
CREATE TRIGGER set_creator_on_publish
  AFTER INSERT OR UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION set_creator_status();

-- -----------------------------------------------------------------------------
-- 4.4 REVIEWS FUNCTIONS & TRIGGERS
-- -----------------------------------------------------------------------------

DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update project rating and review count
CREATE OR REPLACE FUNCTION update_project_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  avg_rating numeric;
  review_count integer;
BEGIN
  -- Calculate new average and count for the affected project
  SELECT 
    COALESCE(AVG(rating), 0),
    COUNT(*)
  INTO avg_rating, review_count
  FROM reviews
  WHERE project_id = COALESCE(NEW.project_id, OLD.project_id);
  
  -- Update the project
  UPDATE projects
  SET 
    average_rating = ROUND(avg_rating, 2),
    total_reviews = review_count
  WHERE id = COALESCE(NEW.project_id, OLD.project_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS update_rating_on_review_change ON reviews;
CREATE TRIGGER update_rating_on_review_change
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_project_rating();

-- -----------------------------------------------------------------------------
-- 4.5 PROJECT IDEAS FUNCTIONS & TRIGGERS
-- -----------------------------------------------------------------------------

DROP TRIGGER IF EXISTS update_project_ideas_updated_at ON project_ideas;
CREATE TRIGGER update_project_ideas_updated_at
  BEFORE UPDATE ON project_ideas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Set is_idea_maker flag when idea is created
CREATE OR REPLACE FUNCTION set_idea_maker_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE profiles
  SET is_idea_maker = true
  WHERE id = (SELECT user_id FROM projects WHERE id = NEW.project_id)
  AND is_idea_maker = false;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_idea_maker_on_idea_create ON project_ideas;
CREATE TRIGGER set_idea_maker_on_idea_create
  AFTER INSERT ON project_ideas
  FOR EACH ROW
  EXECUTE FUNCTION set_idea_maker_status();

-- -----------------------------------------------------------------------------
-- 4.6 IDEA REACTIONS FUNCTIONS & TRIGGERS
-- -----------------------------------------------------------------------------

-- Update reaction counts on project_ideas
CREATE OR REPLACE FUNCTION update_idea_reaction_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.reaction_type = 'need' THEN
      UPDATE project_ideas SET need_count = need_count + 1 WHERE project_id = NEW.project_id;
    ELSIF NEW.reaction_type = 'curious' THEN
      UPDATE project_ideas SET curious_count = curious_count + 1 WHERE project_id = NEW.project_id;
    ELSIF NEW.reaction_type = 'rethink' THEN
      UPDATE project_ideas SET rethink_count = rethink_count + 1 WHERE project_id = NEW.project_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.reaction_type IS DISTINCT FROM NEW.reaction_type THEN
      -- Decrement old reaction type
      IF OLD.reaction_type = 'need' THEN
        UPDATE project_ideas SET need_count = GREATEST(need_count - 1, 0) WHERE project_id = OLD.project_id;
      ELSIF OLD.reaction_type = 'curious' THEN
        UPDATE project_ideas SET curious_count = GREATEST(curious_count - 1, 0) WHERE project_id = OLD.project_id;
      ELSIF OLD.reaction_type = 'rethink' THEN
        UPDATE project_ideas SET rethink_count = GREATEST(rethink_count - 1, 0) WHERE project_id = OLD.project_id;
      END IF;
      
      -- Increment new reaction type
      IF NEW.reaction_type = 'need' THEN
        UPDATE project_ideas SET need_count = need_count + 1 WHERE project_id = NEW.project_id;
      ELSIF NEW.reaction_type = 'curious' THEN
        UPDATE project_ideas SET curious_count = curious_count + 1 WHERE project_id = NEW.project_id;
      ELSIF NEW.reaction_type = 'rethink' THEN
        UPDATE project_ideas SET rethink_count = rethink_count + 1 WHERE project_id = NEW.project_id;
      END IF;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.reaction_type = 'need' THEN
      UPDATE project_ideas SET need_count = GREATEST(need_count - 1, 0) WHERE project_id = OLD.project_id;
    ELSIF OLD.reaction_type = 'curious' THEN
      UPDATE project_ideas SET curious_count = GREATEST(curious_count - 1, 0) WHERE project_id = OLD.project_id;
    ELSIF OLD.reaction_type = 'rethink' THEN
      UPDATE project_ideas SET rethink_count = GREATEST(rethink_count - 1, 0) WHERE project_id = OLD.project_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS update_reaction_counts_trigger ON idea_reactions;
CREATE TRIGGER update_reaction_counts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON idea_reactions
  FOR EACH ROW
  EXECUTE FUNCTION update_idea_reaction_counts();

-- -----------------------------------------------------------------------------
-- 4.7 MESSAGES FUNCTIONS & TRIGGERS
-- -----------------------------------------------------------------------------

DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update conversation last_message_at when message is sent
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_conversation_on_message ON messages;
CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- -----------------------------------------------------------------------------
-- 4.8 XP SYSTEM FUNCTIONS
-- -----------------------------------------------------------------------------

-- Award XP function
CREATE OR REPLACE FUNCTION award_xp(
  profile_uuid uuid,
  xp_amount integer,
  xp_reason text,
  related_entity_id uuid DEFAULT NULL,
  related_entity_type text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  new_total_xp integer;
  new_level integer;
BEGIN
  -- Update profile XP
  UPDATE profiles
  SET 
    total_xp = total_xp + xp_amount,
    last_xp_award_at = now()
  WHERE id = profile_uuid
  RETURNING total_xp INTO new_total_xp;
  
  -- Calculate and update level
  new_level := calculate_xp_level(new_total_xp);
  
  UPDATE profiles
  SET xp_level = new_level
  WHERE id = profile_uuid;
END;
$$;

-- Award XP when project is published
CREATE OR REPLACE FUNCTION award_project_publish_xp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  project_count integer;
  xp_to_award integer;
BEGIN
  IF NEW.is_published = true AND (OLD IS NULL OR OLD.is_published = false) THEN
    -- Count published projects for this user
    SELECT COUNT(*) INTO project_count
    FROM projects
    WHERE user_id = NEW.user_id AND is_published = true;
    
    -- First project = 50 XP, subsequent = 10 XP
    IF project_count = 1 THEN
      xp_to_award := 50;
    ELSE
      xp_to_award := 10;
    END IF;
    
    PERFORM award_xp(NEW.user_id, xp_to_award, 'project_published', NEW.id, 'project');
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS award_xp_on_project_publish ON projects;
CREATE TRIGGER award_xp_on_project_publish
  AFTER INSERT OR UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION award_project_publish_xp();

-- Award XP when idea is submitted
CREATE OR REPLACE FUNCTION award_idea_submission_xp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  project_owner_id uuid;
BEGIN
  -- Get project owner
  SELECT user_id INTO project_owner_id
  FROM projects
  WHERE id = NEW.project_id;
  
  -- Award 5 XP for submitting an idea
  PERFORM award_xp(project_owner_id, 5, 'idea_submitted', NEW.id, 'project_idea');
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS award_xp_on_idea_submission ON project_ideas;
CREATE TRIGGER award_xp_on_idea_submission
  AFTER INSERT ON project_ideas
  FOR EACH ROW
  EXECUTE FUNCTION award_idea_submission_xp();

-- Award XP when idea receives reaction (to project owner)
CREATE OR REPLACE FUNCTION award_idea_reaction_xp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  project_owner_id uuid;
  reactor_profile_id uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Get project owner
    SELECT p.user_id INTO project_owner_id
    FROM projects p
    WHERE p.id = NEW.project_id;
    
    -- Get reactor's profile (if authenticated)
    reactor_profile_id := NEW.user_id;
    
    -- Award 2 XP to project owner (max 1 per user per idea)
    -- Only award if reactor is different from owner
    IF reactor_profile_id IS NOT NULL AND reactor_profile_id != project_owner_id THEN
      -- Check if this is the first reaction from this user on this project
      IF NOT EXISTS (
        SELECT 1 FROM idea_reactions
        WHERE project_id = NEW.project_id
        AND user_id = reactor_profile_id
        AND id != NEW.id
      ) THEN
        PERFORM award_xp(project_owner_id, 2, 'idea_reaction_received', NEW.project_id, 'project');
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS award_xp_on_idea_reaction ON idea_reactions;
CREATE TRIGGER award_xp_on_idea_reaction
  AFTER INSERT ON idea_reactions
  FOR EACH ROW
  EXECUTE FUNCTION award_idea_reaction_xp();

-- Award XP when review is received (to project owner)
CREATE OR REPLACE FUNCTION award_review_received_xp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  project_owner_id uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Get project owner
    SELECT user_id INTO project_owner_id
    FROM projects
    WHERE id = NEW.project_id;
    
    -- Award 5 XP for receiving a review
    PERFORM award_xp(project_owner_id, 5, 'review_received', NEW.id, 'review');
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS award_xp_on_review_received ON reviews;
CREATE TRIGGER award_xp_on_review_received
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION award_review_received_xp();

-- -----------------------------------------------------------------------------
-- 4.9 HELPER FUNCTIONS
-- -----------------------------------------------------------------------------

-- Record demo view and award XP (max 1 per viewer per project)
CREATE OR REPLACE FUNCTION record_demo_view_and_award_xp(
  p_project_id uuid,
  p_viewer_profile_id uuid DEFAULT NULL,
  p_viewer_session_id text DEFAULT NULL,
  p_link_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  project_owner_id uuid;
  is_first_view boolean;
BEGIN
  -- Check if this is first view
  is_first_view := NOT EXISTS (
    SELECT 1 FROM demo_views
    WHERE project_id = p_project_id
    AND (
      (viewer_profile_id = p_viewer_profile_id AND p_viewer_profile_id IS NOT NULL) OR
      (viewer_session_id = p_viewer_session_id AND p_viewer_session_id IS NOT NULL)
    )
  );
  
  IF is_first_view THEN
    -- Insert demo view
    INSERT INTO demo_views (project_id, viewer_profile_id, viewer_session_id, link_id)
    VALUES (p_project_id, p_viewer_profile_id, p_viewer_session_id, p_link_id);
    
    -- Get project owner
    SELECT user_id INTO project_owner_id
    FROM projects
    WHERE id = p_project_id;
    
    -- Award 1 XP to project owner
    -- Only if viewer is not the owner
    IF p_viewer_profile_id IS NULL OR p_viewer_profile_id != project_owner_id THEN
      PERFORM award_xp(project_owner_id, 1, 'demo_view_received', p_project_id, 'project');
    END IF;
    
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Increment link click count
CREATE OR REPLACE FUNCTION increment_link_click_count(link_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE project_links
  SET click_count = click_count + 1
  WHERE id = link_uuid;
END;
$$;

-- Get unread message count for a user
CREATE OR REPLACE FUNCTION get_unread_message_count(user_profile_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  unread_count integer;
BEGIN
  SELECT COUNT(*)
  INTO unread_count
  FROM messages
  WHERE receiver_id = user_profile_id
  AND is_read = false;
  
  RETURN unread_count;
END;
$$;

-- Get or create conversation between two users
CREATE OR REPLACE FUNCTION get_or_create_conversation(
  user1_profile_id uuid,
  user2_profile_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  conversation_id uuid;
  participant_1 uuid;
  participant_2 uuid;
BEGIN
  -- Ensure ordered participants (smaller UUID first)
  IF user1_profile_id < user2_profile_id THEN
    participant_1 := user1_profile_id;
    participant_2 := user2_profile_id;
  ELSE
    participant_1 := user2_profile_id;
    participant_2 := user1_profile_id;
  END IF;
  
  -- Try to find existing conversation
  SELECT id INTO conversation_id
  FROM conversations
  WHERE participant_1_id = participant_1
  AND participant_2_id = participant_2;
  
  -- Create if doesn't exist
  IF conversation_id IS NULL THEN
    INSERT INTO conversations (participant_1_id, participant_2_id)
    VALUES (participant_1, participant_2)
    RETURNING id INTO conversation_id;
  END IF;
  
  RETURN conversation_id;
END;
$$;

-- -----------------------------------------------------------------------------
-- 4.10 AUTH & SIGNUP FUNCTIONS (CRITICAL FOR USER REGISTRATION)
-- -----------------------------------------------------------------------------

-- Generate unique username from display name
CREATE OR REPLACE FUNCTION generate_username_from_display_name(display_name_input text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  base_username text;
  final_username text;
  counter int := 1;
BEGIN
  -- Convert display name to lowercase, replace spaces with hyphens, remove special chars
  base_username := lower(regexp_replace(display_name_input, '[^a-zA-Z0-9\s-]', '', 'g'));
  base_username := regexp_replace(base_username, '\s+', '-', 'g');
  base_username := regexp_replace(base_username, '-+', '-', 'g');
  base_username := trim(both '-' from base_username);
  
  -- Ensure it's not empty
  IF base_username = '' THEN
    base_username := 'user';
  END IF;
  
  -- Start with base username
  final_username := base_username;
  
  -- Check for uniqueness and append number if needed
  WHILE EXISTS (SELECT 1 FROM profiles WHERE username = final_username) LOOP
    final_username := base_username || '-' || counter;
    counter := counter + 1;
  END LOOP;
  
  RETURN final_username;
END;
$$;

-- Automatically create profile when new user signs up
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  display_name_var text;
  username_var text;
BEGIN
  -- Get display name from user metadata or email
  display_name_var := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    split_part(NEW.email, '@', 1)
  );
  
  -- Generate unique username
  username_var := generate_username_from_display_name(display_name_var);
  
  -- Create profile for new user
  INSERT INTO profiles (user_id, display_name, username)
  VALUES (NEW.id, display_name_var, username_var);
  
  RETURN NEW;
END;
$$;

-- Trigger: Auto-create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_profile_for_user();

-- ============================================================================
-- SCHEMA SETUP COMPLETE
-- ============================================================================
-- 
-- To use this schema:
-- 1. Run sec1_tables.sql (creates all tables)
-- 2. Run sec2_indexes.sql (creates all indexes)
-- 3. Run sec3_rls_policies.sql (sets up row level security)
-- 4. Run sec4_functions_triggers.sql (this file - creates functions & triggers)
-- 5. Run sec5_frontend_rpc_functions.sql (additional RPC functions for frontend)
-- 
-- All sections use IF NOT EXISTS / DROP IF EXISTS, making them safe to re-run.
-- ============================================================================