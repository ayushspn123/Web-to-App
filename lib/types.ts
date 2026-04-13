export interface Project {
  id: string
  user_id: string
  name: string
  website_url: string
  app_name: string
  package_name: string
  icon_url?: string
  splash_url?: string
  primary_color: string
  status: "pending" | "building" | "completed" | "failed"
  apk_url?: string
  created_at: string
  updated_at: string
}

export interface Build {
  id: string
  project_id: string
  status: "queued" | "building" | "completed" | "failed"
  build_logs?: string
  error_message?: string
  apk_url?: string
  apk_size?: number
  build_duration?: number
  created_at: string
  completed_at?: string
}
