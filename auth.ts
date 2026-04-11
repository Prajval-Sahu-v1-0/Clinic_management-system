import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { validateUser, getUser, registerUser } from "@/lib/mockDb";
import { supabase } from "@/lib/supabase";
import { logAudit } from "@/lib/audit";

// ─── Inline RBAC helpers (avoid importing from "use server" module) ───────────

async function fetchUserRoles(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role:role_id(role_id, role_name, priority)")
    .eq("user_id", userId);

  if (error) {
    console.error("[AUTH] fetchUserRoles error:", error.message);
    return [];
  }

  return (data as any[])
    .map((d) => d.role)
    .filter(Boolean)
    .sort((a: any, b: any) => a.priority - b.priority)
    .map((r: any) => (r.role_name as string).toLowerCase());
}

async function fetchUserPermissions(userId: string): Promise<string[]> {
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

  if (error) {
    console.error("[AUTH] fetchUserPermissions error:", error.message);
    return [];
  }

  const perms = new Set<string>();
  for (const ur of data as any[]) {
    for (const rp of ur.role?.role_permissions ?? []) {
      if (rp.permission?.name) perms.add(rp.permission.name);
    }
  }
  return Array.from(perms);
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;

        if (!email || !password) return null;

        const user = await validateUser(email, password);
        if (!user) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        // Find existing DB user just to be fully certain of the local UUID
        // because Google OAuth provides its own external numerical ID on the user obj
        let dbUserId = user.id;
        let dbUserRole = (user as { role?: string }).role ?? "patient";
        
        if (user.email) {
          const dbUser = await getUser(user.email);
          if (dbUser) {
            dbUserId = dbUser.id;
            dbUserRole = dbUser.role;
          }
        }

        token.id = dbUserId;
        token.role = dbUserRole;
        token.name = user.name ?? "";
        token.email = user.email ?? "";

        // Fetch roles and permissions directly from Supabase using the local UUID
        try {
          const roles = await fetchUserRoles(dbUserId as string);
          token.roles = roles.length > 0 ? roles : [token.role as string];

          const rawPerms = await fetchUserPermissions(dbUserId as string);
          token.permissions = rawPerms.map((p) =>
            p.toLowerCase().replace(/\s+/g, "_")
          );
        } catch (err) {
          console.error("[AUTH] Failed to fetch roles/permissions:", err);
          token.roles = [token.role as string];
          token.permissions = [];
        }
      }

      // If session update is triggered from the client, re-fetch roles & permissions
      if (trigger === "update" && token.id) {
         try {
           const roles = await fetchUserRoles(token.id as string);
           if (roles.length > 0) token.roles = roles;

           const rawPerms = await fetchUserPermissions(token.id as string);
           token.permissions = rawPerms.map((p) =>
             p.toLowerCase().replace(/\s+/g, "_")
           );
         } catch (err) {
           console.error("[AUTH] Failed to refresh roles/permissions:", err);
         }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) ?? "patient";
        session.user.roles = (token.roles as string[]) ?? [session.user.role];
        session.user.name = (token.name as string) ?? "";
        session.user.email = (token.email as string) ?? "";
        // Forward permissions from JWT token to session.
        session.user.permissions = (token.permissions as string[]) ?? [];
      }
      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const email = user.email;
        if (!email) return false;

        const existingUser = await getUser(email);
        if (!existingUser) {
          const newUser = await registerUser(
            user.name || "New User",
            email,
            "",
            "google"
          );
          if (newUser) {
            user.id = newUser.id;
            (user as { role?: string }).role = newUser.role;
          }
        } else {
          user.id = existingUser.id;
          (user as { role?: string }).role = existingUser.role;
        }
      }

      // Log audit entry for every successful login
      const userRole = (user as { role?: string }).role ?? "patient";
      logAudit({
        action: "login",
        actor_id: user.id as string,
        actor_role: userRole,
        entity_type: "session",
        entity_id: user.email ?? user.id as string,
        after_data: {
          provider: account?.provider ?? "credentials",
          name: user.name,
          email: user.email,
          timestamp: new Date().toISOString(),
        },
      });

      return true;
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  session: { strategy: "jwt" },
});