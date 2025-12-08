# REST API Plan

## 1. Resources

- **Auth** – Supabase Auth (`users`) – registration & login handled by built-in Supabase endpoints.
- **Week** – table `weeks` – weekly planning period starting on ISO-Monday for a specific user.
- **Meal** – table `meals` – single meal slot (breakfast, lunch, etc.) belonging to a week & day.
- **User Goal** – table `user_goals` – user-specific macro targets (kcal & protein) with validity ranges.

---

## 2. Endpoints

### 2.1 Authentication

Supabase already exposes `/signup`, `/token` and other auth routes – **no custom implementation required**.

### 2.2 Weeks

- **GET `/weeks`** – list weeks for the current user. Supports:
  - `start_date` – filter by ISO-Monday (YYYY-MM-DD)
  - `limit`, `offset` – pagination (default `limit=20`)
  - `sort` – `start_date` (`asc` | `desc`, default `desc`)
- **POST `/weeks`** – create a new week. Body:
  ```json
  { "start_date": "2025-11-17" }
  ```
- **GET `/weeks/{week_id}`** – fetch a single week (optionally embed meals).
- **PATCH `/weeks/{week_id}`** – update `start_date` (edge case).
- **DELETE `/weeks/{week_id}`** – delete a week (cascades to meals).

### 2.3 Meals

- **GET `/weeks/{week_id}/meals`** – list meals in the given week. Optional filters:
  - `day_of_week` – enum `monday`…`sunday`
  - `meal_type` – meal-type enum
  - `limit`, `offset` – pagination
  - `sort` – `day_of_week,meal_type` (default ascending)
- **POST `/weeks/{week_id}/meals`** – create a new meal. Example body:
  ```json
  {
    "day_of_week": "monday",
    "meal_type": "breakfast",
    "name": "Oatmeal & Berries",
    "kcal": 450,
    "protein": 30,
    "ingredients": ["80 g oats", "150 ml milk", "100 g berries"],
    "steps": ["Cook oats", "Top with berries"],
    "image_path": null
  }
  ```
- **GET `/meals/{meal_id}`** – retrieve a single meal.
- **PATCH `/meals/{meal_id}`** – update meal fields.
- **DELETE `/meals/{meal_id}`** – delete a meal.
- **POST `/meals/ai-generate`** – generate a meal via AI. Body example:
  ```json
  {
    "kcal_range": { "min": 400, "max": 600 },
    "protein_range": { "min": 25, "max": 40 },
    "description": "high-fiber vegetarian lunch",
    "save": true,
    "week_id": 123,
    "day_of_week": "tuesday",
    "meal_type": "lunch"
  }
  ```
- **PUT `/meals/{meal_id}/image`** – upload/replace thumbnail (≤ 1 MB). Returns signed URL in response.

### 2.4 User Goals

- **GET `/user-goals`** – list goal history for the user (newest first, paginated).
- **POST `/user-goals`** – create a new active goal (automatically closes previous). Body:
  ```json
  {
    "kcal_target": 2500,
    "protein_target": 180,
    "valid_from": "2025-11-19T10:00:00Z"
  }
  ```
- **GET `/user-goals/current`** – fetch the current active goal.
- **PATCH `/user-goals/{goal_id}`** – close a goal by setting `valid_to`.

---

## 3. Authentication & Authorization

- Supabase JWT sent via `Authorization: Bearer <token>` header.
- Row Level Security (RLS) on all tables ensures `user_id = auth.uid()`.
- Only authenticated users can access the API (except built-in `/auth/*`).
- Rate limiting: 60 req/min per IP (general), 10 req/min for auth routes.
- CORS restricted to front-end origin, preflight cached.

---

## 4. Validation & Business Logic

### 4.1 Field Validation (API layer + DB constraints)

- `kcal`, `kcal_target` – integer 1 – 3000
- `protein`, `protein_target` – integer 1 – 300
- `meal_type` – one of `breakfast`, `lunch`, `dinner`, `snack1`, `snack2`
- `day_of_week` – one of `monday` … `sunday`
- **Unique meal slot** – combination `(user_id, week_id, day_of_week, meal_type)` must be unique
- **Unique week** – `(user_id, start_date)` must be unique
- **Goal dates** – `valid_to` is `null` or later than `valid_from`
- **Image size** – ≤ 1 MB enforced during upload

### 4.2 Mapping PRD Features to Endpoints

- **Registration / Login** – handled by Supabase Auth (`/signup`, `/token`)
- **Set goals (FR-03 / US-003)** – `POST /user-goals`
- **Weekly planner grid (FR-04)** – `GET /weeks/{id}` and `GET /weeks/{id}/meals`
- **Manual meal add (FR-05 / US-004)** – `POST /weeks/{week_id}/meals`
- **AI meal generation (FR-06 / US-005)** – `POST /meals/ai-generate`
- **Edit meal (FR-07 / US-006)** – `PATCH /meals/{meal_id}`
- **Thumbnail storage (FR-08 / US-008)** – `PUT /meals/{meal_id}/image`
- **Back-end validation (FR-09 / US-007)** – enforced via DB constraints + edge validators

---

## 5. Error Handling

- **400 Bad Request** – validation failed, missing fields, bad enum values
- **401 Unauthorized** – missing/invalid JWT
- **403 Forbidden** – RLS denied (record not owned by user)
- **404 Not Found** – resource does not exist or not visible due to RLS
- **409 Conflict** – duplicate key violation (unique meal slot / week)
- **413 Payload Too Large** – image > 1 MB
- **429 Too Many Requests** – rate limit exceeded
- **500 Internal Server Error** – unhandled server / AI provider failure

Error payload format:

```json
{
  "error": {
    "code": "validation_error",
    "message": "kcal must be between 1 and 3000",
    "details": {}
  }
}
```

---

## 6. Pagination, Filtering & Sorting Guidelines

- **Pagination** – `limit` (max 100) & `offset` query params. Total count in `X-Total-Count` header.
- **Filtering** – exact-match filters for enums; range filters for dates/numbers via `min_*/max_*` query params.
- **Sorting** – `sort` param with `field` and optional direction (`start_date:asc`). Defaults: newest weeks first, meals ordered by day → meal_type.

---

## 7. Security & Performance Considerations

- Enforce HTTPS (TLS 1.2+)
- Use prepared statements (via Supabase client)
- RLS prevents cross-user data leakage
- Existing indexes (`idx_meals_user_week_day`, `idx_user_goals_current`) keep queries fast
- Private data `Cache-Control: no-store`
