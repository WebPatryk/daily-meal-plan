-- Migration: Disable RLS for Development
-- Purpose: Temporarily disable RLS for local development when auth is not yet implemented
-- NOTE: This should NEVER be deployed to production!
-- This is a temporary fix for local development only

-- Option 1: Add permissive policies that allow all operations for development
-- These policies will allow access without authentication check

-- Drop existing restrictive policies
drop policy if exists user_owns_week on weeks;
drop policy if exists user_owns_meal on meals;
drop policy if exists user_owns_goal on user_goals;

-- Create permissive policies for development
-- WARNING: These are ONLY for local development!

-- Weeks - allow all operations
create policy dev_access_weeks on weeks
  for all
  using (true)
  with check (true);

comment on policy dev_access_weeks on weeks is 
  'DEV ONLY: Allows all access to weeks for local development';

-- Meals - allow all operations
create policy dev_access_meals on meals
  for all
  using (true)
  with check (true);

comment on policy dev_access_meals on meals is 
  'DEV ONLY: Allows all access to meals for local development';

-- User Goals - allow all operations
create policy dev_access_goals on user_goals
  for all
  using (true)
  with check (true);

comment on policy dev_access_goals on user_goals is 
  'DEV ONLY: Allows all access to user goals for local development';



