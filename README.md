# WebToApp

Open-source platform to convert any website into an Android app (APK/AAB) with project management, build history, and Supabase-powered auth.

## Why WebToApp

WebToApp gives founders and developers a fast path from web product to installable Android app:

- Create a project with website URL, app name, package name, and branding color.
- Build debug APK, signed release APK, or Play Store AAB.
- Track status and logs for every build.
- Download artifacts directly from the dashboard.

## Core Features

- Website to Android conversion through a WebView-based template.
- Full project lifecycle: create, view, edit, rebuild.
- Build history with logs, errors, duration, and artifact size.
- Supabase authentication (email/password) with protected routes.
- Row Level Security (RLS) so users only see their own data.
- API endpoints for projects and build orchestration.
- Ready-to-extend Next.js app-router codebase.

## Architecture (Codebase-Accurate)

### Frontend

- Next.js app router pages in `app/`.
- UI components in `components/`.
- Main product flow:
	- Landing: `app/page.tsx`
	- Auth: `app/auth/*`
	- Dashboard: `app/dashboard/page.tsx`
	- New project: `app/projects/new/page.tsx`
	- Project details and build controls: `app/projects/[id]/page.tsx`

### Backend (Inside Next.js API Routes)

- Projects API:
	- `app/api/projects/route.ts`
	- `app/api/projects/[id]/route.ts`
- Build APIs:
	- `app/api/projects/[id]/build/route.ts`
	- `app/api/projects/[id]/builds/route.ts`

### Build Engine

- Build orchestration: `lib/builder.ts`
- Android template source: `android-template/`
- Generated build workspaces: `builds/<project-id>/`
- Public artifacts: `public/builds/<project-id>/`

### Data + Auth

- Supabase client helpers in `lib/supabase/`.
- SQL setup scripts:
	- `scripts/001_create_projects_table.sql`
	- `scripts/002_create_builds_table.sql`

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Supabase (Auth + Postgres)
- fs-extra + Gradle build orchestration

## Quick Start (Local)

### 1. Prerequisites

- Node.js 20+
- npm
- A Supabase project
- For Android builds: Java 17+, Android SDK, and Gradle-compatible environment

Install dependencies:

```bash
npm install
```

### 2. Environment Variables

Create `.env.local` in project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=
```

#### What each variable does

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public anon key used by browser and server helpers.
- `SUPABASE_SERVICE_ROLE_KEY`: Required for server-side privileged updates after build completion.
- `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL`: Optional redirect URL for sign-up email confirmation.

#### Where to find these values

In Supabase Dashboard:

1. Go to Project Settings -> API.
2. Copy:
	 - Project URL -> `NEXT_PUBLIC_SUPABASE_URL`
	 - anon public key -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`
	 - service_role key -> `SUPABASE_SERVICE_ROLE_KEY`
3. Go to Authentication -> URL Configuration.
4. Set your local callback (example): `http://localhost:3000/dashboard`
5. Put that URL in `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL`.

### 3. Database Setup

Run both SQL scripts in Supabase SQL Editor, in this order:

1. `scripts/001_create_projects_table.sql`
2. `scripts/002_create_builds_table.sql`

This creates:

- `projects` table + RLS policies
- `builds` table + RLS policies
- helpful indexes for query speed

### 4. Run the App

```bash
npm run dev
```

Open:

`http://localhost:3000`

### 5. End-to-End Local Test

1. Sign up for an account.
2. Confirm email (if enabled in Supabase).
3. Create a project from dashboard.
4. Open project page and trigger a build.
5. Watch build status and logs in Build History.
6. Download generated APK/AAB when completed.

## Build System Notes (Important)

Current code in `lib/builder.ts` runs `gradlew.bat` and includes a Windows-style `ANDROID_HOME` default path.

This means:

- Android build route is currently tuned for a Windows-style build host.
- On Linux/macOS you should adapt `lib/builder.ts` to use `./gradlew` and your local SDK path.
- Docker build assets exist in `docker/`, but are not wired as the default build execution path yet.

If you want true cross-platform builds, use a dedicated build worker service and queue jobs rather than long-running API route execution.

## Using WebToApp as a SaaS Product

You can run this as a multi-tenant SaaS because it already has per-user data isolation via Supabase RLS.

### Suggested production architecture

1. Web app on Vercel (or your Node host).
2. Supabase for auth + database.
3. Dedicated build workers (VM/container) for APK/AAB generation.
4. Object storage for build artifacts (S3/Supabase Storage) with signed download URLs.
5. Queue (Redis/SQS/RabbitMQ) for async build jobs.

### Production checklist

- Move build execution out of API route into workers.
- Store keystore secrets in secure secret manager.
- Add rate limits for API endpoints.
- Add retries, timeouts, and dead-letter handling for builds.
- Add billing and plan limits (projects/builds per month).
- Add monitoring and alerting for build failures.

## API Overview

- `POST /api/projects` -> create project
- `GET /api/projects` -> list user projects
- `GET /api/projects/:id` -> fetch project details
- `PATCH /api/projects/:id` -> update project metadata
- `POST /api/projects/:id/build` -> start build
- `GET /api/projects/:id/builds` -> list build history

All project/build APIs use Bearer auth token from Supabase session.

## Project Structure

```text
app/                 Next.js pages and API routes
components/          Product UI components
lib/                 Build engine + helpers + typed models
lib/supabase/        Browser/server/admin Supabase clients
scripts/             SQL schema and RLS setup
android-template/    Android WebView template project
builds/              Generated build work directories
public/builds/       Downloadable APK/AAB artifacts
docker/              Optional containerized build assets
```

## Security Notes

- Do not expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.
- Rotate keys if leaked.
- Current keystore generation in builder uses default passwords for convenience. Replace with secure production secrets before real distribution.

## Contributing

Contributions are welcome.

1. Fork the repo
2. Create a feature branch
3. Commit your changes
4. Open a pull request

Please include:

- clear description
- reproduction steps for fixes
- screenshots for UI changes

## Support This Project

If this project helps you:

- Star the repository
- Share it with other builders
- Sponsor or Buy Me a Coffee (add your link here)

Example section you can customize:

```md
## Buy Me a Coffee

If you like WebToApp, support development:

- Buy Me a Coffee: https://buymeacoffee.com/YOUR_HANDLE
- GitHub Sponsors: https://github.com/sponsors/YOUR_HANDLE
```

## License

Choose a license (MIT recommended for open source) and add a `LICENSE` file.

---

Built for founders, indie hackers, and dev teams who want to ship Android apps faster.