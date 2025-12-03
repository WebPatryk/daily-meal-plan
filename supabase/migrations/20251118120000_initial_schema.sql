-- Migration: Initial Schema Setup
-- Purpose: Create the complete database schema for the daily meal plan application
-- Affected Tables: users (auth), weeks, meals, user_goals
-- Special Considerations: 
--   - Users table is managed by Supabase Auth
--   - RLS policies are applied to all user-specific tables
--   - Trigger ensures week exists before inserting meals

-- ============================================================
-- 1. CREATE ENUMERATIONS
-- ============================================================

-- day_of_week_enum: Defines days of the week for meal planning
do $$
begin
  create type day_of_week_enum as enum ('monday','tuesday','wednesday','thursday','friday','saturday','sunday');
exception when duplicate_object then null;
end$$;

-- meal_type_enum: Defines types of meals that can be planned
do $$
begin
  create type meal_type_enum as enum ('breakfast','lunch','dinner','snack1','snack2');
exception when duplicate_object then null;
end$$;

-- ============================================================
-- 2. CREATE TABLES
-- ============================================================

-- weeks: Stores weekly planning periods for each user
-- Each week starts on Monday (ISO 8601)
-- One user can have only one week per start_date
create table if not exists weeks (
  week_id bigint primary key generated always as identity,
  user_id uuid not null references auth.users(id) on delete cascade,
  start_date date not null, -- Monday of the ISO week
  created_at timestamptz not null default now(),
  
  -- Constraint: One week per user per start date
  constraint unique_user_week unique (user_id, start_date)
);

comment on table weeks is 'Stores weekly planning periods for users, starting on Monday';
comment on column weeks.start_date is 'Monday of the ISO week';
comment on column weeks.user_id is 'References auth.users, cascades on delete';

-- meals: Stores individual meal entries for each day and meal type
-- Each meal belongs to a specific week and user
-- Contains nutritional information and AI-generated data
create table if not exists meals (
  meal_id bigint primary key generated always as identity,
  user_id uuid not null references auth.users(id) on delete cascade,
  week_id bigint not null references weeks(week_id) on delete cascade,
  day_of_week day_of_week_enum not null,
  meal_type meal_type_enum null, -- NULL when slot is empty
  kcal smallint check (kcal between 1 and 3000),
  protein smallint check (protein between 1 and 300),
  image_path text,
  source varchar(12) not null check (source in ('manual','ai_generated')),
  ai_proposition jsonb, -- Stores full AI response when applicable
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  -- Constraint: No duplicate slots for the same user, week, day, and meal type
  constraint unique_meal_slot unique (user_id, week_id, day_of_week, meal_type)
);

comment on table meals is 'Stores individual meal entries with nutritional information';
comment on column meals.meal_type is 'NULL indicates an empty meal slot';
comment on column meals.kcal is 'Calories, valid range 1-3000';
comment on column meals.protein is 'Protein in grams, valid range 1-300';
comment on column meals.source is 'Origin of the meal: manual entry or AI generated';
comment on column meals.ai_proposition is 'Full AI response data when meal is AI-generated';

-- user_goals: Stores historical and current nutritional goals for users
-- Each user can have multiple goals over time
-- Only one goal should have valid_to = NULL (current goal)
create table if not exists user_goals (
  goal_id bigint primary key generated always as identity,
  user_id uuid not null references auth.users(id) on delete cascade,
  kcal_target smallint not null check (kcal_target between 1 and 3000),
  protein_target smallint not null check (protein_target between 1 and 300),
  valid_from timestamptz not null,
  valid_to timestamptz, -- NULL indicates current active goal
  created_at timestamptz not null default now(),
  
  -- Constraint: Ensure valid_to is after valid_from
  constraint valid_date_range check (valid_to is null or valid_to > valid_from)
);

comment on table user_goals is 'Stores historical and current nutritional goals for users';
comment on column user_goals.valid_to is 'NULL indicates this is the current active goal';
comment on column user_goals.kcal_target is 'Daily calorie target, valid range 1-3000';
comment on column user_goals.protein_target is 'Daily protein target in grams, valid range 1-300';

-- ============================================================
-- 3. CREATE INDEXES
-- ============================================================

-- Index for efficient querying of meals by user, week, and day
-- Supports common query patterns when displaying weekly meal plans
create index if not exists idx_meals_user_week_day 
  on meals(user_id, week_id, day_of_week);

-- Index for recent meals (last 7 days)
-- Optimizes queries for the current/most recent week
-- Note: Partial indexes with subqueries are not supported in PostgreSQL
-- This index helps with queries that filter meals by user
create index if not exists idx_meals_user_last_week
  on meals(user_id);

-- Index for quickly retrieving the current active goal
-- Supports fast lookup of user's current nutritional targets
create index if not exists idx_user_goals_current 
  on user_goals(user_id, valid_from desc) 
  where valid_to is null;

-- ============================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on weeks table
-- Users can only access their own weeks
alter table weeks enable row level security;

-- Policy: Users can perform all operations on their own weeks
create policy user_owns_week on weeks 
  for all 
  using (user_id = auth.uid());

comment on policy user_owns_week on weeks is 
  'Users can only access weeks they own';

-- Enable RLS on meals table
-- Users can only access their own meals
alter table meals enable row level security;

-- Policy: Users can perform all operations on their own meals
create policy user_owns_meal on meals 
  for all 
  using (user_id = auth.uid());

comment on policy user_owns_meal on meals is 
  'Users can only access meals they own';

-- Enable RLS on user_goals table
-- Users can only access their own goals
alter table user_goals enable row level security;

-- Policy: Users can perform all operations on their own goals
create policy user_owns_goal on user_goals 
  for all 
  using (user_id = auth.uid());

comment on policy user_owns_goal on user_goals is 
  'Users can only access goals they own';

-- ============================================================
-- 5. TRIGGERS AND FUNCTIONS
-- ============================================================

-- Function: ensure_week
-- Purpose: Automatically create a week record if it doesn't exist when inserting a meal
-- This simplifies meal creation by not requiring explicit week management
create or replace function ensure_week() 
returns trigger 
language plpgsql 
as $$
declare
  monday date := date_trunc('week', current_date)::date; -- ISO Monday
begin
  -- Check if the week exists
  if not exists (select 1 from weeks where week_id = new.week_id) then
    -- Create the week and update the meal's week_id
    insert into weeks(user_id, start_date) 
    values (new.user_id, monday) 
    returning week_id into new.week_id;
  end if;
  return new;
end;
$$;

comment on function ensure_week() is 
  'Ensures a week record exists before inserting a meal, creates it if missing';

-- Trigger: trg_meals_ensure_week
-- Fires before inserting a meal to ensure the week exists
create trigger trg_meals_ensure_week
  before insert on meals
  for each row 
  execute function ensure_week();

comment on trigger trg_meals_ensure_week on meals is 
  'Automatically creates week records when meals are inserted';

