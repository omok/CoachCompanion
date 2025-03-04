-- Add lastUpdatedByUser column to all entity tables
-- This migration is idempotent (can be run multiple times safely)

-- Function to add lastUpdatedByUser column if it doesn't exist
CREATE OR REPLACE FUNCTION add_last_updated_by_user_column(table_name text)
RETURNS void AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = $1
        AND column_name = 'lastUpdatedByUser'
    ) THEN
        EXECUTE format('ALTER TABLE %I ADD COLUMN lastUpdatedByUser integer NOT NULL DEFAULT 1', $1);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Add column to each table
SELECT add_last_updated_by_user_column('users');
SELECT add_last_updated_by_user_column('teams');
SELECT add_last_updated_by_user_column('team_members');
SELECT add_last_updated_by_user_column('players');
SELECT add_last_updated_by_user_column('attendance');
SELECT add_last_updated_by_user_column('practice_notes');
SELECT add_last_updated_by_user_column('payments');

-- Remove the default value after all existing rows have been updated
DO $$ 
BEGIN
    ALTER TABLE users ALTER COLUMN lastUpdatedByUser DROP DEFAULT;
    ALTER TABLE teams ALTER COLUMN lastUpdatedByUser DROP DEFAULT;
    ALTER TABLE team_members ALTER COLUMN lastUpdatedByUser DROP DEFAULT;
    ALTER TABLE players ALTER COLUMN lastUpdatedByUser DROP DEFAULT;
    ALTER TABLE attendance ALTER COLUMN lastUpdatedByUser DROP DEFAULT;
    ALTER TABLE practice_notes ALTER COLUMN lastUpdatedByUser DROP DEFAULT;
    ALTER TABLE payments ALTER COLUMN lastUpdatedByUser DROP DEFAULT;
END $$;

-- Drop the helper function
DROP FUNCTION add_last_updated_by_user_column; 