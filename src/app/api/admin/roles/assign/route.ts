import { requirePermission, syncLegacyRoleId } from "@/lib/rbac";
import { supabase } from "@/lib/supabase";
import { logAudit } from "@/lib/audit";

export async function POST(req: Request) {
  const guard = await requirePermission("manage_roles");
  if (guard.error) return guard.error;

  const { user_id, role_id } = await req.json();
  if (!user_id || !role_id) return Response.json({ error: "user_id and role_id required" }, { status: 400 });

  const { error } = await supabase
    .from("user_roles")
    .insert({ user_id, role_id });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Legacy role_audit log
  await supabase.from("role_audit").insert({
    user_id,
    changed_by: guard.session.user.id,
    role_id,
    action: "assign",
  });

  // Resolve role name and target user for audit context
  const { data: roleRow } = await supabase.from("role").select("role_name").eq("role_id", role_id).single();
  const { data: targetUser } = await supabase.from("user").select("name, email").eq("user_id", user_id).single();

  logAudit({
    action: "assign",
    actor_id: guard.session.user.id,
    actor_role: guard.session.user.role || "admin",
    entity_type: "user_role",
    entity_id: user_id,
    after_data: {
      target_user: targetUser?.name ?? user_id,
      target_email: targetUser?.email ?? "",
      role_assigned: roleRow?.role_name ?? role_id,
    },
  });

  // Keep legacy role_id in sync
  await syncLegacyRoleId(user_id);

  return Response.json({ ok: true });
}
