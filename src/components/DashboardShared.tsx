"use client";

import React from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/hooks/useTheme";

// Shared Constants

export const statusColor: Record<string, string> = {
  active: "#16a34a", inactive: "#9ca3af", pending: "#d97706",
  confirmed: "#2563eb", completed: "#16a34a", cancelled: "#dc2626",
  expired: "#9ca3af", refill: "#d97706",
};

export const statusBg: Record<string, string> = {
  active: "#f0fdf4", inactive: "#f5f5f5", pending: "#fffbeb",
  confirmed: "#eff6ff", completed: "#f0fdf4", cancelled: "#fef2f2",
  expired: "#f5f5f5", refill: "#fffbeb",
};

export const roleColor: Record<string, string> = {
  admin: "#1a1a1a", staff: "#1a1a1a", patient: "#333333",
};

// Shared Small Components

export function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{
      background: bg, color, borderRadius: 6, padding: "3px 10px",
      fontSize: 11, fontWeight: 600, textTransform: "capitalize",
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
      background: "#fff", border: "1px solid #e8e8e8", borderRadius: 16,
      padding: "22px 20px", display: "flex", flexDirection: "column", gap: 14,
      boxShadow: "0 2px 8px rgba(0,0,0,0.04)", position: "relative", overflow: "hidden",
    }}>
      <div style={{
        width: 42, height: 42, borderRadius: 12,
        background: "#1a1a1a",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <i className={iconClass} style={{ color: "#fff", fontSize: 16 }} />
      </div>
      <div>
        {loading ? (
          <div style={{ height: 30, width: 80, borderRadius: 8, background: "linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite", marginBottom: 6 }} />
        ) : (
          <div style={{ fontSize: 28, fontWeight: 700, color: "#111111", fontFamily: "'Inter', sans-serif", letterSpacing: "-0.5px" }}>{value}</div>
        )}
        <div style={{ fontSize: 13, color: "#888888", fontWeight: 500, marginTop: 3 }}>{label}</div>
      </div>
      {sub && !loading && (
        <div style={{ fontSize: 12, color: "#16a34a", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
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
    primary: { background: "#1a1a1a", color: "#fff", border: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" },
    secondary: { background: "#fff", color: "#333333", border: "1px solid #e0e0e0" },
    danger: { background: "#fff", color: "#dc2626", border: "1px solid #fee2e2" },
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        borderRadius: 10, padding: "8px 16px", fontSize: 13, fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        display: "inline-flex", alignItems: "center", gap: 7,
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
                height: 13, borderRadius: 6,
                background: "linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)",
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
      background: "#fef2f2", border: "1px solid #fee2e2", borderRadius: 12,
      padding: "16px 20px", color: "#dc2626", fontSize: 13, fontWeight: 600,
      display: "flex", alignItems: "center", gap: 10,
    }}>
      <i className="fa-solid fa-circle-exclamation" />
      {message}
    </div>
  );
}

export const NoAccess = () => (
  <div style={{ padding: 16, color: "#888888", fontSize: 14 }}>
    You do not have permission to view this section.
  </div>
);

// Permission Helper

export const getPermissions = (session: any): string[] => {
  if (!session?.user) return [];
  return Array.isArray(session.user.permissions) ? session.user.permissions : [];
};

// Nav Item Type

export interface NavItem {
  id: string;
  icon: string;
  label: string;
  requiredPermission?: string;
}

// Role Dashboard Metadata

interface RoleMeta {
  icon: string;
  portalLabel: string;
  avatarGradient: string;
}

const ROLE_META: Record<string, RoleMeta> = {
  admin:   { icon: "fa-solid fa-shield-halved",  portalLabel: "Admin Portal",   avatarGradient: "linear-gradient(135deg, #1a1a1a, #333333)" },
  staff:   { icon: "fa-solid fa-stethoscope",    portalLabel: "Staff Portal",   avatarGradient: "linear-gradient(135deg, #1a1a1a, #333333)" },
  patient: { icon: "fa-solid fa-heart-pulse",    portalLabel: "Patient Portal", avatarGradient: "linear-gradient(135deg, #333333, #555555)" },
};

function getRoleMeta(role: string): RoleMeta {
  return ROLE_META[role] ?? {
    icon: "fa-solid fa-gauge-high",
    portalLabel: `${role.charAt(0).toUpperCase() + role.slice(1)} Portal`,
    avatarGradient: "linear-gradient(135deg, #1a1a1a, #333333)",
  };
}

// Global CSS (Mono Theme + Dark Mode)

export const DARK_MODE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #f0f0f0; font-family: 'Inter', system-ui, sans-serif; color: #111111; }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #cccccc; border-radius: 99px; }
  input::placeholder { color: #aaaaaa; }
  input:focus { border-color: #1a1a1a !important; box-shadow: 0 0 0 3px rgba(26,26,26,0.08) !important; }
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }

  /* Dark Mode */
  [data-theme="dark"] { color-scheme: dark; }
  [data-theme="dark"] ::-webkit-scrollbar-thumb { background: #333333; }
  [data-theme="dark"] div, [data-theme="dark"] aside, [data-theme="dark"] main,
  [data-theme="dark"] header, [data-theme="dark"] section {
    transition: background 0.2s, border-color 0.2s, color 0.2s;
  }

  /* White card surfaces */
  [data-theme="dark"] div[style*="background: rgb(255, 255, 255)"],
  [data-theme="dark"] div[style*="background:#fff"],
  [data-theme="dark"] div[style*="background: #fff"] { background: #1c1c1c !important; border-color: #2a2a2a !important; }

  /* Light gray page / input surfaces */
  [data-theme="dark"] div[style*="background: rgb(240, 240, 240)"],
  [data-theme="dark"] div[style*="background:#f0f0f0"],
  [data-theme="dark"] div[style*="background: #f0f0f0"],
  [data-theme="dark"] div[style*="background: rgb(248, 248, 248)"],
  [data-theme="dark"] div[style*="background:#f8f8f8"],
  [data-theme="dark"] div[style*="background: #f8f8f8"],
  [data-theme="dark"] div[style*="background: rgb(244, 244, 244)"],
  [data-theme="dark"] div[style*="background:#f4f4f4"],
  [data-theme="dark"] div[style*="background: #f4f4f4"],
  [data-theme="dark"] div[style*="background: rgb(245, 245, 245)"],
  [data-theme="dark"] div[style*="background:#f5f5f5"],
  [data-theme="dark"] div[style*="background: #f5f5f5"] { background: #111111 !important; border-color: #2a2a2a !important; }

  /* Sidebar gray surfaces */
  [data-theme="dark"] div[style*="background: rgb(232, 232, 232)"],
  [data-theme="dark"] div[style*="background:#e8e8e8"],
  [data-theme="dark"] div[style*="background: #e8e8e8"],
  [data-theme="dark"] div[style*="background: rgb(239, 239, 239)"],
  [data-theme="dark"] div[style*="background:#efefef"],
  [data-theme="dark"] div[style*="background: #efefef"] { background: #141414 !important; border-color: #1f1f1f !important; }

  /* Text primary */
  [data-theme="dark"] div[style*="color: rgb(17, 17, 17)"],
  [data-theme="dark"] div[style*="color:#111111"],
  [data-theme="dark"] div[style*="color: #111111"],
  [data-theme="dark"] span[style*="color:#111111"],
  [data-theme="dark"] h1[style*="color:#111111"],
  [data-theme="dark"] h1[style*="color: rgb(17, 17, 17)"],
  [data-theme="dark"] h2[style*="color:#111111"],
  [data-theme="dark"] h2[style*="color: #111111"],
  [data-theme="dark"] h2[style*="color: rgb(17, 17, 17)"] { color: #ebebeb !important; }

  /* Text secondary */
  [data-theme="dark"] div[style*="color: rgb(51, 51, 51)"],
  [data-theme="dark"] div[style*="color:#333333"],
  [data-theme="dark"] div[style*="color: #333333"],
  [data-theme="dark"] span[style*="color:#333333"] { color: #cccccc !important; }

  /* Text medium */
  [data-theme="dark"] div[style*="color: rgb(85, 85, 85)"],
  [data-theme="dark"] div[style*="color:#555555"],
  [data-theme="dark"] div[style*="color: #555555"],
  [data-theme="dark"] span[style*="color:#555555"] { color: #aaaaaa !important; }

  /* Text muted */
  [data-theme="dark"] div[style*="color: rgb(136, 136, 136)"],
  [data-theme="dark"] div[style*="color:#888888"],
  [data-theme="dark"] div[style*="color: #888888"],
  [data-theme="dark"] span[style*="color:#888888"],
  [data-theme="dark"] p[style*="color:#888888"],
  [data-theme="dark"] label[style*="color:#888888"] { color: #666666 !important; }

  /* Borders */
  [data-theme="dark"] div[style*="border: 1px solid rgb(224, 224, 224)"],
  [data-theme="dark"] div[style*="border: 1px solid #e0e0e0"] { border-color: #2a2a2a !important; }
  [data-theme="dark"] div[style*="border: 1px solid rgb(232, 232, 232)"],
  [data-theme="dark"] div[style*="border: 1px solid #e8e8e8"] { border-color: #2a2a2a !important; }
  [data-theme="dark"] [style*="border-bottom: 1px solid rgb(239, 239, 239)"],
  [data-theme="dark"] [style*="border-bottom: 1px solid #efefef"],
  [data-theme="dark"] [style*="border-top: 1px solid rgb(239, 239, 239)"],
  [data-theme="dark"] [style*="border-top: 1px solid #efefef"] { border-color: #1f1f1f !important; }
  [data-theme="dark"] [style*="border-bottom: 1px solid rgb(232, 232, 232)"],
  [data-theme="dark"] [style*="border-bottom: 1px solid #e8e8e8"] { border-color: #1f1f1f !important; }

  /* Tables */
  [data-theme="dark"] table { border-collapse: collapse; }
  [data-theme="dark"] thead tr { background: #111111 !important; border-color: #1f1f1f !important; }
  [data-theme="dark"] thead th { color: #555555 !important; }
  [data-theme="dark"] tbody tr { border-color: #1f1f1f !important; }
  [data-theme="dark"] tbody tr:hover { background: #1a1a1a !important; }
  [data-theme="dark"] td { border-color: #1f1f1f !important; }
  [data-theme="dark"] td[style*="color: rgb(17, 17, 17)"],
  [data-theme="dark"] td[style*="color:#111111"],
  [data-theme="dark"] td[style*="color: #111111"] { color: #ebebeb !important; }
  [data-theme="dark"] td[style*="color: rgb(136, 136, 136)"],
  [data-theme="dark"] td[style*="color:#888888"],
  [data-theme="dark"] td[style*="color: #888888"] { color: #666666 !important; }
  [data-theme="dark"] td[style*="color: rgb(85, 85, 85)"],
  [data-theme="dark"] td[style*="color:#555555"],
  [data-theme="dark"] td[style*="color: #555555"] { color: #aaaaaa !important; }

  /* Inputs / selects */
  [data-theme="dark"] input, [data-theme="dark"] select, [data-theme="dark"] textarea {
    background: #1c1c1c !important; border-color: #2a2a2a !important; color: #ebebeb !important;
  }
  [data-theme="dark"] input::placeholder { color: #555555 !important; }

  /* Buttons */
  [data-theme="dark"] button[style*="background: rgb(255, 255, 255)"],
  [data-theme="dark"] button[style*="background:#fff"],
  [data-theme="dark"] button[style*="background: #fff"] { background: #1c1c1c !important; border-color: #2a2a2a !important; color: #cccccc !important; }
  [data-theme="dark"] button[style*="background: rgb(240, 240, 240)"],
  [data-theme="dark"] button[style*="background:#f0f0f0"],
  [data-theme="dark"] button[style*="background: #f0f0f0"] { background: #111111 !important; border-color: #2a2a2a !important; color: #cccccc !important; }

  /* Error / danger */
  [data-theme="dark"] div[style*="background: rgb(254, 242, 242)"],
  [data-theme="dark"] div[style*="background:#fef2f2"],
  [data-theme="dark"] div[style*="background: #fef2f2"] { background: #2a0a0a !important; border-color: #5a1a1a !important; }

  /* Modals / overlays */
  [data-theme="dark"] div[style*="background: rgba(0, 0, 0"] { background: rgba(0,0,0,0.75) !important; }

  /* Span light bg chips */
  [data-theme="dark"] span[style*="background: rgb(240, 240, 240)"],
  [data-theme="dark"] span[style*="background:#f0f0f0"],
  [data-theme="dark"] span[style*="background: #f0f0f0"],
  [data-theme="dark"] span[style*="background: rgb(245, 245, 245)"],
  [data-theme="dark"] span[style*="background:#f5f5f5"],
  [data-theme="dark"] span[style*="background: #f5f5f5"] { background: #1c1c1c !important; color: #aaaaaa !important; }

  /* Nav */
  [data-theme="dark"] nav button { color: #666666 !important; }
  [data-theme="dark"] nav button:hover { background: #1f1f1f !important; color: #ebebeb !important; }

  /* Theme toggle */
  .dash-theme-toggle {
    background: none; border: 1px solid #e0e0e0; border-radius: 10px;
    width: 36px; height: 36px; display: flex; align-items: center;
    justify-content: center; cursor: pointer; transition: all 0.2s; flex-shrink: 0;
  }
  [data-theme="dark"] .dash-theme-toggle { border-color: #2a2a2a; background: #1c1c1c; }
  .dash-theme-toggle:hover { background: #eeeeee; transform: scale(1.06); }
  [data-theme="dark"] .dash-theme-toggle:hover { background: #222222; }

  /* Sidebar collapse transition */
  aside { transition: width 0.25s cubic-bezier(0.4,0,0.2,1), background 0.2s, border-color 0.2s !important; }

  /* Legacy Tailwind color compat - Appointments / Prescriptions / other sections */

  /* Old table/card backgrounds: f9fafb, f3f4f6 */
  [data-theme="dark"] div[style*="background: rgb(249, 250, 251)"],
  [data-theme="dark"] div[style*="background:#f9fafb"],
  [data-theme="dark"] div[style*="background: #f9fafb"],
  [data-theme="dark"] div[style*="background: rgb(243, 244, 246)"],
  [data-theme="dark"] div[style*="background:#f3f4f6"],
  [data-theme="dark"] div[style*="background: #f3f4f6"] { background: #111111 !important; border-color: #1f1f1f !important; }

  /* Old borders: e5e7eb, f3f4f6 */
  [data-theme="dark"] div[style*="border: 1px solid rgb(229, 231, 235)"],
  [data-theme="dark"] div[style*="border: 1px solid #e5e7eb"] { border-color: #2a2a2a !important; }
  [data-theme="dark"] [style*="border-bottom: 1px solid rgb(243, 244, 246)"],
  [data-theme="dark"] [style*="border-bottom: 1px solid #f3f4f6"],
  [data-theme="dark"] [style*="border-top: 1px solid rgb(243, 244, 246)"],
  [data-theme="dark"] [style*="border-top: 1px solid #f3f4f6"] { border-color: #1f1f1f !important; }

  /* Old primary text: #111827 */
  [data-theme="dark"] td[style*="color: rgb(17, 24, 39)"],
  [data-theme="dark"] td[style*="color:#111827"],
  [data-theme="dark"] td[style*="color: #111827"],
  [data-theme="dark"] div[style*="color: rgb(17, 24, 39)"],
  [data-theme="dark"] div[style*="color:#111827"],
  [data-theme="dark"] div[style*="color: #111827"],
  [data-theme="dark"] span[style*="color: rgb(17, 24, 39)"],
  [data-theme="dark"] span[style*="color:#111827"],
  [data-theme="dark"] span[style*="color: #111827"] { color: #ebebeb !important; }

  /* Old secondary text: #374151 */
  [data-theme="dark"] td[style*="color: rgb(55, 65, 81)"],
  [data-theme="dark"] td[style*="color:#374151"],
  [data-theme="dark"] td[style*="color: #374151"],
  [data-theme="dark"] div[style*="color: rgb(55, 65, 81)"],
  [data-theme="dark"] div[style*="color:#374151"],
  [data-theme="dark"] div[style*="color: #374151"],
  [data-theme="dark"] span[style*="color: rgb(55, 65, 81)"],
  [data-theme="dark"] span[style*="color:#374151"],
  [data-theme="dark"] span[style*="color: #374151"] { color: #cccccc !important; }

  /* Old medium text: #4b5563 */
  [data-theme="dark"] div[style*="color: rgb(75, 85, 99)"],
  [data-theme="dark"] div[style*="color:#4b5563"],
  [data-theme="dark"] div[style*="color: #4b5563"],
  [data-theme="dark"] p[style*="color: rgb(75, 85, 99)"],
  [data-theme="dark"] p[style*="color:#4b5563"],
  [data-theme="dark"] p[style*="color: #4b5563"] { color: #aaaaaa !important; }

  /* Old muted text: #6b7280 */
  [data-theme="dark"] td[style*="color: rgb(107, 114, 128)"],
  [data-theme="dark"] td[style*="color:#6b7280"],
  [data-theme="dark"] td[style*="color: #6b7280"],
  [data-theme="dark"] div[style*="color: rgb(107, 114, 128)"],
  [data-theme="dark"] div[style*="color:#6b7280"],
  [data-theme="dark"] div[style*="color: #6b7280"],
  [data-theme="dark"] span[style*="color: rgb(107, 114, 128)"],
  [data-theme="dark"] span[style*="color:#6b7280"],
  [data-theme="dark"] span[style*="color: #6b7280"] { color: #888888 !important; }

  /* Old subtle text: #9ca3af */
  [data-theme="dark"] td[style*="color: rgb(156, 163, 175)"],
  [data-theme="dark"] td[style*="color:#9ca3af"],
  [data-theme="dark"] td[style*="color: #9ca3af"],
  [data-theme="dark"] div[style*="color: rgb(156, 163, 175)"],
  [data-theme="dark"] div[style*="color:#9ca3af"],
  [data-theme="dark"] div[style*="color: #9ca3af"],
  [data-theme="dark"] span[style*="color: rgb(156, 163, 175)"],
  [data-theme="dark"] span[style*="color:#9ca3af"],
  [data-theme="dark"] span[style*="color: #9ca3af"] { color: #666666 !important; }

  /* Old label colors: #374151 */
  [data-theme="dark"] label[style*="color: rgb(55, 65, 81)"],
  [data-theme="dark"] label[style*="color:#374151"],
  [data-theme="dark"] label[style*="color: #374151"] { color: #aaaaaa !important; }

  /* Old span chips: f3f4f6 bg */
  [data-theme="dark"] span[style*="background: rgb(243, 244, 246)"],
  [data-theme="dark"] span[style*="background:#f3f4f6"],
  [data-theme="dark"] span[style*="background: #f3f4f6"] { background: #1c1c1c !important; color: #aaaaaa !important; }

`;

// Dashboard Layout Component

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
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const permissions = getPermissions(session);
  const userRoles: string[] = session?.user?.roles ?? [session?.user?.role ?? "patient"];
  const meta = getRoleMeta(currentRole);

  const userName = session?.user?.name ?? "User";
  const userInitials = userName.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();

  const hasPermission = (perm: string) => permissions.includes(perm);
  const visibleNav = navItems.filter(n => !n.requiredPermission || hasPermission(n.requiredPermission));

  const SW = isCollapsed ? 68 : 220;

  // Colour palette (theme-aware)
  const C = {
    pageBg:        isDark ? "#0a0a0a"  : "#f0f0f0",
    sidebarBg:     isDark ? "#141414"  : "#e8e8e8",
    sidebarBorder: isDark ? "#1f1f1f"  : "#d8d8d8",
    cardBg:        isDark ? "#1c1c1c"  : "#ffffff",
    headerBg:      isDark ? "#1c1c1c"  : "#ffffff",
    border:        isDark ? "#2a2a2a"  : "#e8e8e8",
    borderSoft:    isDark ? "#1f1f1f"  : "#efefef",
    text1:         isDark ? "#ebebeb"  : "#111111",
    text2:         isDark ? "#aaaaaa"  : "#555555",
    text3:         isDark ? "#666666"  : "#888888",
    userCardBg:    isDark ? "#111111"  : "#d8d8d8",
  };

  return (
    <>
      <style>{DARK_MODE_CSS}</style>

      <div
        data-theme={isDark ? "dark" : "light"}
        style={{
          display: "flex", height: "100vh", overflow: "hidden",
          background: C.pageBg, transition: "background 0.2s",
          colorScheme: isDark ? "dark" : "light",
        }}
      >
        {/* Sidebar */}
        <aside style={{
          width: SW,
          flexShrink: 0,
          background: C.sidebarBg,
          borderRight: `1px solid ${C.sidebarBorder}`,
          display: "flex", flexDirection: "column",
          padding: "0 0 16px",
          overflow: "hidden",
          transition: "width 0.25s cubic-bezier(0.4,0,0.2,1), background 0.2s, border-color 0.2s",
        }}>

          {/* Brand row */}
          <div style={{
            padding: isCollapsed ? "18px 0" : "18px 14px 14px",
            borderBottom: `1px solid ${C.sidebarBorder}`,
            display: "flex", alignItems: "center",
            justifyContent: isCollapsed ? "center" : "space-between",
            gap: 8, flexShrink: 0,
            transition: "padding 0.25s",
          }}>
            {/* Logo square â€” click to toggle */}
            <div
              style={{
                width: 38, height: 38, borderRadius: 10,
                background: "#1a1a1a",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, cursor: "pointer",
              }}
              onClick={() => setIsCollapsed(!isCollapsed)}
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <i className={meta.icon} style={{ color: "#ffffff", fontSize: 15 }} />
            </div>

            {/* Brand text */}
            {!isCollapsed && (
              <div style={{ flex: 1, overflow: "hidden" }}>
                <div style={{
                  fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: 15,
                  color: C.text1, lineHeight: 1.1, letterSpacing: "-0.3px", whiteSpace: "nowrap",
                }}>
                  MediPanel
                </div>
                <div style={{
                  fontSize: 9.5, color: C.text3,
                  fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 2,
                  whiteSpace: "nowrap",
                }}>
                  {meta.portalLabel}
                </div>
              </div>
            )}

            {/* Collapse chevron (expanded state only) */}
            {!isCollapsed && (
              <button
                onClick={() => setIsCollapsed(true)}
                title="Collapse sidebar"
                style={{
                  background: "none",
                  border: `1px solid ${C.sidebarBorder}`,
                  borderRadius: 7, width: 26, height: 26,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", flexShrink: 0,
                  color: C.text3, transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = isDark ? "#1f1f1f" : "#fff";
                  (e.currentTarget as HTMLButtonElement).style.color = C.text1;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "none";
                  (e.currentTarget as HTMLButtonElement).style.color = C.text3;
                }}
              >
                <i className="fa-solid fa-chevron-left" style={{ fontSize: 10 }} />
              </button>
            )}
          </div>

          {/* "Menu" label */}
          {!isCollapsed ? (
            <div style={{ padding: "14px 18px 6px", flexShrink: 0 }}>
              <div style={{
                fontSize: 9.5, fontWeight: 700,
                color: isDark ? "#444444" : "#aaaaaa",
                textTransform: "uppercase", letterSpacing: "0.12em", whiteSpace: "nowrap",
              }}>
                Menu
              </div>
            </div>
          ) : (
            <div style={{ height: 10 }} />
          )}

          {/* Nav items */}
          <nav style={{
            flex: 1, padding: "0 10px",
            display: "flex", flexDirection: "column",
            overflow: "visible",
          }}>
            {visibleNav.map((n, navIdx) => {
              const isActive = activeSection === n.id;
              // Connector tab: only in expanded (non-collapsed) mode
              const showConnector = isActive && !isCollapsed;
              const CR = 10; // concave corner radius
              return (
                <div
                  key={n.id}
                  style={{
                    position: "relative",
                    marginBottom: navIdx < visibleNav.length - 1 ? 2 : 0,
                  }}
                >
                  {/* ── Top concave connector corner ── */}
                  {showConnector && (
                    <div style={{
                      position: "absolute",
                      top: -CR, right: -10,
                      width: CR, height: CR,
                      background: C.sidebarBg,
                      borderBottomLeftRadius: CR,
                      pointerEvents: "none",
                      zIndex: 2,
                    }} />
                  )}

                  <button
                    title={isCollapsed ? n.label : undefined}
                    onClick={() => {
                      if (n.id === "access") {
                        router.push(`/${currentRole}/access-role`);
                      } else {
                        onSectionChange(n.id);
                      }
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: isCollapsed ? "center" : "flex-start",
                      gap: 10,
                      padding: isCollapsed ? "9px 0" : "10px 12px",
                      // In connector mode: left-only radius, extend to sidebar edge, no right border
                      borderRadius: showConnector ? "10px 0 0 10px" : 10,
                      width: showConnector ? "calc(100% + 10px)" : "auto",
                      background: isActive ? (isDark ? "#2a2a2a" : "#ffffff") : "transparent",
                      border: isActive
                        ? `1px solid ${isDark ? "#333333" : "#e0e0e0"}`
                        : "1px solid transparent",
                      borderRight: showConnector ? "none" : undefined,
                      color: isActive ? C.text1 : C.text3,
                      fontSize: 13, fontWeight: isActive ? 600 : 500,
                      cursor: "pointer", textAlign: "left",
                      transition: "background 0.15s, color 0.15s, border-color 0.15s, box-shadow 0.15s",
                      fontFamily: "inherit",
                      boxShadow: isActive && !showConnector ? "0 1px 4px rgba(0,0,0,0.07)" : "none",
                      whiteSpace: "nowrap", overflow: "hidden",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLButtonElement).style.background = isDark ? "#1f1f1f" : "rgba(255,255,255,0.65)";
                        (e.currentTarget as HTMLButtonElement).style.color = isDark ? "#ebebeb" : "#333333";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                        (e.currentTarget as HTMLButtonElement).style.color = isDark ? "#666666" : "#888888";
                      }
                    }}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: 7,
                      background: isActive ? "#1a1a1a" : (isDark ? "#2a2a2a" : "#d0d0d0"),
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.15s", flexShrink: 0,
                    }}>
                      <i
                        className={n.icon}
                        style={{ fontSize: 12, color: isActive ? "#ffffff" : (isDark ? "#666666" : "#888888") }}
                      />
                    </div>
                    {!isCollapsed && (
                      <>
                        {n.label}
                        {isActive && (
                          <div style={{
                            marginLeft: "auto", width: 5, height: 5, borderRadius: "50%",
                            background: "#1a1a1a", flexShrink: 0,
                          }} />
                        )}
                      </>
                    )}
                  </button>

                  {/* ── Bottom concave connector corner ── */}
                  {showConnector && (
                    <div style={{
                      position: "absolute",
                      bottom: -CR, right: -10,
                      width: CR, height: CR,
                      background: C.sidebarBg,
                      borderTopLeftRadius: CR,
                      pointerEvents: "none",
                      zIndex: 2,
                    }} />
                  )}
                </div>
              );
            })}
          </nav>

          {/* Role Switcher â€” hidden when collapsed */}
          {!isCollapsed && userRoles.length > 1 && (
            <div style={{
              margin: "0 10px 8px",
              padding: "10px",
              background: isDark ? "#111111" : "rgba(0,0,0,0.05)",
              borderRadius: 10,
              border: `1px solid ${C.sidebarBorder}`,
              flexShrink: 0,
            }}>
              <div style={{
                fontSize: 9.5, fontWeight: 700,
                color: isDark ? "#444444" : "#aaaaaa",
                textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8,
              }}>
                Switch Role
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {userRoles.map((r) => (
                  <button
                    key={r}
                    onClick={() => router.push(`/${r}`)}
                    style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "6px 10px",
                      borderRadius: 7, border: "none",
                      background: r === currentRole ? "rgba(26,26,26,0.1)" : "transparent",
                      color: r === currentRole ? C.text1 : C.text3,
                      fontSize: 12, fontWeight: r === currentRole ? 700 : 500,
                      cursor: "pointer", fontFamily: "inherit",
                      textTransform: "capitalize", transition: "all 0.15s",
                    }}
                  >
                    <span style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: r === currentRole ? "#1a1a1a" : (isDark ? "#333333" : "#cccccc"),
                      flexShrink: 0,
                    }} />
                    {r}
                    {r === currentRole && (
                      <i className="fa-solid fa-check" style={{ marginLeft: "auto", fontSize: 9, color: "#1a1a1a" }} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* User card */}
          <div
            onClick={() => onSectionChange("profile")}
            title={isCollapsed ? `${userName} â€” Profile` : "Open Profile Settings"}
            style={{
              margin: "0 10px",
              padding: isCollapsed ? "9px 0" : "11px 12px",
              background: C.userCardBg,
              cursor: "pointer", borderRadius: 12,
              display: "flex", alignItems: "center",
              justifyContent: isCollapsed ? "center" : "flex-start",
              gap: 10,
              border: `1px solid ${C.sidebarBorder}`,
              transition: "background 0.15s, padding 0.25s",
              overflow: "hidden", flexShrink: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? "#1a1a1a" : "#cacaca")}
            onMouseLeave={(e) => (e.currentTarget.style.background = C.userCardBg)}
          >
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: meta.avatarGradient,
              color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700, flexShrink: 0,
              position: "relative", overflow: "hidden",
            }}>
              <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 0 }}>
                {userInitials}
              </span>
              {session?.user?.id && (
                <img
                  src={`https://dirqlpmlgorxxqqzqvls.supabase.co/storage/v1/object/public/avatars/${session.user.id}.jpg`}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0, zIndex: 1, display: "none" }}
                  onLoad={(e) => { e.currentTarget.style.display = "block"; }}
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
              )}
            </div>
            {!isCollapsed && (
              <>
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <div style={{
                    fontSize: 12, fontWeight: 700, color: C.text1,
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    {userName}
                  </div>
                  <div style={{ fontSize: 10, color: C.text3, textTransform: "capitalize" }}>
                    {currentRole}
                  </div>
                </div>
                <i
                  className="fa-solid fa-right-from-bracket"
                  style={{ color: isDark ? "#444444" : "#bbbbbb", fontSize: 13, cursor: "pointer", transition: "color 0.15s" }}
                  title="Sign Out"
                  onClick={(e) => {
                    e.stopPropagation();
                    signOut({ callbackUrl: "/" });
                  }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = "#dc2626"}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = isDark ? "#444444" : "#bbbbbb"}
                />
              </>
            )}
          </div>
        </aside>

        {/* Main */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Header */}
          <header style={{
            padding: "0 24px", height: 60,
            borderBottom: `1px solid ${C.border}`,
            background: C.headerBg,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexShrink: 0, transition: "background 0.2s",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}>
            {/* Left: hamburger toggle + breadcrumb */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                style={{
                  background: "none",
                  border: `1px solid ${C.border}`,
                  borderRadius: 8, width: 32, height: 32,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", transition: "all 0.15s", flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = isDark ? "#1f1f1f" : "#f0f0f0";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "none";
                }}
              >
                <i className="fa-solid fa-bars" style={{ color: C.text3, fontSize: 13 }} />
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h1 style={{
                  fontSize: 16, fontWeight: 700,
                  fontFamily: "'Inter', sans-serif", color: C.text1, margin: 0,
                }}>
                  {sectionTitles[activeSection] ?? activeSection}
                </h1>
                <span style={{ color: C.text3, fontSize: 13 }}>/</span>
                <span style={{ fontSize: 12, color: C.text3, fontWeight: 500 }}>Overview</span>
              </div>
            </div>

            {/* Right: Actions */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ fontSize: 12, color: C.text3, display: "flex", alignItems: "center", gap: 5 }}>
                <i className="fa-regular fa-calendar" style={{ fontSize: 11 }} />
                {new Date().toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
              </div>

              <div style={{ width: 1, height: 20, background: C.border }} />

              <button onClick={toggleTheme} className="dash-theme-toggle" title={isDark ? "Light mode" : "Dark mode"}>
                {isDark
                  ? <i className="fa-solid fa-sun" style={{ color: "#f59e0b", fontSize: 13 }} />
                  : <i className="fa-solid fa-moon" style={{ color: "#888888", fontSize: 13 }} />}
              </button>

              <button style={{
                background: "none", border: `1px solid ${C.border}`, borderRadius: 10,
                width: 36, height: 36,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", position: "relative",
              }}>
                <i className="fa-regular fa-bell" style={{ color: C.text3, fontSize: 14 }} />
                <span style={{
                  position: "absolute", top: 8, right: 8, width: 5, height: 5,
                  borderRadius: "50%", background: "#1a1a1a",
                  border: `1.5px solid ${C.headerBg}`,
                }} />
              </button>

              <div
                style={{
                  width: 32, height: 32, borderRadius: 9,
                  background: meta.avatarGradient,
                  color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700,
                  cursor: "pointer", flexShrink: 0,
                  position: "relative", overflow: "hidden",
                }}
                onClick={() => onSectionChange("profile")}
                title="Profile"
              >
                <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 0 }}>
                  {userInitials}
                </span>
                {session?.user?.id && (
                  <img
                    src={`https://dirqlpmlgorxxqqzqvls.supabase.co/storage/v1/object/public/avatars/${session.user.id}.jpg`}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0, zIndex: 1, display: "none" }}
                    onLoad={(e) => { e.currentTarget.style.display = "block"; }}
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                )}
              </div>
            </div>
          </header>

          {/* Scrollable content */}
          <div style={{
            flex: 1, overflowY: "auto", padding: "26px 28px",
            background: C.pageBg, transition: "background 0.2s",
            color: C.text1,
          }}>
            {children}
          </div>
        </main>
      </div>
    </>
  );
}

