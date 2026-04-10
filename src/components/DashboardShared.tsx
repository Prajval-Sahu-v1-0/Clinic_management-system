"use client";

import React, { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/hooks/useTheme";

// ─── Shared Constants ─────────────────────────────────────────────────────────

export const statusColor: Record<string, string> = {
  active: "#0d9488", inactive: "#9ca3af", pending: "#d97706",
  confirmed: "#2563eb", completed: "#0d9488", cancelled: "#dc2626",
  expired: "#9ca3af", refill: "#d97706",
};

export const statusBg: Record<string, string> = {
  active: "#f0fdfa", inactive: "#f9fafb", pending: "#fffbeb",
  confirmed: "#eff6ff", completed: "#f0fdfa", cancelled: "#fef2f2",
  expired: "#f9fafb", refill: "#fffbeb",
};

export const roleColor: Record<string, string> = {
  admin: "#0d9488", staff: "#0d9488", patient: "#2563eb",
};

// ─── Shared Small Components ──────────────────────────────────────────────────

export function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{
      background: bg, color, borderRadius: 6, padding: "3px 10px",
      fontSize: 11, fontWeight: 700, textTransform: "capitalize",
      letterSpacing: "0.02em", display: "inline-flex", alignItems: "center", gap: 5,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: color, display: "inline-block" }} />
      {label}
    </span>
  );
}

export function StatCard({
  iconClass, label, value, sub, loading,
}: {
  iconClass: string; label: string; value: string | number; sub?: string; loading?: boolean;
}) {
  return (
    <div style={{
      background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12,
      padding: "24px", display: "flex", flexDirection: "column", gap: 12,
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)", position: "relative", overflow: "hidden",
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 10,
        background: "linear-gradient(135deg, #0d9488, #14b8a6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 4px 12px rgba(22,163,74,0.25)",
      }}>
        <i className={iconClass} style={{ color: "#fff", fontSize: 18 }} />
      </div>
      <div>
        {loading ? (
          <div style={{ height: 32, width: 80, borderRadius: 6, background: "#f3f4f6", marginBottom: 6 }} />
        ) : (
          <div style={{ fontSize: 28, fontWeight: 700, color: "#111827", fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.5px" }}>{value}</div>
        )}
        <div style={{ fontSize: 13, color: "#6b7280", fontWeight: 500, marginTop: 2 }}>{label}</div>
      </div>
      {sub && !loading && (
        <div style={{ fontSize: 12, color: "#0d9488", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
          <i className="fa-solid fa-arrow-trend-up" style={{ fontSize: 11 }} />
          {sub}
        </div>
      )}
    </div>
  );
}

export function ActionButton({
  children, variant = "secondary", onClick, disabled, type = "button"
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger";
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}) {
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: "linear-gradient(135deg, #0d9488, #14b8a6)", color: "#fff", border: "none", boxShadow: "0 2px 8px rgba(22,163,74,0.3)" },
    secondary: { background: "#fff", color: "#374151", border: "1px solid #e5e7eb" },
    danger: { background: "#fff", color: "#dc2626", border: "1px solid #fee2e2" },
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        display: "inline-flex", alignItems: "center", gap: 6,
        transition: "all 0.15s", fontFamily: "inherit", ...styles[variant],
      }}
    >
      {children}
    </button>
  );
}

