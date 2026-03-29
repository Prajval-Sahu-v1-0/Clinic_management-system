import { requirePermission } from "@/lib/rbac";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  const guard = await requirePermission("manage_roles");
  if (guard.error) return guard.error;

  const { role_id, priority } = await req.json();
  if (!role_id || priority === undefined) {
    return Response.json({ error: "role_id and priority required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("role")
    .update({ priority })
    .eq("role_id", role_id);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
