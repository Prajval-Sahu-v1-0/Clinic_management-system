import { requirePermission } from "@/lib/rbac";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  const guard = await requirePermission("manage_roles");
  if (guard.error) return guard.error;

  const { role_id, permission_id, action } = await req.json();
  if (!role_id || !permission_id || !action) {
    return Response.json({ error: "role_id, permission_id, and action required" }, { status: 400 });
  }

  if (action === "add") {
    const { error } = await supabase
      .from("role_permissions")
      .insert({ role_id, permission_id });
    if (error) return Response.json({ error: error.message }, { status: 500 });
  } else if (action === "remove") {
    const { error } = await supabase
      .from("role_permissions")
      .delete()
      .eq("role_id", role_id)
      .eq("permission_id", permission_id);
    if (error) return Response.json({ error: error.message }, { status: 500 });
  } else {
    return Response.json({ error: "action must be 'add' or 'remove'" }, { status: 400 });
  }

  return Response.json({ ok: true });
}
