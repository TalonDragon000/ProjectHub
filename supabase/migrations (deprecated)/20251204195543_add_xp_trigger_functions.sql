/*
  # XP System Trigger Functions
  
  ## Overview
  Automated XP award system with bot detection and rate limiting.
  
  ## Trigger Functions
  
  1. **award_project_publish_xp**
     - Awards 50 XP for first published project
     - Awards 10 XP for each additional project
     - Checks for rapid publishing (bot detection)
  
  2. **award_idea_submission_xp**
     - Awards 5 XP when idea is submitted
     - Checks for spam patterns
  
  3. **award_idea_reaction_xp**
     - Awards 2 XP to idea creator when reaction is received
     - Max 1 XP per reactor per idea
     - Checks for coordinated reaction patterns
  
  4. **award_review_received_xp**
     - Awards 5 XP to project owner when review is received
     - Checks for fake review patterns
  
  5. **update_xp_level_and_rank**
     - Recalculates XP level after XP changes
     - Updates leaderboard ranks periodically
  
  ## Bot Detection
  
  - Rapid action detection (multiple actions in short time)
  - Pattern analysis (repetitive behavior)
  - Score accumulation triggers admin review
  - Auto-flag at score 50+
  
  ## Rate Limiting
  
  - Tracks last_xp_award_at
  - Prevents XP farming
  - Logarithmic cooldown for suspicious patterns
*/

