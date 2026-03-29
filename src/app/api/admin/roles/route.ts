import { requirePermission } from "@/lib/rbac";
import { supabase } from "@/lib/supabase";

// GET — list all roles with their permissions + all available permissions
export async function GET() {
  const guard = await requirePermission("manage_roles");
  if (guard.error) return guard.error;

  const [rolesResult, permsResult, memberResult] = await Promise.all([
    supabase
      .from("role")
      .select(`
        role_id, role_name, priority,
        role_permissions(
          permission:permission_id(permission_id, name, description)
        )
      `)
      .order("priority"),
    supabase.from("permission").select("permission_id, name, description").order("name"),
    supabase.from("user_roles").select("role_id"),
  ]);

  if (rolesResult.error) return Response.json({ error: rolesResult.error.message }, { status: 500 });

  const countMap: Record<string, number> = {};
  (memberResult.data ?? []).forEach((ur: any) => {
    countMap[ur.role_id] = (countMap[ur.role_id] ?? 0) + 1;
  });

  const roles = (rolesResult.data as any[]).map((r) => ({
    role_id: r.role_id,
    role_name: r.role_name,
    priority: r.priority,
    permissions: (r.role_permissions ?? []).map((rp: any) => rp.permission).filter(Boolean),
    members: countMap[r.role_id] ?? 0,
  }));

  return Response.json({ roles, permissions: permsResult.data ?? [] });
}

// POST — create a new role
export async function POST(req: Request) {
  const guard = await requirePermission("manage_roles");
  if (guard.error) return guard.error;

  const { role_name, priority } = await req.json();
  if (!role_name) return Response.json({ error: "role_name required" }, { status: 400 });

  const { error } = await supabase
    .from("role")
    .insert({ role_name, priority: priority ?? 99 });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}

// PATCH — update role name
export async function PATCH(req: Request) {
  const guard = await requirePermission("manage_roles");
  if (guard.error) return guard.error;

  const { role_id, role_name } = await req.json();
  if (!role_id || !role_name) return Response.json({ error: "role_id and role_name required" }, { status: 400 });

  const { error } = await supabase
    .from("role")
    .update({ role_name })
    .eq("role_id", role_id);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
