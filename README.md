# DailyMeal

A weekly meal-planning web application powered by AI and Supabase.

---

## Table&nbsp;of&nbsp;Contents

1. [Project Description](#project-description)
2. [Tech Stack](#tech-stack)
3. [Getting Started Locally](#getting-started-locally)
4. [Available Scripts](#available-scripts)
5. [Project Scope](#project-scope)
6. [Project Status](#project-status)
7. [License](#license)

---

## Project Description

DailyMeal helps physically active people create personalised weekly meal plans. Users can manually add meals or let AI suggest recipes that match their calorie and protein goals. All data are stored securely in Supabase and presented in an accessible UI.

Key capabilities:

- Weekly planner grid (5 meals × 7 days) focused on the current week.
- AI meal generation with macronutrient targets.
- Manual meal editing.
- Authentication via email + password (Supabase Auth).

---

## Tech Stack

- **Astro 5** – fast, content-focused framework
- **React 19** – interactive components
- **TypeScript 5** – static typing
- **Tailwind CSS 4** – utility-first styling
- **shadcn/ui** – accessible component library
- **Supabase** (PostgreSQL + Storage + Auth) – backend-as-a-service
- **Openrouter.ai** – access to multiple AI models
- **Node.js 22.14.0** – runtime (see `.nvmrc`)
- **Vitest & React Testing Library** – unit and integration testing
- **Playwright** – end-to-end browser testing

---

## Getting Started Locally

### Prerequisites

- Node.js 22.14.0 and npm ≥ 10 (or pnpm/yarn if preferred)
- Supabase project with `SUPABASE_URL` and `SUPABASE_KEY`
- OpenRouter API key for AI meal generation
- See [ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md) for detailed setup instructions

### Installation

```bash
# 1. Clone the repository
$ git clone https://github.com/your-org/daily-meal-plan.git
$ cd daily-meal-plan

# 2. Install dependencies
$ npm install

# 3. Set up environment variables
# Create a .env file with required variables
# See ENVIRONMENT_VARIABLES.md for details

# 4. Start the dev server
$ npm run dev
```

The app will be available at `http://localhost:4321` by default.

---

## Available Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run preview   # Preview the production build locally
npm run lint      # Run ESLint
npm run lint:fix  # Fix ESLint issues automatically
npm run format    # Prettier – format all files
```

---

## Project Scope

### Functional requirements (MVP)

- User registration & login (email + password).
- Set daily calorie & protein goals during onboarding and in profile.
- Validate macro values (1–3000 kcal, 1–300 g protein) on both FE & BE.
- Weekly planner grid with current week view only.
- Manual meal addition & editing.
- AI meal generation (name, macros, ingredients, steps, SVG icon).

### Product boundaries

- No recipe import from URLs in MVP.
- No social or sharing features.
- No offline mode.
- AI usage limits may be added post-MVP.

---

## Project Status

🚧 **MVP in active development** – see the [project board](https://github.com/your-org/daily-meal-plan/projects/1) for progress.

---

## License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.
