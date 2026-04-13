-- Create builds table for tracking build history
create table if not exists public.builds (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  status text not null default 'queued' check (status in ('queued', 'building', 'completed', 'failed')),
  build_logs text,
  error_message text,
  apk_url text,
  apk_size bigint,
  build_duration integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone
);

-- Enable RLS
alter table public.builds enable row level security;

-- RLS Policies for builds (users can only see builds for their projects)
create policy "Users can view builds for their projects"
  on public.builds for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = builds.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can create builds for their projects"
  on public.builds for insert
  with check (
    exists (
      select 1 from public.projects
      where projects.id = builds.project_id
      and projects.user_id = auth.uid()
    )
  );

-- Create index for faster queries
create index if not exists builds_project_id_idx on public.builds(project_id);
create index if not exists builds_status_idx on public.builds(status);
create index if not exists builds_created_at_idx on public.builds(created_at desc);
