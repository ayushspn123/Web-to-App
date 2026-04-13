import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { buildApk } from "@/lib/builder"

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, context: RouteContext) {
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
      console.error("[v0] Auth error:", authError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] Starting build for project:", id)

    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (projectError || !project) {
      console.error("[v0] Project not found:", projectError)
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Update project status to building
    await supabase
      .from("projects")
      .update({ status: "building", updated_at: new Date().toISOString() })
      .eq("id", id)

    // Create build record
    const { data: build, error: buildError } = await supabase
      .from("builds")
      .insert({
        project_id: id,
        status: "building",
      })
      .select()
      .single()

    if (buildError) {
      console.error("[v0] Failed to create build:", buildError)
      return NextResponse.json({ error: "Failed to create build" }, { status: 500 })
    }

    const body = await request.json().catch(() => ({}))
    const buildType = body.buildType || "debug"

      // Trigger build process non-blocking
      ; (async () => {
        const startTime = Date.now()
        let finalResult: any = { success: false, error: "Unknown error" }

        try {
          finalResult = await buildApk(project, buildType)
        } catch (err: any) {
          console.error("[v0] Critical build error:", err)
          finalResult = { success: false, error: err.message || "Build worker crashed", logs: err.stack }
        }

        const duration = Math.round((Date.now() - startTime) / 1000)
        const { createAdminClient } = await import("@/lib/supabase/admin")
        const supabaseAdmin = createAdminClient()

        if (finalResult.success) {
          await Promise.all([
            supabaseAdmin
              .from("builds")
              .update({
                status: "completed",
                build_logs: finalResult.logs,
                apk_url: finalResult.apkUrl,
                apk_size: finalResult.apkSize,
                build_duration: duration,
                completed_at: new Date().toISOString(),
              })
              .eq("id", build.id),
            supabaseAdmin
              .from("projects")
              .update({
                status: "completed",
                apk_url: finalResult.apkUrl,
                updated_at: new Date().toISOString(),
              })
              .eq("id", id)
          ])
        } else {
          await Promise.all([
            supabaseAdmin
              .from("builds")
              .update({
                status: "failed",
                error_message: finalResult.error,
                build_logs: finalResult.logs,
                build_duration: duration,
                completed_at: new Date().toISOString(),
              })
              .eq("id", build.id),
            supabaseAdmin
              .from("projects")
              .update({
                status: "failed",
                updated_at: new Date().toISOString(),
              })
              .eq("id", id)
          ])
        }
      })()

    return NextResponse.json({
      project: {
        ...project,
        status: "building"
      }
    })
  } catch (error) {
    console.error("[v0] Build API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