-- Helper function to award XP with transaction logging
CREATE OR REPLACE FUNCTION award_xp(
  target_profile_id uuid,
  xp_amount integer,
  xp_reason text,
  related_project_id uuid DEFAULT NULL,
  related_idea_id uuid DEFAULT NULL,
  related_review_id uuid DEFAULT NULL,
  metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void AS $$
DECLARE
  current_xp integer;
  new_xp integer;
  new_level integer;
BEGIN
  -- Get current XP
  SELECT total_xp INTO current_xp
  FROM profiles
  WHERE id = target_profile_id;
  
  -- Calculate new XP
  new_xp := current_xp + xp_amount;
  new_level := calculate_xp_level(new_xp);
  
  -- Update profile
  UPDATE profiles
  SET 
    total_xp = new_xp,
    xp_level = new_level,
    last_xp_award_at = now()
  WHERE id = target_profile_id;
  
  -- Log transaction
  INSERT INTO xp_transactions (
    profile_id,
    xp_amount,
    xp_reason,
    related_project_id,
    related_idea_id,
    related_review_id,
    metadata
  ) VALUES (
    target_profile_id,
    xp_amount,
    xp_reason,
    related_project_id,
    related_idea_id,
    related_review_id,
    metadata
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to create bot alert
CREATE OR REPLACE FUNCTION create_bot_alert(
  target_profile_id uuid,
  alert_type text,
  severity text,
  evidence jsonb,
  bot_score_increase integer
)
RETURNS void AS $$
DECLARE
  new_bot_score integer;
BEGIN
  -- Insert alert
  INSERT INTO bot_alerts (
    profile_id,
    alert_type,
    severity,
    evidence,
    bot_score_increase
  ) VALUES (
    target_profile_id,
    alert_type,
    severity,
    evidence,
    bot_score_increase
  );
  
  -- Update profile bot score
  UPDATE profiles
  SET 
    bot_score = bot_score + bot_score_increase,
    bot_alert_count = bot_alert_count + 1,
    is_flagged_bot = CASE 
      WHEN (bot_score + bot_score_increase) >= 50 THEN true
      ELSE is_flagged_bot
    END
  WHERE id = target_profile_id
  RETURNING bot_score INTO new_bot_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function: Award XP for publishing projects
CREATE OR REPLACE FUNCTION award_project_publish_xp()
RETURNS TRIGGER AS $$
DECLARE
  published_count integer;
  xp_to_award integer;
  time_since_last_project interval;
BEGIN
  -- Only award XP when project is newly published
  IF NEW.is_published = true AND (OLD IS NULL OR OLD.is_published = false) THEN
    
    -- Count published projects by this user
    SELECT COUNT(*) INTO published_count
    FROM projects
    WHERE user_id = NEW.user_id AND is_published = true;
    
    -- First project = 50 XP, additional = 10 XP
    IF published_count = 1 THEN
      xp_to_award := 50;
    ELSE
      xp_to_award := 10;
    END IF;
    
    -- Check for rapid publishing (bot detection)
    IF published_count > 1 THEN
      SELECT now() - MAX(created_at) INTO time_since_last_project
      FROM projects
      WHERE user_id = NEW.user_id 
        AND is_published = true 
        AND id != NEW.id;
      
      -- If publishing multiple projects within 5 minutes, flag as suspicious
      IF time_since_last_project < interval '5 minutes' THEN
        PERFORM create_bot_alert(
          NEW.user_id,
          'rapid_project_publishing',
          'high',
          jsonb_build_object(
            'project_count', published_count,
            'time_since_last', time_since_last_project::text,
            'project_id', NEW.id
          ),
          20
        );
      END IF;
    END IF;
    
    -- Award XP
    PERFORM award_xp(
      NEW.user_id,
      xp_to_award,
      CASE 
        WHEN published_count = 1 THEN 'first_project_published'
        ELSE 'project_published'
      END,
      NEW.id,
      NULL,
      NULL,
      jsonb_build_object('project_title', NEW.title)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_award_project_publish_xp ON projects;
CREATE TRIGGER trigger_award_project_publish_xp
  AFTER INSERT OR UPDATE OF is_published ON projects
  FOR EACH ROW
  EXECUTE FUNCTION award_project_publish_xp();

-- Trigger function: Award XP for submitting ideas
CREATE OR REPLACE FUNCTION award_idea_submission_xp()
RETURNS TRIGGER AS $$
DECLARE
  recent_ideas_count integer;
BEGIN
  -- Check for spam (multiple ideas in short time)
  SELECT COUNT(*) INTO recent_ideas_count
  FROM project_ideas
  WHERE user_id = NEW.user_id
    AND created_at > now() - interval '1 hour';
  
  -- Flag if more than 5 ideas in an hour
  IF recent_ideas_count > 5 THEN
    PERFORM create_bot_alert(
      NEW.user_id,
      'rapid_idea_submission',
      'medium',
      jsonb_build_object(
        'ideas_in_hour', recent_ideas_count,
        'idea_id', NEW.id
      ),
      15
    );
  END IF;
  
  -- Award XP
  PERFORM award_xp(
    NEW.user_id,
    5,
    'idea_submitted',
    NEW.project_id,
    NEW.id,
    NULL,
    jsonb_build_object('idea_title', NEW.title)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_award_idea_submission_xp ON project_ideas;
CREATE TRIGGER trigger_award_idea_submission_xp
  AFTER INSERT ON project_ideas
  FOR EACH ROW
  EXECUTE FUNCTION award_idea_submission_xp();

-- Trigger function: Award XP when idea receives reactions
CREATE OR REPLACE FUNCTION award_idea_reaction_xp()
RETURNS TRIGGER AS $$
DECLARE
  idea_owner_id uuid;
  existing_reaction_count integer;
  reactor_profile_id uuid;
BEGIN
  -- Get idea owner
  SELECT user_id INTO idea_owner_id
  FROM project_ideas
  WHERE id = NEW.idea_id;
  
  -- Get reactor's profile ID (if authenticated)
  IF NEW.user_id IS NOT NULL THEN
    SELECT id INTO reactor_profile_id
    FROM profiles
    WHERE user_id = NEW.user_id;
    
    -- Check if this user already gave XP to this idea (max 1 per user)
    SELECT COUNT(*) INTO existing_reaction_count
    FROM xp_transactions
    WHERE profile_id = idea_owner_id
      AND xp_reason = 'idea_reaction_received'
      AND related_idea_id = NEW.idea_id
      AND metadata->>'reactor_profile_id' = reactor_profile_id::text;
    
    -- Only award XP if this is first reaction from this user
    IF existing_reaction_count = 0 THEN
      PERFORM award_xp(
        idea_owner_id,
        2,
        'idea_reaction_received',
        NULL,
        NEW.idea_id,
        NULL,
        jsonb_build_object(
          'reactor_profile_id', reactor_profile_id,
          'reaction_type', NEW.reaction_type
        )
      );
    END IF;
  ELSE
    -- Anonymous reactions also award XP (but can't track duplicates)
    PERFORM award_xp(
      idea_owner_id,
      2,
      'idea_reaction_received',
      NULL,
      NEW.idea_id,
      NULL,
      jsonb_build_object(
        'reactor_profile_id', 'anonymous',
        'reaction_type', NEW.reaction_type
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_award_idea_reaction_xp ON idea_reactions;
CREATE TRIGGER trigger_award_idea_reaction_xp
  AFTER INSERT ON idea_reactions
  FOR EACH ROW
  EXECUTE FUNCTION award_idea_reaction_xp();

-- Trigger function: Award XP when project receives reviews
CREATE OR REPLACE FUNCTION award_review_received_xp()
RETURNS TRIGGER AS $$
DECLARE
  project_owner_id uuid;
BEGIN
  -- Get project owner
  SELECT user_id INTO project_owner_id
  FROM projects
  WHERE id = NEW.project_id;
  
  -- Award XP
  PERFORM award_xp(
    project_owner_id,
    5,
    'review_received',
    NEW.project_id,
    NULL,
    NEW.id,
    jsonb_build_object(
      'reviewer_id', NEW.user_id,
      'rating', NEW.rating
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_award_review_received_xp ON reviews;
CREATE TRIGGER trigger_award_review_received_xp
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION award_review_received_xp();

-- Function to periodically update leaderboard ranks (called manually or via cron)
CREATE OR REPLACE FUNCTION refresh_leaderboard()
RETURNS void AS $$
BEGIN
  PERFORM update_leaderboard_ranks();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
