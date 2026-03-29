"use server";

import { supabase } from "@/lib/supabase";
import { auth } from "@/../auth";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RbacRole {
  role_id: string;
  role_name: string;
  priority: number;
}

export interface RbacPermission {
  permission_id: string;
  name: string;
  description: string;
}

// ─── Core RBAC Functions ──────────────────────────────────────────────────────

/** Get all roles assigned to a user via user_roles, sorted by priority */
export async function getUserRoles(userId: string): Promise<RbacRole[]> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role:role_id(role_id, role_name, priority)")
    .eq("user_id", userId);

  if (error) throw error;

  return (data as any[])
    .map((d) => d.role as RbacRole)
    .filter(Boolean)
    .sort((a, b) => a.priority - b.priority);
}

/** Get all permission names for a user (via user_roles → role_permissions → permission) */
export async function getUserPermissions(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("user_roles")
    .select(`
      role:role_id(
        role_permissions(
          permission:permission_id(name)
        )
      )
    `)
    .eq("user_id", userId);

  if (error) throw error;

  const perms = new Set<string>();
  for (const ur of data as any[]) {
    for (const rp of ur.role?.role_permissions ?? []) {
      if (rp.permission?.name) perms.add(rp.permission.name);
    }
  }
  return Array.from(perms);
}

/**
 * Check if user has a specific permission.
 * Falls back to legacy role_id — admins always pass.
 */
export async function hasPermission(
  userId: string,
  permission: string
): Promise<boolean> {
  // Check RBAC junction tables first
  const perms = await getUserPermissions(userId);
  if (perms.includes(permission)) return true;

  // Fallback: legacy admin via user.role_id
  const { data } = await supabase
    .from("user")
    .select("role:role_id(role_name)")
    .eq("user_id", userId)
    .single();

  const roleName = (data?.role as any)?.role_name?.toLowerCase();
  return roleName === "admin";
}

/** Fetch every permission row from the permission table */
export async function getAllPermissions(): Promise<RbacPermission[]> {
  const { data, error } = await supabase
    .from("permission")
    .select("permission_id, name, description")
    .order("name");

  if (error) throw error;
  return data as RbacPermission[];
}

/** Sync user.role_id with the highest-priority role from user_roles */
export async function syncLegacyRoleId(userId: string): Promise<void> {
  const roles = await getUserRoles(userId);
  if (roles.length === 0) return;
  const primaryRole = roles[0]; // lowest priority number = highest rank
  await supabase
    .from("user")
    .update({ role_id: primaryRole.role_id })
    .eq("user_id", userId);
}

// ─── API Guard ────────────────────────────────────────────────────────────────

/**
 * Reusable auth + permission guard for API routes.
 * Returns session on success, or an error Response to return immediately.
 */
export async function requirePermission(permission: string): Promise<
  | { session: { user: { id: string; name?: string; email?: string; role?: string } }; error?: never }
  | { error: Response; session?: never }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const allowed = await hasPermission(session.user.id, permission);
  if (!allowed) {
    return { error: Response.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session: session as any };
}
