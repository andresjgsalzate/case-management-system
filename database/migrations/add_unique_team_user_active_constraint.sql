-- Migration: Add unique constraint for active team memberships
-- This prevents duplicate active memberships while allowing multiple inactive ones
-- TypeORM cannot create partial unique indexes, so this must be done manually

-- Drop the index if it exists (in case it was created manually before)
DROP INDEX IF EXISTS unique_team_user_active;

-- Create the partial unique index for active team memberships
CREATE UNIQUE INDEX unique_team_user_active 
ON team_members ("teamId", "userId") 
WHERE "isActive" = true;