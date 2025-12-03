-- Migration: Fix Meal Types
-- Purpose: Update meal_type_enum to match the application code
-- Changes: Replace 'snack1', 'snack2' with 'second_breakfast', 'snack'
-- Affected Tables: meals

-- Step 1: Create a new temporary enum with correct values
create type meal_type_enum_new as enum ('breakfast', 'second_breakfast', 'lunch', 'snack', 'dinner');

-- Step 2: Update meals table to use the new enum
-- First, convert the column to text temporarily
alter table meals alter column meal_type type text using meal_type::text;

-- Step 3: Drop the old enum type
drop type meal_type_enum;

-- Step 4: Rename the new enum to the original name
alter type meal_type_enum_new rename to meal_type_enum;

-- Step 5: Convert the column back to the new enum type
alter table meals alter column meal_type type meal_type_enum using meal_type::meal_type_enum;

-- Note: This migration assumes no existing data with 'snack1' or 'snack2' values
-- If you have existing data, you would need to update it first with something like:
-- update meals set meal_type = 'second_breakfast' where meal_type = 'snack1';
-- update meals set meal_type = 'snack' where meal_type = 'snack2';



