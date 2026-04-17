import { requirePermission, getUserRoles } from "@/lib/rbac";
import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const guard = await requirePermission("view_audit_logs");
  if (guard.error) return guard.error;

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = parseInt(url.searchParams.get("limit") || "20", 10);
  const actionFilter = url.searchParams.get("action");
  const actorFilter = url.searchParams.get("actor");
  const entityTypeFilter = url.searchParams.get("entity_type");

  const offset = (page - 1) * limit;

  // Determine if the current user is an admin
  const currentUserId = guard.session.user.id;
  const userRoles = await getUserRoles(currentUserId);
  const isAdmin = userRoles.some((r) => r.role_name.toLowerCase() === "admin");

  // Build query
  let query = supabase
    .from("audit_log")
    .select("*, user:actor_id(name)", { count: "exact" })
    .order("timestamp", { ascending: false });

  // Non-admin users only see their own audit entries
  if (!isAdmin) {
    query = query.eq("actor_id", currentUserId);
  }

  if (actionFilter && actionFilter !== "all") {
    if (actionFilter.toLowerCase() === "create") {
      query = query.in("action", ["create", "CREATE", "insert", "INSERT"]);
    } else if (actionFilter.toLowerCase() === "update") {
      query = query.in("action", ["update", "UPDATE"]);
    } else if (actionFilter.toLowerCase() === "delete") {
      query = query.in("action", ["delete", "DELETE"]);
    } else {
      query = query.ilike("action", actionFilter);
    }
  }
  if (entityTypeFilter && entityTypeFilter !== "all") {
    query = query.eq("entity_type", entityTypeFilter);
  }

  // Fetch paginated chunk
  const { data, count, error } = await query.range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Normalize data for the frontend
  const normalized = (data ?? []).map((row: any) => ({
    id: `al-${row.log_id || row.id}`,
    source: "audit_log",
    user_id: row.actor_id,
    actor: row.user?.name || row.actor_id || "System",
    actor_role: row.actor_role || "Unknown",
    action: row.action,
    entity: row.entity_type,
    entity_id: row.entity_id,
    before_data: row.before_data,
    after_data: row.after_data,
    timestamp: row.timestamp || row.created_at,
  }));

  // Perform actor text filtering in memory for now if specified
  let output = normalized;
  if (actorFilter && actorFilter.trim() !== "") {
    output = output.filter(e => e.actor.toLowerCase().includes(actorFilter.toLowerCase()));
  }

  return NextResponse.json({
    data: output,
    total: count || 0,
    page,
    limit,
    totalPages: count ? Math.ceil(count / limit) : 1
  });
}

