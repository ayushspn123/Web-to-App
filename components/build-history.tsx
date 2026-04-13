"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CheckCircle2, XCircle, Loader2, Clock, Download, ChevronDown, ChevronUp } from "lucide-react"
import type { Build } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { createBrowserClient } from "@/lib/supabase/client"

interface BuildHistoryProps {
  projectId: string
}

export function BuildHistory({ projectId }: BuildHistoryProps) {
  const [builds, setBuilds] = useState<Build[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedBuild, setExpandedBuild] = useState<string | null>(null)

  useEffect(() => {
    const fetchBuilds = async () => {
      try {
        const supabase = createBrowserClient()
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session?.access_token) {
          console.error("[v0] No session found")
          return
        }

        const response = await fetch(`/api/projects/${projectId}/builds`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setBuilds(data.builds || [])
        } else {
          console.error("[v0] Failed to fetch builds:", response.status)
        }
      } catch (error) {
        console.error("[v0] Failed to fetch builds:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBuilds()
    const interval = setInterval(fetchBuilds, 5000)
    return () => clearInterval(interval)
  }, [projectId])

  const statusConfig = {
    queued: { icon: Clock, label: "Queued", variant: "secondary" as const },
    building: { icon: Loader2, label: "Building", variant: "default" as const },
    completed: { icon: CheckCircle2, label: "Completed", variant: "default" as const },
    failed: { icon: XCircle, label: "Failed", variant: "destructive" as const },
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (builds.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Build History</CardTitle>
          <CardDescription>No builds yet for this project</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Build History</CardTitle>
        <CardDescription>{builds.length} build(s) total</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {builds.map((build) => {
            const config = statusConfig[build.status]
            const StatusIcon = config.icon
            const isExpanded = expandedBuild === build.id

            return (
              <div key={build.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={config.variant} className="flex items-center gap-1">
                        <StatusIcon className={`h-3 w-3 ${build.status === "building" ? "animate-spin" : ""}`} />
                        {config.label}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(build.created_at).toLocaleString()}
                      </span>
                    </div>
                    {build.build_duration && (
                      <p className="mt-2 text-sm text-muted-foreground">Build time: {build.build_duration}s</p>
                    )}
                    {build.apk_size && (
                      <p className="text-sm text-muted-foreground">
                        APK size: {(build.apk_size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {build.status === "completed" && build.apk_url && (
                      <a href={build.apk_url} download>
                        <Button size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                      </a>
                    )}
                    {(build.build_logs || build.error_message) && (
                      <Button size="sm" variant="ghost" onClick={() => setExpandedBuild(isExpanded ? null : build.id)}>
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4">
                    <h4 className="mb-2 text-sm font-medium">{build.error_message ? "Error Details" : "Build Logs"}</h4>
                    <ScrollArea className="h-48 rounded bg-muted p-3">
                      <pre className="text-xs whitespace-pre-wrap">
                        {build.error_message || build.build_logs || "No logs available for this build."}
                      </pre>
                    </ScrollArea>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
