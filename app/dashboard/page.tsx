"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus, Code2, LogOut } from "lucide-react"
import { ProjectsList } from "@/components/projects-list"

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("[v0] Dashboard: Checking auth...")
        const supabase = createBrowserClient()
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser()

        console.log("[v0] Dashboard: Auth check result:", { user: user?.email, error })

        if (error) {
          console.error("[v0] Dashboard: Auth error:", error)
          router.push("/auth/login")
          return
        }

        if (!user) {
          console.log("[v0] Dashboard: No user found, redirecting to login")
          router.push("/auth/login")
        } else {
          console.log("[v0] Dashboard: User authenticated:", user.email)
          setUser(user)
        }
      } catch (err) {
        console.error("[v0] Dashboard: Exception during auth check:", err)
        router.push("/auth/login")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const handleSignOut = async () => {
    const supabase = createBrowserClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Code2 className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">WebToApp</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Your Projects</h1>
              <p className="mt-2 text-muted-foreground">Manage and build your Android apps from websites</p>
            </div>
            <Link href="/projects/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </Link>
          </div>

          <ProjectsList userId={user.id} />
        </div>
      </main>
    </div>
  )
}
