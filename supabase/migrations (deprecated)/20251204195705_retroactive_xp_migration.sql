/*
  # Retroactive XP Migration
  
  ## Overview
  Awards XP for all existing data in the system before the XP system was implemented.
  
  ## XP Awards
  
  1. **Existing Projects**
     - 50 XP for first published project per user
     - 10 XP for each additional published project
  
  2. **Existing Ideas**
     - 5 XP per idea submitted
  
  3. **Existing Idea Reactions**
     - 2 XP per reaction received (max 1 per reactor per idea)
  
  4. **Existing Reviews**
     - 5 XP per review received
  
  5. **Leaderboard Update**
     - Recalculate all ranks after XP is awarded
  
  ## Notes
  - This is a one-time migration
  - Does not trigger bot detection (historical data)
  - Uses the same award_xp function for consistency
*/

DO $$
DECLARE
  profile_record RECORD;
  project_record RECORD;
  idea_record RECORD;
  reaction_record RECORD;
  review_record RECORD;
  project_count integer;
  xp_to_award integer;
BEGIN
  
  -- Award XP for existing published projects
  RAISE NOTICE 'Awarding XP for existing published projects...';
  
  FOR profile_record IN 
    SELECT DISTINCT user_id FROM projects WHERE is_published = true
  LOOP
    project_count := 0;
    
    FOR project_record IN 
      SELECT id, name, created_at 
      FROM projects 
      WHERE user_id = profile_record.user_id 
        AND is_published = true
      ORDER BY created_at ASC
    LOOP
      project_count := project_count + 1;
      
      -- First project = 50 XP, rest = 10 XP
      IF project_count = 1 THEN
        xp_to_award := 50;
        
        PERFORM award_xp(
          profile_record.user_id,
          xp_to_award,
          'first_project_published',
          project_record.id,
          NULL,
          NULL,
          jsonb_build_object('project_name', project_record.name, 'retroactive', true)
        );
      ELSE
        xp_to_award := 10;
        
        PERFORM award_xp(
          profile_record.user_id,
          xp_to_award,
          'project_published',
          project_record.id,
          NULL,
          NULL,
          jsonb_build_object('project_name', project_record.name, 'retroactive', true)
        );
      END IF;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE 'Awarded XP for published projects.';
  
  -- Award XP for existing ideas
  RAISE NOTICE 'Awarding XP for existing ideas...';
  
  FOR idea_record IN 
    SELECT pi.id, pi.project_id, pi.problem_area, p.user_id 
    FROM project_ideas pi
    JOIN projects p ON p.id = pi.project_id
  LOOP
    PERFORM award_xp(
      idea_record.user_id,
      5,
      'idea_submitted',
      idea_record.project_id,
      idea_record.id,
      NULL,
      jsonb_build_object('problem_area', idea_record.problem_area, 'retroactive', true)
    );
  END LOOP;
  
  RAISE NOTICE 'Awarded XP for ideas.';
  
  -- Award XP for existing idea reactions
  RAISE NOTICE 'Awarding XP for existing idea reactions...';
  
  FOR reaction_record IN 
    SELECT DISTINCT 
      pi.id as idea_id,
      p.user_id as idea_owner_id,
      ir.user_id as reactor_profile_id,
      ir.reaction_type
    FROM idea_reactions ir
    JOIN project_ideas pi ON pi.project_id = ir.project_id
    JOIN projects p ON p.id = pi.project_id
  LOOP
    -- Check if we already awarded XP for this reaction
    IF NOT EXISTS (
      SELECT 1 FROM xp_transactions
      WHERE profile_id = reaction_record.idea_owner_id
        AND xp_reason = 'idea_reaction_received'
        AND related_idea_id = reaction_record.idea_id
        AND (
          (reaction_record.reactor_profile_id IS NOT NULL AND 
           metadata->>'reactor_profile_id' = reaction_record.reactor_profile_id::text)
          OR
          (reaction_record.reactor_profile_id IS NULL AND 
           metadata->>'reactor_profile_id' = 'anonymous')
        )
    ) THEN
      PERFORM award_xp(
        reaction_record.idea_owner_id,
        2,
        'idea_reaction_received',
        NULL,
        reaction_record.idea_id,
        NULL,
        jsonb_build_object(
          'reactor_profile_id', COALESCE(reaction_record.reactor_profile_id::text, 'anonymous'),
          'reaction_type', reaction_record.reaction_type,
          'retroactive', true
        )
      );
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Awarded XP for idea reactions.';
  
  -- Award XP for existing reviews
  RAISE NOTICE 'Awarding XP for existing reviews...';
  
  FOR review_record IN 
    SELECT r.id, r.project_id, r.user_id as reviewer_id, r.rating, p.user_id as project_owner_id
    FROM reviews r
    JOIN projects p ON p.id = r.project_id
    WHERE r.user_id IS NOT NULL
  LOOP
    PERFORM award_xp(
      review_record.project_owner_id,
      5,
      'review_received',
      review_record.project_id,
      NULL,
      review_record.id,
      jsonb_build_object(
        'reviewer_id', review_record.reviewer_id,
        'rating', review_record.rating,
        'retroactive', true
      )
    );
  END LOOP;
  
  RAISE NOTICE 'Awarded XP for reviews.';
  
  -- Update leaderboard ranks
  RAISE NOTICE 'Updating leaderboard ranks...';
  PERFORM update_leaderboard_ranks();
  RAISE NOTICE 'Leaderboard ranks updated.';
  
  RAISE NOTICE 'Retroactive XP migration completed successfully!';
  
END $$;
