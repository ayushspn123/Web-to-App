"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { ProjectCard } from "@/components/project-card"
import { Package } from "lucide-react"
import type { Project } from "@/lib/types"

interface ProjectsListProps {
  userId: string
}

export function ProjectsList({ userId }: ProjectsListProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        console.log("[v0] ProjectsList: Starting to fetch projects for user:", userId)
        const supabase = createBrowserClient()

        console.log("[v0] ProjectsList: Supabase client created")

        const { data, error: fetchError } = await supabase
          .from("projects")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })

        console.log("[v0] ProjectsList: Fetch result:", {
          dataCount: data?.length,
          error: fetchError,
        })

        if (fetchError) {
          console.error("[v0] ProjectsList: Error fetching projects:", fetchError)
          setError(true)
        } else {
          console.log("[v0] ProjectsList: Successfully loaded", data?.length || 0, "projects")
          setProjects(data || [])
        }
      } catch (err) {
        console.error("[v0] ProjectsList: Exception:", err)
        setError(true)
      } finally {
        console.log("[v0] ProjectsList: Setting loading to false")
        setLoading(false)
      }
    }

    if (userId) {
      fetchProjects()
    } else {
      console.log("[v0] ProjectsList: No userId provided")
      setLoading(false)
    }
  }, [userId])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-destructive">Failed to load projects</p>
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
        <div className="mx-auto mb-4 inline-flex rounded-full bg-muted p-4">
          <Package className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mb-2 text-lg font-semibold">No projects yet</h3>
        <p className="text-sm text-muted-foreground">Create your first project to start converting websites to apps</p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  )
}
