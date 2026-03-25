import { supabase } from "./supabase";
import bcrypt from "bcryptjs";

export type UserRole = "patient" | "staff" | "admin";

export interface UserResult {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  provider: string;
}

export async function getUser(email: string): Promise<UserResult | null> {
  const { data, error } = await supabase
    .from("user")
    .select("user_id, name, email, provider, role:role(role_name)")
    .eq("email", email.toLowerCase())
    .single();

  if (error || !data) return null;

  const roleName =
    (data.role as unknown as { role_name: string })?.role_name ?? "patient";

  return {
    id: data.user_id,
    email: data.email,
    name: data.name,
    role: roleName as UserRole,
    provider: data.provider,
  };
}

export async function registerUser(
  name: string,
  email: string,
  password: string,
  provider: string = "credentials"
): Promise<UserResult | null> {
  const passwordHash = password ? await bcrypt.hash(password, 10) : null;

  const { data: roleData } = await supabase
    .from("role")
    .select("role_id")
    .eq("role_name", "patient")
    .single();

  const roleId = roleData?.role_id ?? null;

  const { data, error } = await supabase
    .from("user")
    .insert({
      name,
      email: email.toLowerCase(),  // ← email, not username
      password_hash: passwordHash,
      role_id: roleId,
      provider,
    })
    .select("user_id, name, email, provider")
    .single();

  if (error || !data) {
    console.error("registerUser error:", JSON.stringify(error, null, 2));
    return null;
  }

  // Auto-create patient profile
  await supabase.from("patient").insert({
    user_id: data.user_id,
    patient_name: name,
  });

  return {
    id: data.user_id,
    email: data.email,
    name: data.name,
    role: "patient",
    provider: data.provider,
  };
}

export async function validateUser(
  email: string,
  password: string
): Promise<UserResult | null> {
  const { data, error } = await supabase
    .from("user")
    .select("user_id, name, email, password_hash, provider, role:role(role_name)")
    .eq("email", email.toLowerCase())  // ← email, not username
    .single();

  if (error || !data) return null;

  if (!data.password_hash) return null;

  const valid = await bcrypt.compare(password, data.password_hash);
  if (!valid) return null;

  const roleName =
    (data.role as unknown as { role_name: string })?.role_name ?? "patient";

  return {
    id: data.user_id,
    email: data.email,
    name: data.name,
    role: roleName as UserRole,
    provider: data.provider,
  };
}