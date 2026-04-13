import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, user_id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Auto-timeout builds stuck in 'building' for more than 15 minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()
    await supabase
      .from("builds")
      .update({
        status: "failed",
        error_message: "Build timed out or process was interrupted.",
        completed_at: new Date().toISOString()
      })
      .eq("project_id", id)
      .eq("status", "building")
      .lt("created_at", fifteenMinutesAgo)

    // Fetch builds
    const { data: builds, error: buildsError } = await supabase
      .from("builds")
      .select("*")
      .eq("project_id", id)
      .order("created_at", { ascending: false })

    if (buildsError) {
      console.error("[v0] Failed to fetch builds:", buildsError)
      return NextResponse.json({ error: "Failed to fetch builds" }, { status: 500 })
    }

    return NextResponse.json({ builds })
  } catch (error) {
    console.error("[v0] Builds API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
