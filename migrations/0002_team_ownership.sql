-- Migration to ensure team ownership records exist
-- This migration is idempotent (can be run multiple times safely)

DO $$
DECLARE
    ownership_exists BOOLEAN;
BEGIN
    -- Check if the user is already a team member
    SELECT EXISTS (
        SELECT 1 FROM team_members 
        WHERE team_id = 1 AND user_id = 1 AND role = 'Owner' AND is_owner = true
    ) INTO ownership_exists;
    
    -- If not, add the ownership record
    IF NOT ownership_exists THEN
        INSERT INTO team_members (team_id, user_id, role, is_owner, "lastUpdatedByUser")
        VALUES (1, 1, 'Owner', true, 1);
        
        RAISE NOTICE 'Added ownership record for user 1 on team 1';
    ELSE
        RAISE NOTICE 'Ownership record already exists for user 1 on team 1';
    END IF;
END $$;
