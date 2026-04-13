import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Download, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import type { Project } from "@/lib/types"

interface ProjectCardProps {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  const statusConfig = {
    pending: { icon: Clock, label: "Pending", variant: "secondary" as const },
    building: { icon: Loader2, label: "Building", variant: "default" as const },
    completed: { icon: CheckCircle2, label: "Completed", variant: "default" as const },
    failed: { icon: XCircle, label: "Failed", variant: "destructive" as const },
  }

  const config = statusConfig[project.status]
  const StatusIcon = config.icon

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-xl">{project.name}</CardTitle>
          <Badge variant={config.variant} className="flex items-center gap-1">
            <StatusIcon className={`h-3 w-3 ${project.status === "building" ? "animate-spin" : ""}`} />
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-muted-foreground">Website:</span>
            <a
              href={project.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 inline-flex items-center gap-1 text-primary hover:underline"
            >
              {new URL(project.website_url).hostname}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <div>
            <span className="text-muted-foreground">Package:</span>
            <span className="ml-2 font-mono text-xs">{project.package_name}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Created:</span>
            <span className="ml-2">{new Date(project.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Link href={`/projects/${project.id}`} className="flex-1">
          <Button variant="outline" className="w-full bg-transparent">
            View Details
          </Button>
        </Link>
        {project.status === "completed" && project.apk_url && (
          <a href={project.apk_url} download className="flex-1">
            <Button className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </a>
        )}
      </CardFooter>
    </Card>
  )
}
