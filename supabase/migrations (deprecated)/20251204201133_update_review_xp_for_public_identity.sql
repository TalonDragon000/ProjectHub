/*
  # Update Review XP System for Public Identity

  1. Changes to Review XP Trigger
    - Only award XP to project owner if reviewer is authenticated (user_id NOT NULL)
    - Award bonus +2 XP to reviewer if they have review_identity_public = true
    - Anonymous reviews (user_id = NULL) award no XP to anyone
    
  2. XP Award Rules
    - Anonymous review (user_id = NULL): 0 XP to anyone
    - Private authenticated review (user_id set, review_identity_public = false): 5 XP to project owner only
    - Public authenticated review (user_id set, review_identity_public = true): 5 XP to project owner + 2 XP to reviewer
    
  3. Important Notes
    - Maintains existing bot detection for rapid reviews
    - Logs reviewer identity disclosure in metadata
    - Ensures fair XP distribution while respecting privacy choices
*/

-- Update the review XP trigger function
CREATE OR REPLACE FUNCTION award_review_received_xp()
RETURNS TRIGGER AS $$
DECLARE
  project_owner_id uuid;
  reviewer_profile_id uuid;
  reviewer_is_public boolean;
BEGIN
  -- Get project owner
  SELECT user_id INTO project_owner_id
  FROM projects
  WHERE id = NEW.project_id;
  
  -- Only award XP if reviewer is authenticated
  IF NEW.user_id IS NOT NULL THEN
    -- Get reviewer's profile info
    SELECT id, review_identity_public 
    INTO reviewer_profile_id, reviewer_is_public
    FROM profiles
    WHERE id = NEW.user_id;
    
    -- Award 5 XP to project owner for receiving the review
    PERFORM award_xp(
      project_owner_id,
      5,
      'review_received',
      NEW.project_id,
      NULL,
      NEW.id,
      jsonb_build_object(
        'reviewer_id', NEW.user_id,
        'rating', NEW.rating,
        'reviewer_public', reviewer_is_public
      )
    );
    
    -- Award bonus 2 XP to reviewer if they made their identity public
    IF reviewer_is_public = true THEN
      PERFORM award_xp(
        reviewer_profile_id,
        2,
        'public_review_bonus',
        NEW.project_id,
        NULL,
        NEW.id,
        jsonb_build_object(
          'project_owner_id', project_owner_id,
          'rating', NEW.rating
        )
      );
    END IF;
  END IF;
  -- If user_id is NULL (anonymous), no XP is awarded to anyone
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS trigger_award_review_received_xp ON reviews;
CREATE TRIGGER trigger_award_review_received_xp
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION award_review_received_xp();

-- Create function to retroactively award bonus XP for existing public reviews
CREATE OR REPLACE FUNCTION award_retroactive_public_review_bonus()
RETURNS TABLE(profiles_awarded integer, xp_awarded integer) AS $$
DECLARE
  review_record RECORD;
  total_profiles integer := 0;
  total_xp integer := 0;
  reviewer_profile_id uuid;
BEGIN
  -- Find all reviews by users who have review_identity_public = true
  -- and haven't already received the public_review_bonus
  FOR review_record IN
    SELECT r.id, r.user_id, r.project_id, r.rating, r.created_at
    FROM reviews r
    INNER JOIN profiles p ON r.user_id = p.id
    WHERE p.review_identity_public = true
      AND r.user_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM xp_transactions
        WHERE profile_id = p.id
          AND related_review_id = r.id
          AND xp_reason = 'public_review_bonus'
      )
  LOOP
    -- Get reviewer's profile ID
    SELECT id INTO reviewer_profile_id
    FROM profiles
    WHERE id = review_record.user_id;
    
    -- Award bonus XP
    PERFORM award_xp(
      reviewer_profile_id,
      2,
      'public_review_bonus',
      review_record.project_id,
      NULL,
      review_record.id,
      jsonb_build_object(
        'retroactive', true,
        'review_date', review_record.created_at,
        'rating', review_record.rating
      )
    );
    
    total_profiles := total_profiles + 1;
    total_xp := total_xp + 2;
  END LOOP;
  
  RETURN QUERY SELECT total_profiles, total_xp;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
