import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { validateUser, getUser, registerUser } from "@/lib/mockDb";
import { getUserPermissions } from "@/lib/rbac";

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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "patient";
        token.name = user.name ?? "";
        token.email = user.email ?? "";
        // Fetch and normalize permissions from RBAC junction tables.
        // DB stores "View Patients" — normalize to "view_patients" to match UI keys.
        try {
          const rawPerms = await getUserPermissions(user.id as string);
          token.permissions = rawPerms.map((p) =>
            p.toLowerCase().replace(/\s+/g, "_")
          );
          console.log("[AUTH DEBUG] user.id:", user.id);
          console.log("[AUTH DEBUG] rawPerms from DB:", rawPerms);
          console.log("[AUTH DEBUG] normalized permissions:", token.permissions);
        } catch (err) {
          console.error("[AUTH DEBUG] getUserPermissions FAILED:", err);
          token.permissions = [];
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) ?? "patient";
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
            (user as { role?: string }).role = newUser.role;
          }
        } else {
          (user as { role?: string }).role = existingUser.role;
        }
      }
      return true;
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  session: { strategy: "jwt" },
});