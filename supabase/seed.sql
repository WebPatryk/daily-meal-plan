-- ============================================================
-- SEED DATA FOR DEVELOPMENT
-- ============================================================
-- Purpose: Provides initial test data for development
-- User: Test user with UUID 4fda521a-369a-48f0-875d-19885aeed675

-- Insert test user into auth.users (if not exists)
-- Note: This is for local development only
insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
values (
  '4fda521a-369a-48f0-875d-19885aeed675',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'test@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  false,
  '',
  '',
  '',
  ''
)
on conflict (id) do nothing;

-- Insert current week (starting from the upcoming Monday)
insert into weeks (user_id, start_date)
values (
  '4fda521a-369a-48f0-875d-19885aeed675',
  date_trunc('week', current_date + interval '1 week')::date
)
on conflict (user_id, start_date) do nothing;

-- Insert user goals
insert into user_goals (user_id, kcal_target, protein_target, valid_from, valid_to)
values (
  '4fda521a-369a-48f0-875d-19885aeed675',
  2500,
  150,
  now(),
  null
)
on conflict do nothing;

-- Optional: Insert some sample meals for testing
-- Get the week_id for the current week
with current_week as (
  select week_id 
  from weeks 
  where user_id = '4fda521a-369a-48f0-875d-19885aeed675' 
    and start_date = date_trunc('week', current_date)::date
  limit 1
)
insert into meals (user_id, week_id, day_of_week, meal_type, kcal, protein, source, ai_proposition)
select 
  '4fda521a-369a-48f0-875d-19885aeed675',
  (select week_id from current_week),
  'monday',
  'breakfast',
  450,
  25,
  'manual',
  jsonb_build_object(
    'name', 'Owsianka z owocami',
    'ingredients', jsonb_build_array('Płatki owsiane 50g', 'Mleko 200ml', 'Banan 1szt', 'Miód 1łyżka'),
    'steps', jsonb_build_array('Ugotuj płatki owsiane na mleku', 'Dodaj pokrojony banan', 'Polej miodem')
  )
on conflict (user_id, week_id, day_of_week, meal_type) do nothing;

