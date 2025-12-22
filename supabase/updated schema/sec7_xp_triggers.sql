-- Award XP to reviewers when they post reviews
CREATE OR REPLACE FUNCTION award_reviewer_xp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  xp_to_award integer;
BEGIN
  -- Only award XP if user_id is set (not anonymous)
  IF NEW.user_id IS NOT NULL THEN
    -- Base XP: 3 XP for writing a review
    xp_to_award := 3;
    
    -- Bonus XP: +2 XP for public identity
    IF NEW.review_identity_public = true THEN
      xp_to_award := xp_to_award + 2;
    END IF;
    
    PERFORM award_xp(NEW.user_id, xp_to_award, 'review_written', NEW.id, 'review');
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS award_reviewer_xp_on_review ON reviews;
CREATE TRIGGER award_reviewer_xp_on_review
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION award_reviewer_xp();

-- Award XP to validators when they give idea reactions
CREATE OR REPLACE FUNCTION award_validator_xp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Only award XP if user_id is set (logged-in users)
  IF NEW.user_id IS NOT NULL THEN
    -- Award 1 XP for validating an idea
    PERFORM award_xp(NEW.user_id, 1, 'idea_validated', NEW.id, 'idea_reaction');
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS award_validator_xp_on_reaction ON idea_reactions;
CREATE TRIGGER award_validator_xp_on_reaction
  AFTER INSERT ON idea_reactions
  FOR EACH ROW
  EXECUTE FUNCTION award_validator_xp();

-- Award XP to commenters when they post feedback
CREATE OR REPLACE FUNCTION award_feedback_xp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  xp_to_award integer;
BEGIN
  -- Only award XP if user_id is set (not anonymous)
  IF NEW.user_id IS NOT NULL THEN
    -- Base XP: 2 XP for posting feedback
    xp_to_award := 2;
    
    -- Bonus XP: +1 XP for public identity
    IF NEW.feedback_identity_public = true THEN
      xp_to_award := xp_to_award + 1;
    END IF;
    
    PERFORM award_xp(NEW.user_id, xp_to_award, 'feedback_posted', NEW.id, 'quick_feedback');
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS award_feedback_xp_on_post ON quick_feedback;
CREATE TRIGGER award_feedback_xp_on_post
  AFTER INSERT ON quick_feedback
  FOR EACH ROW
  EXECUTE FUNCTION award_feedback_xp();

-- Handle XP recalculation on edit (for reviews)
CREATE OR REPLACE FUNCTION recalculate_review_xp_on_edit(
  p_review_id uuid,
  p_old_user_id uuid,
  p_new_user_id uuid,
  p_review_identity_public boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  old_xp integer := 0;
  new_xp integer := 0;
BEGIN
  -- Calculate old XP (what was awarded)
  IF p_old_user_id IS NOT NULL THEN
    old_xp := 3;  -- Base
    -- Check old review_identity_public value
    SELECT CASE WHEN review_identity_public THEN 2 ELSE 0 END
    INTO old_xp
    FROM reviews WHERE id = p_review_id;
    old_xp := 3 + COALESCE(old_xp, 0);
  END IF;
  
  -- Calculate new XP (what should be awarded)
  IF p_new_user_id IS NOT NULL THEN
    new_xp := 3;  -- Base
    IF p_review_identity_public = true THEN
      new_xp := new_xp + 2;  -- Bonus
    END IF;
  END IF;
  
  -- Adjust XP
  IF p_old_user_id IS NOT NULL AND old_xp > 0 THEN
    -- Remove old XP
    PERFORM award_xp(p_old_user_id, -old_xp, 'review_edit_adjustment', p_review_id, 'review');
  END IF;
  
  IF p_new_user_id IS NOT NULL AND new_xp > 0 THEN
    -- Award new XP
    PERFORM award_xp(p_new_user_id, new_xp, 'review_edit_adjustment', p_review_id, 'review');
  END IF;
END;
$$;