/*
  # Update Idea Sentiment Scale

  ## Overview
  Expands the project idea sentiment system from a binary hot/cold model to a
  3-tier scale (Need this / Curious / Rethink). Adds the necessary columns,
  updates the reaction enum, migrates existing data, and refreshes trigger logic.
*/

-- ============================================================================
-- STEP 1: ADD NEW SENTIMENT COLUMNS
-- ============================================================================

ALTER TABLE project_ideas
  ADD COLUMN IF NOT EXISTS need_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS curious_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rethink_count integer DEFAULT 0;

-- Backfill from legacy counts
UPDATE project_ideas
SET
  need_count = COALESCE(hot_count, 0),
  rethink_count = COALESCE(cold_count, 0)
WHERE need_count = 0 AND rethink_count = 0;

-- Optional curious_count remains 0 for now

-- Refresh indexes (replace hot_count index with need_count focus)
DROP INDEX IF EXISTS idx_project_ideas_hot_count;
CREATE INDEX IF NOT EXISTS idx_project_ideas_need_count ON project_ideas(need_count DESC);

-- Remove legacy columns now that data has been migrated
ALTER TABLE project_ideas
  DROP COLUMN IF EXISTS hot_count,
  DROP COLUMN IF EXISTS cold_count;

-- ============================================================================
-- STEP 2: UPDATE IDEA_REACTIONS ENUM + DATA
-- ============================================================================

-- Drop old check constraint before updating values
ALTER TABLE idea_reactions
  DROP CONSTRAINT IF EXISTS idea_reactions_reaction_type_check;

-- Map historic hot/cold reactions to new scale
UPDATE idea_reactions
SET reaction_type = CASE reaction_type
  WHEN 'hot' THEN 'need'
  WHEN 'cold' THEN 'rethink'
  ELSE reaction_type
END;

-- Add new constraint for 3-tier values
ALTER TABLE idea_reactions
  ADD CONSTRAINT idea_reactions_reaction_type_check
  CHECK (reaction_type IN ('need', 'curious', 'rethink'));

-- ============================================================================
-- STEP 3: REFRESH REACTION COUNT TRIGGER
-- ============================================================================

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
      IF OLD.reaction_type = 'need' THEN
        UPDATE project_ideas SET need_count = GREATEST(need_count - 1, 0) WHERE project_id = OLD.project_id;
      ELSIF OLD.reaction_type = 'curious' THEN
        UPDATE project_ideas SET curious_count = GREATEST(curious_count - 1, 0) WHERE project_id = OLD.project_id;
      ELSIF OLD.reaction_type = 'rethink' THEN
        UPDATE project_ideas SET rethink_count = GREATEST(rethink_count - 1, 0) WHERE project_id = OLD.project_id;
      END IF;

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