export function LoadingRows({ cols }: { cols: number }) {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <tr key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} style={{ padding: "14px 18px" }}>
              <div style={{
                height: 14, borderRadius: 6,
                background: "linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 1.4s infinite",
                width: j === 0 ? "60%" : "80%",
              }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function ErrorMessage({ message }: { message: string }) {
  return (
    <div style={{
      background: "#fef2f2", border: "1px solid #fee2e2", borderRadius: 10,
      padding: "16px 20px", color: "#dc2626", fontSize: 13, fontWeight: 600,
      display: "flex", alignItems: "center", gap: 10,
    }}>
      <i className="fa-solid fa-circle-exclamation" />
      {message}
    </div>
  );
}

export const NoAccess = () => (
  <div style={{ padding: 16, color: "#9ca3af", fontSize: 14 }}>
    You do not have permission to view this section.
  </div>
);

// ─── Permission Helper ────────────────────────────────────────────────────────

export const getPermissions = (session: any): string[] => {
  if (!session?.user) return [];
  return Array.isArray(session.user.permissions) ? session.user.permissions : [];
};

// ─── Nav Item Type ────────────────────────────────────────────────────────────

export interface NavItem {
  id: string;
  icon: string;
  label: string;
  requiredPermission?: string;
}

// ─── Role Dashboard Metadata ──────────────────────────────────────────────────

interface RoleMeta {
  icon: string;
  portalLabel: string;
  avatarGradient: string;
}

const ROLE_META: Record<string, RoleMeta> = {
  admin:   { icon: "fa-solid fa-plus",          portalLabel: "Admin Portal",   avatarGradient: "linear-gradient(135deg, #0d9488, #14b8a6)" },
  staff:   { icon: "fa-solid fa-stethoscope",   portalLabel: "Staff Portal",   avatarGradient: "linear-gradient(135deg, #0d9488, #14b8a6)" },
  patient: { icon: "fa-solid fa-heart-pulse",   portalLabel: "Patient Portal", avatarGradient: "linear-gradient(135deg, #2563eb, #3b82f6)" },
};

function getRoleMeta(role: string): RoleMeta {
  return ROLE_META[role] ?? { icon: "fa-solid fa-gauge-high", portalLabel: `${role.charAt(0).toUpperCase() + role.slice(1)} Portal`, avatarGradient: "linear-gradient(135deg, #0d9488, #14b8a6)" };
}

// ─── Shared Dark Mode CSS ─────────────────────────────────────────────────────

export const DARK_MODE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Lato:wght@400;700&family=JetBrains+Mono:wght@500;600&display=swap');
  @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #f3f4f6; font-family: 'Lato', sans-serif; color: #111827; }
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 99px; }
  input::placeholder { color: #9ca3af; }
  input:focus { border-color: #0d9488 !important; box-shadow: 0 0 0 3px rgba(22,163,74,0.1) !important; }
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  [data-theme="dark"] { color-scheme: dark; }
  [data-theme="dark"] ::-webkit-scrollbar-thumb { background: #475569; }
  [data-theme="dark"] div, [data-theme="dark"] aside, [data-theme="dark"] main, [data-theme="dark"] header, [data-theme="dark"] section {
    transition: background 0.2s, border-color 0.2s, color 0.2s;
  }
  [data-theme="dark"] div[style*="background: rgb(255, 255, 255)"],
  [data-theme="dark"] div[style*="background:#fff"],
  [data-theme="dark"] div[style*="background: #fff"] { background: #1e293b !important; border-color: #334155 !important; }
  [data-theme="dark"] div[style*="background: rgb(249, 250, 251)"],
  [data-theme="dark"] div[style*="background:#f9fafb"],
  [data-theme="dark"] div[style*="background: #f9fafb"],
  [data-theme="dark"] div[style*="background: rgb(243, 244, 246)"],
  [data-theme="dark"] div[style*="background:#f3f4f6"],
  [data-theme="dark"] div[style*="background: #f3f4f6"] { background: #162032 !important; border-color: #334155 !important; }
  [data-theme="dark"] div[style*="background: rgb(240, 253, 250)"],
  [data-theme="dark"] div[style*="background:#f0fdfa"],
  [data-theme="dark"] div[style*="background: #f0fdfa"] { background: #0c2a22 !important; border-color: #134e3a !important; }
  [data-theme="dark"] div[style*="color: rgb(17, 24, 39)"], [data-theme="dark"] div[style*="color:#111827"], [data-theme="dark"] div[style*="color: #111827"],
  [data-theme="dark"] span[style*="color: rgb(17, 24, 39)"], [data-theme="dark"] span[style*="color:#111827"], [data-theme="dark"] span[style*="color: #111827"],
  [data-theme="dark"] h1[style*="color:#111827"], [data-theme="dark"] h1[style*="color: #111827"],
  [data-theme="dark"] h2[style*="color:#111827"], [data-theme="dark"] h2[style*="color: #111827"], [data-theme="dark"] h2[style*="color: rgb(17, 24, 39)"] { color: #e2e8f0 !important; }
  [data-theme="dark"] div[style*="color: rgb(55, 65, 81)"], [data-theme="dark"] div[style*="color:#374151"], [data-theme="dark"] div[style*="color: #374151"],
  [data-theme="dark"] span[style*="color: rgb(55, 65, 81)"], [data-theme="dark"] span[style*="color:#374151"], [data-theme="dark"] span[style*="color: #374151"] { color: #cbd5e1 !important; }
  [data-theme="dark"] div[style*="color: rgb(107, 114, 128)"], [data-theme="dark"] div[style*="color:#6b7280"], [data-theme="dark"] div[style*="color: #6b7280"],
  [data-theme="dark"] span[style*="color: rgb(107, 114, 128)"], [data-theme="dark"] span[style*="color:#6b7280"], [data-theme="dark"] span[style*="color: #6b7280"],
  [data-theme="dark"] label[style*="color:#374151"], [data-theme="dark"] label[style*="color: #374151"] { color: #94a3b8 !important; }
  [data-theme="dark"] div[style*="color: rgb(156, 163, 175)"], [data-theme="dark"] div[style*="color:#9ca3af"], [data-theme="dark"] div[style*="color: #9ca3af"],
  [data-theme="dark"] span[style*="color: rgb(156, 163, 175)"], [data-theme="dark"] span[style*="color:#9ca3af"], [data-theme="dark"] span[style*="color: #9ca3af"],
  [data-theme="dark"] p[style*="color:#9ca3af"], [data-theme="dark"] p[style*="color: #9ca3af"] { color: #64748b !important; }
  [data-theme="dark"] div[style*="border: 1px solid rgb(229, 231, 235)"], [data-theme="dark"] div[style*="border: 1px solid #e5e7eb"] { border-color: #334155 !important; }
  [data-theme="dark"] [style*="border-bottom: 1px solid rgb(243, 244, 246)"], [data-theme="dark"] [style*="border-bottom: 1px solid #f3f4f6"],
  [data-theme="dark"] [style*="border-top: 1px solid rgb(243, 244, 246)"], [data-theme="dark"] [style*="border-top: 1px solid #f3f4f6"] { border-color: #1e293b !important; }
  [data-theme="dark"] table { border-collapse: collapse; }
  [data-theme="dark"] thead tr { background: #162032 !important; border-color: #1e293b !important; }
  [data-theme="dark"] thead th { color: #64748b !important; }
  [data-theme="dark"] tbody tr { border-color: #1e293b !important; }
  [data-theme="dark"] tbody tr:hover { background: #1a2740 !important; }
  [data-theme="dark"] td { border-color: #1e293b !important; }
  [data-theme="dark"] td[style*="color: rgb(17, 24, 39)"], [data-theme="dark"] td[style*="color:#111827"], [data-theme="dark"] td[style*="color: #111827"] { color: #e2e8f0 !important; }
  [data-theme="dark"] td[style*="color: rgb(107, 114, 128)"], [data-theme="dark"] td[style*="color:#6b7280"], [data-theme="dark"] td[style*="color: #6b7280"] { color: #94a3b8 !important; }
  [data-theme="dark"] td[style*="color: rgb(156, 163, 175)"], [data-theme="dark"] td[style*="color:#9ca3af"], [data-theme="dark"] td[style*="color: #9ca3af"] { color: #64748b !important; }
  [data-theme="dark"] input, [data-theme="dark"] select, [data-theme="dark"] textarea { background: #1e293b !important; border-color: #334155 !important; color: #e2e8f0 !important; }
  [data-theme="dark"] input::placeholder { color: #64748b !important; }
  [data-theme="dark"] button[style*="background: rgb(255, 255, 255)"], [data-theme="dark"] button[style*="background:#fff"], [data-theme="dark"] button[style*="background: #fff"] { background: #1e293b !important; border-color: #334155 !important; color: #cbd5e1 !important; }
  [data-theme="dark"] button[style*="background: rgb(249, 250, 251)"], [data-theme="dark"] button[style*="background:#f9fafb"], [data-theme="dark"] button[style*="background: #f9fafb"] { background: #162032 !important; border-color: #334155 !important; color: #cbd5e1 !important; }
  [data-theme="dark"] div[style*="background: rgb(243, 244, 246)"][style*="border-radius"] { background: #1e293b !important; }
  [data-theme="dark"] div[style*="background: rgba(0, 0, 0"] { background: rgba(0,0,0,0.6) !important; }
  [data-theme="dark"] span[style*="background: rgb(243, 244, 246)"], [data-theme="dark"] span[style*="background:#f3f4f6"], [data-theme="dark"] span[style*="background: #f3f4f6"] { background: #1e293b !important; color: #94a3b8 !important; }
  [data-theme="dark"] div[style*="background: rgb(254, 242, 242)"], [data-theme="dark"] div[style*="background:#fef2f2"], [data-theme="dark"] div[style*="background: #fef2f2"] { background: #350a0a !important; border-color: #7f1d1d !important; }
  [data-theme="dark"] div[style*="background: rgb(240, 253, 250)"][style*="border"] { background: #0c2a22 !important; border-color: #134e3a !important; }
  [data-theme="dark"] span[style*="color: rgb(15, 118, 110)"], [data-theme="dark"] span[style*="color:#0f766e"], [data-theme="dark"] span[style*="color: #0f766e"] { color: #2dd4bf !important; }
  [data-theme="dark"] nav button { color: #94a3b8 !important; }
  [data-theme="dark"] nav button:hover { background: #162032 !important; color: #e2e8f0 !important; }
  [data-theme="dark"] nav button[style*="background: rgb(240, 253, 250)"] { background: #0c2a22 !important; border-color: #134e3a !important; color: #2dd4bf !important; }
  [data-theme="dark"] nav button[style*="background: rgb(240, 253, 250)"] i { color: #fff !important; }
  [data-theme="dark"] nav button[style*="background: rgb(240, 253, 250)"] div[style*="background: rgb(13, 148, 136)"] { box-shadow: 0 4px 12px rgba(45,212,191,0.35); }
  .dash-theme-toggle {
    background: none; border: 1px solid #e5e7eb; border-radius: 8px;
    width: 34px; height: 34px; display: flex; align-items: center;
    justify-content: center; cursor: pointer; transition: all 0.2s; flex-shrink: 0;
  }
  [data-theme="dark"] .dash-theme-toggle { border-color: #334155; background: #1e293b; }
  .dash-theme-toggle:hover { transform: scale(1.1); }
`;

// ─── Dashboard Layout Component ──────────────────────────────────────────────

export function DashboardLayout({
  session,
  currentRole,
  navItems,
  sectionTitles,
  activeSection,
  onSectionChange,
  children,
}: {
  session: any;
  currentRole: string;
  navItems: NavItem[];
  sectionTitles: Record<string, string>;
  activeSection: string;
  onSectionChange: (section: string) => void;
  children: React.ReactNode;
}) {
  const { isDark, toggleTheme } = useTheme();
  const router = useRouter();
  const permissions = getPermissions(session);
  const userRoles: string[] = session?.user?.roles ?? [session?.user?.role ?? "patient"];
  const meta = getRoleMeta(currentRole);

  const userName = session?.user?.name ?? "User";
  const userInitials = userName.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();

  const hasPermission = (perm: string) => permissions.includes(perm);

  const visibleNav = navItems.filter(n => !n.requiredPermission || hasPermission(n.requiredPermission));

  return (
    <>
      <style>{DARK_MODE_CSS}</style>

      <div data-theme={isDark ? "dark" : "light"} style={{ display: "flex", height: "100vh", overflow: "hidden", background: isDark ? "#0f172a" : "#f3f4f6", transition: "background 0.2s", colorScheme: isDark ? "dark" : "light" }}>
        {/* Sidebar */}
        <aside style={{ width: 232, flexShrink: 0, background: isDark ? "#1e293b" : "#fff", borderRight: `1px solid ${isDark ? "#334155" : "#e5e7eb"}`, display: "flex", flexDirection: "column", padding: "0 0 16px", transition: "background 0.2s, border-color 0.2s" }}>
          {/* Brand */}
          <div style={{ padding: "20px 20px 16px", borderBottom: `1px solid ${isDark ? "#334155" : "#f3f4f6"}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg, #0d9488, #14b8a6)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 10px rgba(22,163,74,0.3)" }}>
                <i className={meta.icon} style={{ color: "#fff", fontSize: 14 }} />
              </div>
              <div>
                <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 16, color: isDark ? "#e2e8f0" : "#111827", lineHeight: 1.1, letterSpacing: "-0.3px" }}>MediPanel</div>
                <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>{meta.portalLabel}</div>
              </div>
            </div>
          </div>

          {/* Menu label */}
          <div style={{ padding: "16px 16px 6px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: isDark ? "#64748b" : "#9ca3af", textTransform: "uppercase", letterSpacing: "0.12em" }}>Main Menu</div>
          </div>

          {/* Nav items */}
          <nav style={{ flex: 1, padding: "0 8px", display: "flex", flexDirection: "column", gap: 1 }}>
            {visibleNav.map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  if (n.id === "access") {
                    router.push(`/${currentRole}/access-role`);
                  } else {
                    onSectionChange(n.id);
                  }
                }}
                style={{
                  display: "flex", alignItems: "center", gap: 11, padding: "10px 12px",
                  borderRadius: 9,
                  background: activeSection === n.id ? "#f0fdfa" : "transparent",
                  border: activeSection === n.id ? "1px solid #ccfbf1" : "1px solid transparent",
                  color: activeSection === n.id ? "#0f766e" : "#6b7280",
                  fontSize: 13, fontWeight: activeSection === n.id ? 700 : 500,
                  cursor: "pointer", textAlign: "left", transition: "all 0.15s", fontFamily: "inherit",
                }}
                onMouseEnter={(e) => {
                  if (activeSection !== n.id) {
                    (e.currentTarget as HTMLButtonElement).style.background = "#f9fafb";
                    (e.currentTarget as HTMLButtonElement).style.color = "#374151";
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeSection !== n.id) {
                    (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                    (e.currentTarget as HTMLButtonElement).style.color = "#6b7280";
                  }
                }}
              >
                <div style={{ width: 30, height: 30, borderRadius: 7, background: activeSection === n.id ? "#0d9488" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s", flexShrink: 0 }}>
                  <i className={n.icon} style={{ fontSize: 13, color: activeSection === n.id ? "#fff" : "#9ca3af" }} />
                </div>
                {n.label}
                {activeSection === n.id && <i className="fa-solid fa-chevron-right" style={{ marginLeft: "auto", fontSize: 10, color: "#0d9488" }} />}
              </button>
            ))}
          </nav>

          {/* Role Switcher (if multiple roles) */}
          {userRoles.length > 1 && (
            <div style={{ margin: "0 8px 8px", padding: "10px", background: isDark ? "#162032" : "#f9fafb", borderRadius: 10, border: `1px solid ${isDark ? "#334155" : "#f3f4f6"}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: isDark ? "#64748b" : "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Switch Role</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {userRoles.map((r) => (
                  <button
                    key={r}
                    onClick={() => router.push(`/${r}`)}
                    style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "6px 10px",
                      borderRadius: 7, border: "none",
                      background: r === currentRole ? "#0d948818" : "transparent",
                      color: r === currentRole ? "#0d9488" : (isDark ? "#94a3b8" : "#6b7280"),
                      fontSize: 12, fontWeight: r === currentRole ? 700 : 500,
                      cursor: "pointer", fontFamily: "inherit", textTransform: "capitalize", transition: "all 0.15s",
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: r === currentRole ? "#0d9488" : (isDark ? "#475569" : "#d1d5db"), flexShrink: 0 }} />
                    {r}
                    {r === currentRole && <i className="fa-solid fa-check" style={{ marginLeft: "auto", fontSize: 9, color: "#0d9488" }} />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* User card */}
          <div style={{ margin: "0 8px", padding: "12px", background: isDark ? "#162032" : "#f9fafb", borderRadius: 10, display: "flex", alignItems: "center", gap: 10, border: `1px solid ${isDark ? "#334155" : "#f3f4f6"}` }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: meta.avatarGradient, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{userInitials}</div>
            <div style={{ flex: 1, overflow: "hidden" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: isDark ? "#e2e8f0" : "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{userName}</div>
              <div style={{ fontSize: 11, color: "#94a3b8", textTransform: "capitalize" }}>{currentRole}</div>
            </div>
            <i
              className="fa-solid fa-right-from-bracket"
              style={{ color: isDark ? "#475569" : "#d1d5db", fontSize: 14, cursor: "pointer", transition: "color 0.15s" }}
              title="Sign Out"
              onClick={() => signOut({ callbackUrl: "/" })}
              onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = "#dc2626"}
              onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = isDark ? "#475569" : "#d1d5db"}
            />
          </div>
        </aside>

        {/* Main Content */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <header style={{ padding: "0 28px", height: 58, borderBottom: `1px solid ${isDark ? "#334155" : "#e5e7eb"}`, background: isDark ? "#1e293b" : "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, transition: "background 0.2s" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h1 style={{ fontSize: 17, fontWeight: 700, fontFamily: "'Outfit', sans-serif", color: isDark ? "#e2e8f0" : "#111827" }}>{sectionTitles[activeSection] ?? activeSection}</h1>
              <span style={{ color: isDark ? "#475569" : "#d1d5db" }}>/</span>
              <span style={{ fontSize: 13, color: "#94a3b8" }}>Overview</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ fontSize: 13, color: "#9ca3af", display: "flex", alignItems: "center", gap: 6 }}>
                <i className="fa-solid fa-calendar-day" style={{ fontSize: 12 }} />
                {new Date().toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
              </div>
              <button onClick={toggleTheme} className="dash-theme-toggle" title={isDark ? "Switch to light mode" : "Switch to dark mode"}>
                {isDark ? (
                  <i className="fa-solid fa-sun" style={{ color: "#f59e0b", fontSize: 14 }} />
                ) : (
                  <i className="fa-solid fa-moon" style={{ color: "#6b7280", fontSize: 14 }} />
                )}
              </button>
              <button style={{ background: "none", border: `1px solid ${isDark ? "#334155" : "#e5e7eb"}`, borderRadius: 8, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative" }}>
                <i className="fa-solid fa-bell" style={{ color: "#9ca3af", fontSize: 14 }} />
                <span style={{ position: "absolute", top: 7, right: 7, width: 6, height: 6, borderRadius: "50%", background: "#0d9488", border: `1.5px solid ${isDark ? "#1e293b" : "#fff"}` }} />
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: isDark ? "#0c2a22" : "#f0fdfa", border: `1px solid ${isDark ? "#134e3a" : "#ccfbf1"}`, borderRadius: 8, padding: "6px 12px" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#0d9488", display: "inline-block" }} />
                <span style={{ fontSize: 12, color: isDark ? "#2dd4bf" : "#0f766e", fontWeight: 700 }}>Active</span>
              </div>
            </div>
          </header>

          <div style={{ flex: 1, overflowY: "auto", padding: "26px 28px", background: isDark ? "#0f172a" : "#f3f4f6", transition: "background 0.2s", color: isDark ? "#e2e8f0" : "#111827" }}>
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
