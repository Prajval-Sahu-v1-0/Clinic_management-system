import { requirePermission, syncLegacyRoleId } from "@/lib/rbac";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  const guard = await requirePermission("manage_roles");
  if (guard.error) return guard.error;

  const { user_id, role_id } = await req.json();
  if (!user_id || !role_id) return Response.json({ error: "user_id and role_id required" }, { status: 400 });

  const { error } = await supabase
    .from("user_roles")
    .delete()
    .eq("user_id", user_id)
    .eq("role_id", role_id);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  await supabase.from("role_audit").insert({
    user_id,
    changed_by: guard.session.user.id,
    role_id,
    action: "remove",
  });

  await syncLegacyRoleId(user_id);

  return Response.json({ ok: true });
}
