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

        const { data: project, error: projectError } = await supabase
            .from("projects")
            .select("*")
            .eq("id", id)
            .eq("user_id", user.id)
            .single()

        if (projectError || !project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 })
        }

        return NextResponse.json({ project })
    } catch (error) {
        console.error("[v0] API error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
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

        const body = await request.json()
        const { name, website_url, app_name, package_name, primary_color, icon_url } = body

        const { data: project, error: updateError } = await supabase
            .from("projects")
            .update({
                name,
                website_url,
                app_name,
                package_name,
                primary_color,
                icon_url,
                updated_at: new Date().toISOString()
            })
            .eq("id", id)
            .eq("user_id", user.id)
            .select()
            .single()

        if (updateError) {
            console.error("[v0] Update error:", updateError)
            return NextResponse.json({ error: updateError.message }, { status: 500 })
        }

        return NextResponse.json({ project })
    } catch (error) {
        console.error("[v0] API error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
