-- This is a simple SQL command to add the team ownership record
-- You can run this directly in your database client or with psql

-- Add user 1 as owner of team 1
INSERT INTO team_members (team_id, user_id, role, is_owner)
VALUES (1, 1, 'Owner', true)
ON CONFLICT (team_id, user_id) DO UPDATE 
SET role = 'Owner', is_owner = true; 