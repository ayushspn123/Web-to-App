# WebToApp

Turn any website into an Android app package (APK/AAB) with project management, build history, and authentication.

WebToApp is open source and free to clone, run, and modify.

## Highlights

- Create Android app projects from website URLs
- Build debug APK, release APK, or Play Store AAB
- Track build logs, status, duration, and output size
- Manage projects from a clean dashboard
- Secure user isolation with Supabase Auth + Row Level Security

## Tech Stack

- Next.js (App Router) + React + TypeScript
- Supabase (Auth + Postgres)
- Tailwind CSS
- Gradle-based Android template build pipeline

## Project Structure

```text
app/                 Next.js pages and API routes
components/          UI components
lib/                 Builder and helpers
lib/supabase/        Supabase clients
scripts/             SQL setup scripts
android-template/    Android template project
builds/              Generated build work directories
public/builds/       Output APK/AAB files
docker/              Optional container build assets
```

## Quick Start

### 1. Prerequisites

- Node.js 20+
- npm or pnpm
- Supabase project
- For Android builds: Java 17+, Android SDK, Gradle-compatible environment

### 2. Install

```bash
npm install
```

or

```bash
pnpm install
```

### 3. Environment Variables

Create a file named .env.local in the root:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=
```

Variable guide:

- NEXT_PUBLIC_SUPABASE_URL: Supabase project URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY: Public anon key
- SUPABASE_SERVICE_ROLE_KEY: Server-side privileged key
- NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL: Optional email confirmation redirect URL

### 4. Database Setup

Run these SQL files in Supabase SQL Editor in order:

1. scripts/001_create_projects_table.sql
2. scripts/002_create_builds_table.sql

### 5. Start Development Server

```bash
npm run dev
```

Then open http://localhost:3000

## API Endpoints

- POST /api/projects
- GET /api/projects
- GET /api/projects/:id
- PATCH /api/projects/:id
- POST /api/projects/:id/build
- GET /api/projects/:id/builds

## Build Notes

The current builder implementation in lib/builder.ts is configured with a Windows-style Gradle command and Android SDK default path.

- On Linux/macOS, update the build command and SDK path for your environment.
- For production, move builds to dedicated worker infrastructure instead of running long jobs directly in API routes.

## Contributing

Contributions are welcome.

1. Fork the repository
2. Create a branch: feat/your-change
3. Make your changes
4. Open a pull request

If possible, include:

- clear summary
- setup/reproduction steps
- screenshots for UI changes

## Open Source License

This project is licensed under the MIT License.

See the LICENSE file for full details.

## Acknowledgment

Built for developers, founders, and indie teams who want to ship Android apps faster.