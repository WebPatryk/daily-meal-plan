### 1. Tabele

#### 1.1 users _(zarządzana przez Supabase Auth)_

- **id**: uuid, primary key, generowany przez Supabase Auth
- **email**: text, unique, not null
- **created_at**: timestamptz, default now()

#### 1.2 weeks

- **week_id**: bigint, primary key, generated always as identity
- **user_id**: uuid, not null, references users(id) on delete cascade
- **start_date**: date, not null (poniedziałek tygodnia ISO)
- **created_at**: timestamptz, default now()
- Dodatkowe ograniczenia: unique (user_id, start_date) – jeden tydzień na użytkownika

#### 1.3 meals

- **meal_id**: bigint, primary key, generated always as identity
- **user_id**: uuid, not null, references users(id) on delete cascade
- **week_id**: bigint, not null, references weeks(week_id) on delete cascade
- **day_of_week**: day_of_week_enum, not null
- **meal_type**: meal_type_enum, NULL gdy slot pusty
- **kcal**: smallint, CHECK (kcal between 1 and 3000)
- **protein**: smallint, CHECK (protein between 1 and 300)
- **image_path**: text, może być NULL
- **source**: varchar(12), not null, CHECK (source in ('manual','ai_generated'))
- **ai_proposition**: jsonb, opcjonalnie NULL
- **created_at**: timestamptz, default now()
- **updated_at**: timestamptz, default now()
- Dodatkowe ograniczenia: UNIQUE (user_id, week_id, day_of_week, meal_type) – brak duplikatów slotów

#### 1.4 user_goals

- **goal_id**: bigint, primary key, generated always as identity
- **user_id**: uuid, not null, references users(id) on delete cascade
- **kcal_target**: smallint, not null, CHECK (kcal_target between 1 and 3000)
- **protein_target**: smallint, not null, CHECK (protein_target between 1 and 300)
- **valid_from**: timestamptz, not null
- **valid_to**: timestamptz, NULL gdy aktualny cel
- **created_at**: timestamptz, default now()
- Dodatkowe ograniczenia: CHECK (valid_to IS NULL OR valid_to > valid_from)

---

### 2. Enumeracje (SQL)

```sql
do $$
begin
  create type day_of_week_enum as enum ('monday','tuesday','wednesday','thursday','friday','saturday','sunday');
  create type meal_type_enum as enum ('breakfast','lunch','dinner','snack1','snack2');
exception when duplicate_object then null;
end$$;
```

### 3. Relacje (kardynalność)

- **users 1 → N weeks** – jeden użytkownik posiada wiele tygodni
- **users 1 → N meals** – bezpośrednie odniesienie dla RLS (nadmiarowe względem weeks)
- **weeks 1 → N meals** – tydzień zawiera wiele posiłków
- **users 1 → N user_goals** – użytkownik ma historię celów makro

### 4. Indeksy

```sql
-- klucze główne indeksowane automatycznie
create index if not exists idx_meals_user_week_day on meals(user_id, week_id, day_of_week);
create index if not exists idx_meals_user_last_week on meals(user_id)
  where week_id in (select week_id from weeks where start_date >= current_date - interval '7 days');
-- szybkie pobranie aktualnego celu
create index if not exists idx_user_goals_current on user_goals(user_id, valid_from desc) where valid_to is null;
```

### 5. Row-Level Security (RLS)

```sql
alter table weeks enable row level security;
create policy user_owns_week on weeks for all using (user_id = auth.uid());

alter table meals enable row level security;
create policy user_owns_meal on meals for all using (user_id = auth.uid());

alter table user_goals enable row level security;
create policy user_owns_goal on user_goals for all using (user_id = auth.uid());
```

### 6. Wyzwalacze i funkcje

```sql
-- upewnij się, że tydzień istnieje przy wstawianiu posiłku
create or replace function ensure_week() returns trigger language plpgsql as $$
declare
  monday date := date_trunc('week', current_date)::date; -- ISO Monday
begin
  if not exists (select 1 from weeks where week_id = new.week_id) then
    insert into weeks(user_id, start_date) values (new.user_id, monday) returning week_id into new.week_id;
  end if;
  return new;
end;
$$;

  create trigger trg_meals_ensure_week
  before insert on meals
  for each row execute function ensure_week();
```

### 7. Dodatkowe uwagi

- MVP nie zawiera soft-delete ani partycjonowania; rozważyć w przyszłości.
- Kolumna `ai_proposition` przechowuje pełną odpowiedź AI; w razie potrzeby ograniczać rozmiar po stronie aplikacji.
- Możliwe przyszłe dodanie kolumny `meal_date` lub zdenormalizowanego widoku dla zapytań kalendarzowych.
