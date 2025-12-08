# Environment Variables

This document describes all required environment variables for the DailyMeal application.

---

## Table of Contents

1. [Required Variables](#required-variables)
2. [Optional Variables](#optional-variables)
3. [Setup Instructions](#setup-instructions)
4. [Getting Your Credentials](#getting-your-credentials)

---

## Required Variables

### `SUPABASE_URL`

**Description:** Your Supabase project URL endpoint.

**Format:** `https://your-project-id.supabase.co`

**Used for:**

- Database connections
- Authentication
- Storage operations

**Where to find it:**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Project Settings** > **API**
4. Copy the **Project URL**

**Example:**

```
SUPABASE_URL=https://xyzabc123.supabase.co
```

---

### `SUPABASE_KEY`

**Description:** Your Supabase anonymous (public) API key.

**Used for:**

- Client-side authentication
- Database queries (respects Row Level Security policies)
- Storage access

**Security note:** This key is safe to use in client-side code as it respects Row Level Security (RLS) policies configured in your database.

**Where to find it:**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Project Settings** > **API**
4. Copy the **anon** / **public** key under **Project API keys**

**Example:**

```
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### `OPENROUTER_API_KEY`

**Description:** API key for OpenRouter AI service used for meal generation.

**Used for:**

- Generating AI-powered meal suggestions
- Creating recipes with macronutrient targets
- Generating meal descriptions and instructions

**Where to find it:**

1. Create an account at [OpenRouter](https://openrouter.ai/)
2. Navigate to [API Keys](https://openrouter.ai/keys)
3. Click **Create Key**
4. Copy your new API key

**Cost:** OpenRouter charges per token used. Check their [pricing page](https://openrouter.ai/docs#models) for current rates.

**Example:**

```
OPENROUTER_API_KEY=sk-or-v1-abc123def456...
```

---

## Optional Variables

These variables are only required if you're running end-to-end tests.

### `TEST_EMAIL`

**Description:** Email address for test user account in E2E tests.

**Used for:**

- Playwright E2E authentication tests
- Testing user flows

**Requirements:**

- Must be a valid email format
- Must exist in your Supabase Auth users (or be created by tests)

**Example:**

```
TEST_EMAIL=test@example.com
```

---

### `TEST_PASSWORD`

**Description:** Password for test user account in E2E tests.

**Used for:**

- Playwright E2E authentication tests
- Testing login/logout flows

**Requirements:**

- Must meet Supabase password requirements (minimum 6 characters by default)
- Should match the password for the `TEST_EMAIL` user

**Example:**

```
TEST_PASSWORD=testpassword123
```

---

## Setup Instructions

### 1. Create Environment File

Create a `.env` file in the `daily-meal-plan` directory:

```bash
cd daily-meal-plan
touch .env
```

### 2. Add Required Variables

Add all required variables to your `.env` file:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-supabase-anon-key

# AI Configuration
OPENROUTER_API_KEY=your-openrouter-api-key

# E2E Testing (Optional)
TEST_EMAIL=test@example.com
TEST_PASSWORD=testpassword123
```

### 3. Verify Setup

After adding your environment variables, verify the setup by running:

```bash
npm run dev
```

If you see connection errors, double-check your credentials.

---

## Getting Your Credentials

### Supabase Setup

If you don't have a Supabase project yet:

1. **Create an account** at [Supabase](https://supabase.com)
2. **Create a new project**
   - Choose a project name
   - Set a database password
   - Select a region close to your users
3. **Run migrations**
   ```bash
   cd daily-meal-plan
   npx supabase db push
   ```
4. **Get your credentials** from **Project Settings** > **API**

### OpenRouter Setup

1. **Create an account** at [OpenRouter](https://openrouter.ai/)
2. **Add credits** to your account (pay-as-you-go)
3. **Generate an API key** at [API Keys page](https://openrouter.ai/keys)
4. **Monitor usage** in your OpenRouter dashboard

### Test User Setup

For E2E testing, you have two options:

**Option 1: Create manually**

1. Run your app locally: `npm run dev`
2. Go to `http://localhost:4321/auth/register`
3. Register a test account
4. Use those credentials in your `.env` file

**Option 2: Let tests create the user**

- Some E2E tests can automatically create the test user if it doesn't exist
- Check `e2e/fixtures/auth.setup.ts` for details

---

## Security Best Practices

⚠️ **Important Security Notes:**

1. **Never commit `.env` files** to version control
2. **Never share your API keys** publicly
3. **Use different credentials** for development, staging, and production
4. **Rotate keys regularly** if they're exposed
5. **Use service role key** only in secure server environments (not included in this app)
6. **Monitor your API usage** on OpenRouter to avoid unexpected charges

---

## Troubleshooting

### "Invalid API key" errors

- Verify your keys are copied correctly (no extra spaces)
- Check if your Supabase project is active
- Ensure OpenRouter account has credits

### "Connection refused" errors

- Verify `SUPABASE_URL` format is correct
- Check if your Supabase project is paused (free tier limitation)
- Ensure you have internet connectivity

### E2E tests failing

- Verify `TEST_EMAIL` and `TEST_PASSWORD` are set
- Check if test user exists in Supabase Auth
- Review test logs for specific error messages

---

## Questions?

If you encounter issues not covered here, please:

1. Check the [main README](README.md)
2. Review [Supabase documentation](https://supabase.com/docs)
3. Check [OpenRouter documentation](https://openrouter.ai/docs)
4. Open an issue in the project repository
