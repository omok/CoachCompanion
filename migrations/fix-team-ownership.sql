-- This script adds a team membership record for the team owner (User ID 1, Team ID 1)

-- First, check if the user is already a team member
DO $$
DECLARE
    membership_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM team_members 
        WHERE team_id = 1 AND user_id = 1
    ) INTO membership_exists;
    
    IF membership_exists THEN
        -- Update existing membership to make sure it has Owner role
        UPDATE team_members
        SET role = 'Owner', is_owner = true
        WHERE team_id = 1 AND user_id = 1;
        
        RAISE NOTICE 'Updated existing team membership to Owner role.';
    ELSE
        -- Insert new team membership record
        INSERT INTO team_members (team_id, user_id, role, is_owner)
        VALUES (1, 1, 'Owner', true);
        
        RAISE NOTICE 'Added user as team owner.';
    END IF;
END $$;

-- Verify the result
SELECT * FROM team_members WHERE team_id = 1 AND user_id = 1; 