-- migration: add row level security policies for all tables
-- description: this migration enables rls and creates granular policies for meals, user_goals, and weeks tables
-- affected tables: meals, user_goals, weeks
-- security level: high - users can only access their own data

-- ============================================================================
-- enable row level security on all tables
-- ============================================================================

-- enable rls on meals table
-- this ensures that all queries to the meals table will be filtered by rls policies
alter table meals enable row level security;

-- enable rls on user_goals table
-- this ensures that all queries to the user_goals table will be filtered by rls policies
alter table user_goals enable row level security;

-- enable rls on weeks table
-- this ensures that all queries to the weeks table will be filtered by rls policies
alter table weeks enable row level security;

-- ============================================================================
-- meals table policies
-- ============================================================================

-- policy: allow authenticated users to select their own meals
-- rationale: users should only be able to view their own meal data
-- role: authenticated
create policy "authenticated_users_select_own_meals"
  on meals
  for select
  to authenticated
  using (auth.uid() = user_id);

-- policy: allow authenticated users to insert their own meals
-- rationale: users should only be able to create meals for themselves
-- role: authenticated
create policy "authenticated_users_insert_own_meals"
  on meals
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- policy: allow authenticated users to update their own meals
-- rationale: users should only be able to modify their own meal data
-- role: authenticated
create policy "authenticated_users_update_own_meals"
  on meals
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- policy: allow authenticated users to delete their own meals
-- rationale: users should only be able to remove their own meal data
-- role: authenticated
create policy "authenticated_users_delete_own_meals"
  on meals
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- policy: deny anonymous users from selecting meals
-- rationale: anonymous users should not have access to meal data
-- role: anon
create policy "anon_users_no_select_meals"
  on meals
  for select
  to anon
  using (false);

-- policy: deny anonymous users from inserting meals
-- rationale: anonymous users should not be able to create meal data
-- role: anon
create policy "anon_users_no_insert_meals"
  on meals
  for insert
  to anon
  with check (false);

-- policy: deny anonymous users from updating meals
-- rationale: anonymous users should not be able to modify meal data
-- role: anon
create policy "anon_users_no_update_meals"
  on meals
  for update
  to anon
  using (false)
  with check (false);

-- policy: deny anonymous users from deleting meals
-- rationale: anonymous users should not be able to remove meal data
-- role: anon
create policy "anon_users_no_delete_meals"
  on meals
  for delete
  to anon
  using (false);

-- ============================================================================
-- user_goals table policies
-- ============================================================================

-- policy: allow authenticated users to select their own goals
-- rationale: users should only be able to view their own goal data
-- role: authenticated
create policy "authenticated_users_select_own_goals"
  on user_goals
  for select
  to authenticated
  using (auth.uid() = user_id);

-- policy: allow authenticated users to insert their own goals
-- rationale: users should only be able to create goals for themselves
-- role: authenticated
create policy "authenticated_users_insert_own_goals"
  on user_goals
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- policy: allow authenticated users to update their own goals
-- rationale: users should only be able to modify their own goal data
-- role: authenticated
create policy "authenticated_users_update_own_goals"
  on user_goals
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- policy: allow authenticated users to delete their own goals
-- rationale: users should only be able to remove their own goal data
-- role: authenticated
create policy "authenticated_users_delete_own_goals"
  on user_goals
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- policy: deny anonymous users from selecting goals
-- rationale: anonymous users should not have access to goal data
-- role: anon
create policy "anon_users_no_select_goals"
  on user_goals
  for select
  to anon
  using (false);

-- policy: deny anonymous users from inserting goals
-- rationale: anonymous users should not be able to create goal data
-- role: anon
create policy "anon_users_no_insert_goals"
  on user_goals
  for insert
  to anon
  with check (false);

-- policy: deny anonymous users from updating goals
-- rationale: anonymous users should not be able to modify goal data
-- role: anon
create policy "anon_users_no_update_goals"
  on user_goals
  for update
  to anon
  using (false)
  with check (false);

-- policy: deny anonymous users from deleting goals
-- rationale: anonymous users should not be able to remove goal data
-- role: anon
create policy "anon_users_no_delete_goals"
  on user_goals
  for delete
  to anon
  using (false);

-- ============================================================================
-- weeks table policies
-- ============================================================================

-- policy: allow authenticated users to select their own weeks
-- rationale: users should only be able to view their own week data
-- role: authenticated
create policy "authenticated_users_select_own_weeks"
  on weeks
  for select
  to authenticated
  using (auth.uid() = user_id);

-- policy: allow authenticated users to insert their own weeks
-- rationale: users should only be able to create weeks for themselves
-- role: authenticated
create policy "authenticated_users_insert_own_weeks"
  on weeks
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- policy: allow authenticated users to update their own weeks
-- rationale: users should only be able to modify their own week data
-- role: authenticated
create policy "authenticated_users_update_own_weeks"
  on weeks
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- policy: allow authenticated users to delete their own weeks
-- rationale: users should only be able to remove their own week data
-- role: authenticated
create policy "authenticated_users_delete_own_weeks"
  on weeks
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- policy: deny anonymous users from selecting weeks
-- rationale: anonymous users should not have access to week data
-- role: anon
create policy "anon_users_no_select_weeks"
  on weeks
  for select
  to anon
  using (false);

-- policy: deny anonymous users from inserting weeks
-- rationale: anonymous users should not be able to create week data
-- role: anon
create policy "anon_users_no_insert_weeks"
  on weeks
  for insert
  to anon
  with check (false);

-- policy: deny anonymous users from updating weeks
-- rationale: anonymous users should not be able to modify week data
-- role: anon
create policy "anon_users_no_update_weeks"
  on weeks
  for update
  to anon
  using (false)
  with check (false);

-- policy: deny anonymous users from deleting weeks
-- rationale: anonymous users should not be able to remove week data
-- role: anon
create policy "anon_users_no_delete_weeks"
  on weeks
  for delete
  to anon
  using (false);



