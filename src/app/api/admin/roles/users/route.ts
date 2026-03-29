import { requirePermission } from "@/lib/rbac";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const guard = await requirePermission("manage_roles");
  if (guard.error) return guard.error;

  const { data, error } = await supabase
    .from("user")
    .select(`
      user_id, name, email, status,
      user_roles(
        role:role_id(role_id, role_name, priority)
      )
    `)
    .order("name");

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const users = (data as any[]).map((u) => ({
    user_id: u.user_id,
    name: u.name,
    email: u.email,
    status: u.status,
    roles: (u.user_roles ?? [])
      .map((ur: any) => ur.role)
      .filter(Boolean)
      .sort((a: any, b: any) => a.priority - b.priority),
  }));

  return Response.json(users);
}
