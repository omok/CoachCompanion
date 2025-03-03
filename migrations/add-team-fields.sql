-- Add missing columns to teams table
ALTER TABLE teams ADD COLUMN IF NOT EXISTS season_start_date DATE;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS season_end_date DATE;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS team_fee NUMERIC; 