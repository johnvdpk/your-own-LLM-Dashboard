-- Migration: Convert messages.content from TEXT/VARCHAR to JSONB
-- This preserves existing string data by converting it to JSON

-- Step 1: Add a temporary column with JSONB type
ALTER TABLE messages ADD COLUMN content_json JSONB;

-- Step 2: Convert existing string content to JSON (strings become JSON strings)
-- PostgreSQL will automatically convert text to JSONB
UPDATE messages SET content_json = to_jsonb(content);

-- Step 3: Drop the old column
ALTER TABLE messages DROP COLUMN content;

-- Step 4: Rename the new column to content
ALTER TABLE messages RENAME COLUMN content_json TO content;

-- Note: Prisma will handle NOT NULL constraint through schema

