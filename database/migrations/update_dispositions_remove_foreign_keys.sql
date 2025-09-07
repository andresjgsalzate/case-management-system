-- Migration: Remove foreign key constraints from dispositions table
-- This allows cases to be archived without constraint violations
-- while preserving historical disposition data

-- First, add the application_name column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'dispositions' 
        AND column_name = 'application_name'
    ) THEN
        ALTER TABLE dispositions 
        ADD COLUMN application_name VARCHAR(100);
    END IF;
END $$;

-- Populate application_name from the applications table before removing the foreign key
-- This preserves the historical data
UPDATE dispositions d
SET application_name = a.name
FROM applications a
WHERE d.application_id = a.id
AND d.application_name IS NULL;

-- Make application_name NOT NULL after populating the data
ALTER TABLE dispositions 
ALTER COLUMN application_name SET NOT NULL;

-- Drop foreign key constraints if they exist
-- We need to find the constraint names first
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Find and drop case foreign key constraint
    SELECT conname INTO constraint_name
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'dispositions'
    AND c.contype = 'f'
    AND EXISTS (
        SELECT 1 FROM pg_attribute a
        WHERE a.attrelid = t.oid
        AND a.attnum = ANY(c.conkey)
        AND a.attname = 'case_id'
    );
    
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE dispositions DROP CONSTRAINT ' || constraint_name;
    END IF;
    
    -- Find and drop application foreign key constraint
    SELECT conname INTO constraint_name
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'dispositions'
    AND c.contype = 'f'
    AND EXISTS (
        SELECT 1 FROM pg_attribute a
        WHERE a.attrelid = t.oid
        AND a.attnum = ANY(c.conkey)
        AND a.attname = 'application_id'
    );
    
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE dispositions DROP CONSTRAINT ' || constraint_name;
    END IF;

    -- Find and drop user foreign key constraint if needed for user_id
    SELECT conname INTO constraint_name
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'dispositions'
    AND c.contype = 'f'
    AND EXISTS (
        SELECT 1 FROM pg_attribute a
        WHERE a.attrelid = t.oid
        AND a.attnum = ANY(c.conkey)
        AND a.attname = 'user_id'
    );
    
    -- Note: We keep the user foreign key constraint as users shouldn't be deleted
    -- when archiving cases, only cases need to be deletable
END $$;

-- Optional: Make case_id and application_id nullable for flexibility
ALTER TABLE dispositions ALTER COLUMN case_id DROP NOT NULL;
ALTER TABLE dispositions ALTER COLUMN application_id DROP NOT NULL;

-- Add indexes for performance on the text fields
CREATE INDEX IF NOT EXISTS idx_dispositions_case_number ON dispositions(case_number);
CREATE INDEX IF NOT EXISTS idx_dispositions_application_name ON dispositions(application_name);

-- Add a comment to document the change
COMMENT ON TABLE dispositions IS 'Dispositions table modified to remove foreign key constraints on cases and applications. Historical data is preserved using case_number and application_name text fields to allow case archiving without constraint violations.';
