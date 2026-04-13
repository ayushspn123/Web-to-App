"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle2, Clock, XCircle, Loader2, ExternalLink, Download, Play, RefreshCw } from "lucide-react"
import type { Project } from "@/lib/types"
import { BuildHistory } from "@/components/build-history"
import { createBrowserClient } from "@/lib/supabase/client"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ProjectDetailsProps {
  project: Project
}

export function ProjectDetails({ project: initialProject }: ProjectDetailsProps) {
  const [project, setProject] = useState(initialProject)
  const [isBuilding, setIsBuilding] = useState(false)
  const [buildType, setBuildType] = useState<"debug" | "release" | "bundle">("debug")
  const [buildProgress, setBuildProgress] = useState(0)
  const [isUpdating, setIsUpdating] = useState(false)

  const statusConfig = {
    pending: { icon: Clock, label: "Pending", variant: "secondary" as const, color: "text-yellow-500" },
    building: { icon: Loader2, label: "Building", variant: "default" as const, color: "text-blue-500" },
    completed: { icon: CheckCircle2, label: "Completed", variant: "default" as const, color: "text-green-500" },
    failed: { icon: XCircle, label: "Failed", variant: "destructive" as const, color: "text-red-500" },
  }

  const config = statusConfig[project.status]
  const StatusIcon = config.icon

  const handleStartBuild = async () => {
    setIsBuilding(true)
    try {
      const supabase = createBrowserClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error("Not authenticated")
      }

      console.log("[v0] Starting build for project:", project.id)

      setBuildProgress(10) // Initial start
      setBuildProgress(10) // Initial start
      const response = await fetch(`/api/projects/${project.id}/build`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ buildType }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to start build")
      }

      const { project: updatedProject } = await response.json()
      setProject(updatedProject)
      toast.success(`${buildType.toUpperCase()} build started!`)
    } catch (error: any) {
      console.error("[v0] Build start error:", error)
      setIsBuilding(false)
      setBuildProgress(0)
      toast.error(error.message || "Could not start build")
    }
  }

  const handleUpdateBranding = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsUpdating(true)
    const formData = new FormData(e.currentTarget)
    const updates = {
      app_name: formData.get("appName") as string,
      primary_color: formData.get("primaryColor") as string,
      website_url: formData.get("websiteUrl") as string,
    }

    try {
      const supabase = createBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error("Not authenticated")

      const response = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) throw new Error("Failed to update project")

      const { project: updated } = await response.json()
      setProject(updated)
      toast.success("Branding updated successfully")
    } catch (error: any) {
      toast.error(error.message || "Update failed")
    } finally {
      setIsUpdating(false)
    }
  }

  // Simulate progress
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (project.status === "building") {
      timer = setInterval(() => {
        setBuildProgress((prev) => {
          if (prev >= 95) return 95 // Cap at 95% until finished
          const increment = prev < 50 ? 5 : 2 // Slow down as it gets closer
          return prev + increment
        })
      }, 2000)
    } else if (project.status === "completed") {
      setBuildProgress(100)
      const timeout = setTimeout(() => setBuildProgress(0), 3000)
      return () => clearTimeout(timeout)
    } else {
      setBuildProgress(0)
    }
    return () => clearInterval(timer)
  }, [project.status])

  // Poll for updates when building
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (project.status === "building") {
      interval = setInterval(async () => {
        try {
          const supabase = createBrowserClient()
          const {
            data: { session },
          } = await supabase.auth.getSession()

          if (!session?.access_token) return

          const response = await fetch(`/api/projects/${project.id}`, {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          })

          if (response.ok) {
            const data = await response.json()
            if (data.project.status !== "building") {
              setProject(data.project)
              setIsBuilding(false)
              if (data.project.status === "completed") {
                toast.success("Build completed successfully!", {
                  description: "Your APK/AAB is ready for download.",
                  duration: 10000,
                })
              } else if (data.project.status === "failed") {
                toast.error("Build failed", {
                  description: "Check the build history for details.",
                })
              }
            }
          }
        } catch (error) {
          console.error("Polling error:", error)
        }
      }, 3000) // Poll every 3 seconds
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [project.status, project.id])

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{project.name}</CardTitle>
              <CardDescription className="mt-2">
                Created on {new Date(project.created_at).toLocaleDateString()}
              </CardDescription>
            </div>
            <Badge variant={config.variant} className="flex items-center gap-2">
              <StatusIcon className={`h-4 w-4 ${project.status === "building" ? "animate-spin" : ""}`} />
              {config.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <h3 className="mb-2 text-sm font-medium text-muted-foreground">Website URL</h3>
                <a
                  href={project.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:underline"
                >
                  {project.website_url}
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-medium text-muted-foreground">App Name</h3>
                <p>{project.app_name}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="mb-2 text-sm font-medium text-muted-foreground">Package Name</h3>
                <code className="rounded bg-muted px-2 py-1 text-sm">{project.package_name}</code>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-medium text-muted-foreground">Primary Color</h3>
                <div className="flex items-center gap-2">
                  <div
                    className="h-8 w-8 rounded border border-border"
                    style={{ backgroundColor: project.primary_color }}
                  />
                  <code className="text-sm">{project.primary_color}</code>
                </div>
              </div>
            </div>
          </div>

            {project.status === "completed" && (
              <div className="mt-4 rounded-lg bg-green-50 p-4 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                <p className="font-medium">Build Successful!</p>
                <p className="text-sm">Your APK is ready for download and testing.</p>
              </div>
            )}
            {project.status === "failed" && (
              <div className="mt-4 rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                <p className="font-medium">Build Failed</p>
                <p className="text-sm">Something went wrong during the build process. Check the logs for details.</p>
              </div>
            )}

            <div className="mt-6 space-y-4">
              {project.status !== "building" && (
                <div className="flex flex-col gap-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Select Build Type</h3>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={buildType === "debug" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setBuildType("debug")}
                      disabled={isBuilding}
                    >
                      Debug APK (Testing)
                    </Button>
                    <Button
                      variant={buildType === "release" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setBuildType("release")}
                      disabled={isBuilding}
                    >
                      Release APK (Signed)
                    </Button>
                    <Button
                      variant={buildType === "bundle" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setBuildType("bundle")}
                      disabled={isBuilding}
                    >
                      Play Store Bundle (AAB)
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                {(project.status === "pending" || project.status === "failed") && (
                  <Button onClick={handleStartBuild} disabled={isBuilding}>
                    {isBuilding ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Building...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        {project.status === "failed" ? "Retry Build" : `Start ${buildType.toUpperCase()} Build`}
                      </>
                    )}
                  </Button>
                )}
                {project.status === "building" && (
                  <div className="space-y-2 w-full max-w-md">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground animate-pulse font-medium">
                        {buildProgress < 30 ? "Initializing environment..." : 
                         buildProgress < 60 ? "Compiling resources..." : 
                         buildProgress < 90 ? "Packaging application..." : "Finalizing build..."}
                      </span>
                      <span className="font-bold text-primary">{buildProgress}%</span>
                    </div>
                    <Progress value={buildProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground italic">
                      This usually takes 2-3 minutes. Please don&apos;t close this page.
                    </p>
                  </div>
                )}
                {project.status === "completed" && (
                  <div className="flex flex-wrap gap-3">
                    {project.apk_url && (
                      <a href={project.apk_url} download>
                        <Button>
                          <Download className="mr-2 h-4 w-4" />
                          Download {project.apk_url.endsWith(".aab") ? "AAB" : "APK"}
                        </Button>
                      </a>
                    )}
                    <Button variant="outline" onClick={handleStartBuild} disabled={isBuilding}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Rebuild ({buildType.toUpperCase()})
                    </Button>
                  </div>
                )}
              </div>
            </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="builds" className="w-full">
        <TabsList>
          <TabsTrigger value="builds">Build History</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="builds" className="mt-6">
          <BuildHistory projectId={project.id} />
        </TabsContent>
        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Branding & Configuration</CardTitle>
              <CardDescription>Update your app name, theme color and website URL</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateBranding} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="appName">App Name (Logo Name)</Label>
                    <Input id="appName" name="appName" defaultValue={project.app_name} required />
                    <p className="text-xs text-muted-foreground">This name appears under your icon on the phone.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Theme Color (HEX)</Label>
                    <div className="flex gap-2">
                      <Input id="primaryColor" name="primaryColor" type="color" className="w-12 p-1 h-10" defaultValue={project.primary_color} />
                      <Input 
                        name="primaryColorText" 
                        defaultValue={project.primary_color}
                        placeholder="#000000"
                        className="flex-1"
                        onChange={(e) => {
                          const colorInput = e.currentTarget.previousElementSibling as HTMLInputElement
                          if (colorInput) colorInput.value = e.target.value
                        }}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="websiteUrl">Website URL</Label>
                  <Input id="websiteUrl" name="websiteUrl" type="url" defaultValue={project.website_url} required />
                </div>

                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                  Save Branding Changes
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
