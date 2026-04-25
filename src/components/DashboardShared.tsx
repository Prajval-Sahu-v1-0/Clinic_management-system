"use client";

import React from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/hooks/useTheme";

// ═══════════════════════════════════════════════════════════════════════════════
// NATURE PALETTE DESIGN SYSTEM
// Deep Forest #144E42 | Sage #3A8F7A | Mint #A9D8C8 | Cream #EDE3D1 | Copper #C08A5A
// ═══════════════════════════════════════════════════════════════════════════════

// Shared Constants

export const statusColor: Record<string, string> = {
  active: "#3A8F7A", inactive: "#A9D8C8", pending: "#C08A5A",
  confirmed: "#3A8F7A", completed: "#3A8F7A", cancelled: "#dc2626",
  expired: "#A9D8C8", refill: "#C08A5A", scheduled: "#C08A5A",
};

export const statusBg: Record<string, string> = {
  active: "rgba(58,143,122,0.15)", inactive: "rgba(169,216,200,0.1)", pending: "rgba(192,138,90,0.15)",
  confirmed: "rgba(58,143,122,0.15)", completed: "rgba(58,143,122,0.15)", cancelled: "rgba(220,38,38,0.12)",
  expired: "rgba(169,216,200,0.1)", refill: "rgba(192,138,90,0.15)", scheduled: "rgba(192,138,90,0.15)",
};

export const roleColor: Record<string, string> = {
  admin: "#C08A5A", staff: "#3A8F7A", patient: "#A9D8C8",
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
  iconClass, label, value, sub, loading, isCircular, pct = 0, totalValue
}: {
  iconClass: string; label: string; value: string | number; sub?: string; loading?: boolean; isCircular?: boolean; pct?: number; totalValue?: number | string;
}) {
  if (isCircular) {
    const radius = 32;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (circumference * pct) / 100;

    return (
      <div style={{
        background: "var(--theme-card-bg)",
        border: "1px solid var(--theme-card-border)",
        borderRadius: 18,
        padding: "24px 16px",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        boxShadow: "var(--theme-card-shadow)",
        position: "relative", overflow: "hidden",
        transition: "transform 0.2s, box-shadow 0.2s",
      }}>
        {/* Subtle glow accent */}
        <div style={{
          position: "absolute", top: -30, right: -30, width: 80, height: 80,
          borderRadius: "50%", background: "rgba(58,143,122,0.1)", filter: "blur(20px)",
          pointerEvents: "none",
        }} />

        {loading ? (
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(90deg, var(--theme-border-soft) 25%, var(--theme-border) 50%, var(--theme-border-soft) 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />
        ) : (
          <div style={{ position: "relative", width: 90, height: 90, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="90" height="90" viewBox="0 0 80 80" style={{ transform: "rotate(-90deg)" }}>
              {/* Background ring */}
              <circle
                cx="40" cy="40" r={radius}
                fill="none" stroke="var(--theme-border-soft)" strokeWidth="10"
              />
              {/* Progress ring */}
              <circle
                cx="40" cy="40" r={radius}
                fill="none" stroke="url(#stat-grad)" strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                style={{ transition: "stroke-dashoffset 1s ease" }}
              />
              <defs>
                <linearGradient id="stat-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#c9832a" />
                  <stop offset="50%" stopColor="#56b89e" />
                  <stop offset="100%" stopColor="#3A8F7A" />
                </linearGradient>
              </defs>
            </svg>
            <div style={{ position: "absolute", fontSize: 20, fontWeight: 700, color: "var(--theme-text1)", fontFamily: "'Inter', sans-serif" }}>
              {pct}%
            </div>
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 4 }}>
          <div style={{ fontSize: 13, color: "var(--theme-text2)", fontWeight: 500, opacity: 0.9 }}>{label}</div>
          {!loading && totalValue !== undefined && (
            <div style={{ fontSize: 11, color: "var(--theme-text3)", fontWeight: 500 }}>
              {value} / {totalValue} Total
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: "var(--theme-card-bg)",
      border: "1px solid var(--theme-card-border)",
      borderRadius: 18,
      padding: "24px 22px",
      display: "flex", flexDirection: "column", gap: 16,
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      boxShadow: "var(--theme-card-shadow)",
      position: "relative", overflow: "hidden",
      transition: "transform 0.2s, box-shadow 0.2s",
    }}>
      {/* Subtle glow accent */}
      <div style={{
        position: "absolute", top: -30, right: -30, width: 80, height: 80,
        borderRadius: "50%", background: "rgba(58,143,122,0.15)", filter: "blur(20px)",
        pointerEvents: "none",
      }} />
      <div style={{
        width: 44, height: 44, borderRadius: 13,
        background: "linear-gradient(135deg, #3A8F7A, #144E42)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
        boxShadow: "0 4px 12px rgba(58,143,122,0.3)",
      }}>
        <i className={iconClass} style={{ color: "#EDE3D1", fontSize: 17 }} />
      </div>
      <div>
        {loading ? (
          <div style={{ height: 34, width: 80, borderRadius: 8, background: "linear-gradient(90deg, var(--theme-border-soft) 25%, var(--theme-border) 50%, var(--theme-border-soft) 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite", marginBottom: 6 }} />
        ) : (
          <div style={{ fontSize: 30, fontWeight: 700, color: "var(--theme-text1)", fontFamily: "'Inter', sans-serif", letterSpacing: "-0.5px", lineHeight: 1.1 }}>{value}</div>
        )}
        <div style={{ fontSize: 13, color: "var(--theme-text2)", fontWeight: 500, marginTop: 5, opacity: 0.8 }}>{label}</div>
      </div>
      {sub && !loading && (
        <div style={{ fontSize: 12, color: "var(--sage)", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
          <i className="fa-solid fa-arrow-trend-up" style={{ fontSize: 11 }} />
          {sub}
        </div>
      )}
    </div>
  );
}

export function CalendarStatCard({
  iconClass, label, value, sub, loading, pct = 0, totalValue, appointments = []
}: {
  iconClass: string; label: string; value: string | number; sub?: string; loading?: boolean; pct?: number; totalValue?: number | string; appointments?: any[];
}) {
  const [currentDate, setCurrentDate] = React.useState(new Date());

  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (circumference * pct) / 100;

  // Calendar logic
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days = Array.from({ length: 42 }, (_, i) => {
    const dayRender = i - firstDay + 1;
    if (dayRender > 0 && dayRender <= daysInMonth) return dayRender;
    return null;
  });

  const changeMonth = (dir: number) => {
    setCurrentDate(new Date(year, month + dir, 1));
  };

  const getLocalDateString = (d: number) => {
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${year}-${pad(month + 1)}-${pad(d)}`;
  };

  const isToday = (d: number) => {
    const today = new Date();
    return d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  };

  const getAppointmentsForDay = (d: number) => {
    const dateStr = getLocalDateString(d);
    return appointments.filter(a => a.date === dateStr);
  };

  const formatDocName = (name?: string) => {
    if (!name) return "Doc";
    return name.replace(/^Dr\.\s*/i, "");
  };

  return (
    <div style={{
      gridColumn: "1 / -1", // Will span the entire row functionally, or explicitly span logic depending on grid setup
      background: "var(--theme-card-bg)",
      border: "1px solid var(--theme-card-border)",
      borderRadius: 18,
      padding: "20px",
      display: "flex", gap: 24, alignItems: "stretch",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      boxShadow: "var(--theme-card-shadow)",
      position: "relative", overflow: "hidden",
      transition: "transform 0.2s, box-shadow 0.2s",
    }}>
      {/* Subtle glow accent */}
      <div style={{
        position: "absolute", top: -30, right: -30, width: 120, height: 120,
        borderRadius: "50%", background: "rgba(58,143,122,0.1)", filter: "blur(20px)",
        pointerEvents: "none",
      }} />

      {/* Left side: Circular Progress */}
      <div style={{
        flex: "0 0 160px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, borderRight: "1px solid var(--theme-border-soft)", paddingRight: 24
      }}>
        {loading ? (
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(90deg, var(--theme-border-soft) 25%, var(--theme-border) 50%, var(--theme-border-soft) 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />
        ) : (
          <div style={{ position: "relative", width: 90, height: 90, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="90" height="90" viewBox="0 0 80 80" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="40" cy="40" r={radius} fill="none" stroke="var(--theme-border-soft)" strokeWidth="10" />
              <circle
                cx="40" cy="40" r={radius} fill="none" stroke="url(#stat-grad)" strokeWidth="10"
                strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
                style={{ transition: "stroke-dashoffset 1s ease" }}
              />
              <defs>
                <linearGradient id="stat-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#c9832a" />
                  <stop offset="50%" stopColor="#56b89e" />
                  <stop offset="100%" stopColor="#3A8F7A" />
                </linearGradient>
              </defs>
            </svg>
            <div style={{ position: "absolute", fontSize: 20, fontWeight: 700, color: "var(--theme-text1)", fontFamily: "'Inter', sans-serif" }}>
              {pct}%
            </div>
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 4 }}>
          <div style={{ fontSize: 13, color: "var(--theme-text2)", fontWeight: 500, opacity: 0.9 }}>{label}</div>
          {!loading && totalValue !== undefined && (
            <div style={{ fontSize: 11, color: "var(--theme-text3)", fontWeight: 500 }}>
              {value} / {totalValue} Total
            </div>
          )}
        </div>
      </div>

      {/* Right side: Mini Calendar */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--theme-text1)", display: "flex", alignItems: "center", gap: 6 }}>
            <i className="fa-regular fa-calendar-days" style={{ color: "var(--sage)", fontSize: 13 }} />
            {currentDate.toLocaleString("default", { month: "long" })} {year}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => changeMonth(-1)} style={{ background: "none", border: "1px solid var(--theme-border-soft)", borderRadius: 6, width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--theme-text2)", transition: "all 0.15s" }} onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "var(--theme-table-hover-bg)")} onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "none")}>
              <i className="fa-solid fa-chevron-left" style={{ fontSize: 10 }} />
            </button>
            <button onClick={() => changeMonth(1)} style={{ background: "none", border: "1px solid var(--theme-border-soft)", borderRadius: 6, width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--theme-text2)", transition: "all 0.15s" }} onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "var(--theme-table-hover-bg)")} onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "none")}>
              <i className="fa-solid fa-chevron-right" style={{ fontSize: 10 }} />
            </button>
          </div>
        </div>

        {/* Days Header */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 8 }}>
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
            <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: "var(--theme-text3)", textTransform: "uppercase" }}>{d}</div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px 4px" }}>
          {days.map((day, idx) => {
            if (!day) return <div key={idx} />;
            const today = isToday(day);
            const marked = getAppointmentsForDay(day).length > 0;
            return (
              <div key={idx} style={{
                height: 36, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                borderRadius: 6,
                background: today
                  ? "linear-gradient(135deg, #3A8F7A, #144E42)"
                  : (marked ? "rgba(58,143,122,0.12)" : "transparent"),
                border: marked && !today ? "1px solid rgba(58,143,122,0.3)" : "1px solid transparent",
                position: "relative",
              }}>
                <div style={{
                  fontSize: 11,
                  fontWeight: marked || today ? 600 : 400,
                  color: today ? "#EDE3D1" : (marked ? "var(--sage)" : "var(--theme-text2)"),
                }}>
                  {day}
                </div>
                {marked && !today && (
                  <span style={{
                    position: "absolute", bottom: 3,
                    width: 4, height: 4, borderRadius: "50%",
                    background: "var(--sage)", display: "block",
                  }} />
                )}
              </div>
            );
          })}
        </div>
      </div>
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
    primary: {
      background: "linear-gradient(135deg, var(--sage), var(--forest-light))",
      color: "var(--cream)",
      border: "1px solid var(--theme-border)",
      boxShadow: "0 4px 14px var(--sage-glow)",
    },
    secondary: {
      background: "var(--theme-card-bg)",
      color: "var(--theme-text2)",
      border: "1px solid var(--theme-border)",
    },
    danger: {
      background: "var(--theme-danger-bg)",
      color: "var(--theme-danger-color)",
      border: "1px solid var(--theme-danger-border)",
    },
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
        transition: "all 0.2s", fontFamily: "inherit", ...styles[variant],
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
                background: "linear-gradient(90deg, var(--theme-border-soft) 25%, var(--theme-border) 50%, var(--theme-border-soft) 75%)",
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
      background: "var(--theme-danger-bg)", border: "1px solid var(--theme-danger-border)", borderRadius: 12,
      padding: "16px 20px", color: "var(--theme-danger-color)", fontSize: 13, fontWeight: 600,
      display: "flex", alignItems: "center", gap: 10,
    }}>
      <i className="fa-solid fa-circle-exclamation" />
      {message}
    </div>
  );
}

export const NoAccess = () => (
  <div style={{ padding: 16, color: "var(--theme-text2)", fontSize: 14 }}>
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
  admin: { icon: "fa-solid fa-shield-halved", portalLabel: "Admin Portal", avatarGradient: "linear-gradient(135deg, #144E42, #3A8F7A)" },
  staff: { icon: "fa-solid fa-stethoscope", portalLabel: "Staff Portal", avatarGradient: "linear-gradient(135deg, #144E42, #3A8F7A)" },
  patient: { icon: "fa-solid fa-heart-pulse", portalLabel: "Patient Portal", avatarGradient: "linear-gradient(135deg, #3A8F7A, #A9D8C8)" },
};

function getRoleMeta(role: string): RoleMeta {
  return ROLE_META[role] ?? {
    icon: "fa-solid fa-gauge-high",
    portalLabel: `${role.charAt(0).toUpperCase() + role.slice(1)} Portal`,
    avatarGradient: "linear-gradient(135deg, #144E42, #3A8F7A)",
  };
}

// Global CSS (Nature Palette Theme)

export const DARK_MODE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: var(--theme-page-bg); font-family: 'Inter', system-ui, sans-serif; color: var(--theme-text1); }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--theme-border); border-radius: 99px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--theme-text3); }
  input::placeholder { color: var(--theme-text3); }
  input:focus { border-color: var(--sage) !important; box-shadow: 0 0 0 3px var(--sage-glow) !important; }
  select:focus { border-color: var(--sage) !important; box-shadow: 0 0 0 3px var(--sage-glow) !important; }
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-8px); }
  }
  .animate-float { animation: float 4s ease-in-out infinite; }

  /* Tables */
  table { border-collapse: collapse; }
  thead tr { background: var(--theme-table-header-bg) !important; text-align: left; }
  thead th { color: var(--theme-text2) !important; padding: 12px 16px; font-weight: 600; }
  tbody tr { border-color: var(--theme-table-row-border) !important; border-bottom: 1px solid var(--theme-table-row-border); }
  tbody tr:hover { background: var(--theme-table-hover-bg) !important; }
  td { border-color: var(--theme-table-row-border) !important; padding: 12px 16px; }

  /* Inputs / selects */
  input, select, textarea {
    background: var(--theme-input-bg) !important;
    border-color: var(--theme-input-border) !important;
    color: var(--theme-text1) !important;
  }
  input::placeholder { color: var(--theme-text3) !important; }

  /* Theme toggle */
  .dash-theme-toggle {
    background: var(--theme-card-bg); border: 1px solid var(--theme-border); border-radius: 10px;
    width: 36px; height: 36px; display: flex; align-items: center;
    justify-content: center; cursor: pointer; transition: all 0.2s; flex-shrink: 0;
    color: var(--theme-text2);
  }
  .dash-theme-toggle:hover { background: var(--theme-filter-active-bg); transform: scale(1.06); }

  /* Sidebar collapse transition */
  aside { transition: width 0.25s cubic-bezier(0.4,0,0.2,1), background 0.2s, border-color 0.2s !important; }
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

  const SW = isCollapsed ? 68 : 230;

  // Nature palette (always dark-first aesthetic)
  const C = {
    pageBg: "var(--theme-page-bg)",
    sidebarBg: "var(--theme-sidebar-bg)",
    cardBg: "var(--theme-card-bg)",
    headerBg: "var(--theme-header-bg)",
    border: "var(--theme-border)",
    borderSoft: "var(--theme-border-soft)",
    text1: "var(--theme-text1)",
    text2: "var(--theme-text2)",
    text3: "var(--theme-text3)",
    userCardBg: "var(--theme-user-card-bg)",
    accent: "var(--sage)",
    accentGlow: "var(--sage-glow)",
    copper: "var(--copper)",
    copperGlow: "var(--copper-glow)",
    sidebarOverlay: "var(--theme-sidebar-overlay)",
    sidebarText1: "var(--theme-text1)",
    sidebarText2: "var(--theme-text2)",
    sidebarText3: "var(--theme-text3)",
    sidebarCardBg: "var(--theme-card-bg)",
    sidebarHoverBg: "var(--theme-table-hover-bg)",
    sidebarActiveBg: "var(--theme-filter-active-bg)",
    sidebarBorder: "var(--theme-sidebar-border)"
  };

  return (
    <>
      <style>{DARK_MODE_CSS}</style>

      <div
        style={{
          display: "flex", height: "100vh", overflow: "hidden",
          background: C.pageBg,
          colorScheme: "dark",
        }}
      >
        {/* Sidebar */}
        <aside style={{
          width: SW,
          flexShrink: 0,
          backgroundImage: isDark ? "url('/dashboard-bg.jpg')" : "url('/light-dasboard-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          display: "flex", flexDirection: "column",
          padding: "0 0 16px",
          overflow: "hidden",
          position: "relative",
          transition: "width 0.25s cubic-bezier(0.4,0,0.2,1)",
        }}>
          {/* Sidebar overlay so nav text stays legible */}
          <div style={{
            position: "absolute", inset: 0,
            backdropFilter: "blur(2px)",
            WebkitBackdropFilter: "blur(2px)",
            zIndex: 0, pointerEvents: "none",
          }} />
          {/* Sidebar content wrapper — above overlay */}
          <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", flex: 1, padding: "0 0 0" }}>

            {/* Brand row */}
            <div style={{
              padding: isCollapsed ? "18px 0" : "20px 16px 16px",
              borderBottom: `1px solid ${C.sidebarBorder}`,
              display: "flex", alignItems: "center",
              justifyContent: isCollapsed ? "center" : "space-between",
              gap: 8, flexShrink: 0,
              transition: "padding 0.25s",
            }}>
              {/* Logo square — click to toggle */}
              <div
                style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: "linear-gradient(135deg, #3A8F7A, #144E42)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(58,143,122,0.3)",
                }}
                onClick={() => setIsCollapsed(!isCollapsed)}
                title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <i className={meta.icon} style={{ color: "#EDE3D1", fontSize: 16 }} />
              </div>

              {/* Brand text */}
              {!isCollapsed && (
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <div style={{
                    fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: 16,
                    color: C.text1, lineHeight: 1.1, letterSpacing: "-0.3px", whiteSpace: "nowrap",
                  }}>
                    MediPanel
                  </div>
                  <div style={{
                    fontSize: 9.5, color: C.copper,
                    fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 3,
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
                    borderRadius: 8, width: 28, height: 28,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", flexShrink: 0,
                    color: C.text3, transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(58,143,122,0.15)";
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
              <div style={{ padding: "16px 18px 6px", flexShrink: 0 }}>
                <div style={{
                  fontSize: 9.5, fontWeight: 700,
                  color: C.sidebarText3,
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
              padding: "10px",
              background: !isDark ? "rgba(142, 151, 110, 0.15)" : "rgba(78, 45, 24, 0.15)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
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
                        background: isActive ? C.pageBg : "transparent",
                        borderTop: isActive ? `1px solid ${C.sidebarBorder}` : "1px solid transparent",
                        borderBottom: isActive ? `1px solid ${C.sidebarBorder}` : "1px solid transparent",
                        borderLeft: isActive ? `1px solid ${C.sidebarBorder}` : "1px solid transparent",
                        borderRight: showConnector ? "none" : (isActive ? `1px solid ${C.sidebarBorder}` : "1px solid transparent"),
                        color: isActive ? C.sidebarText1 : C.sidebarText3,
                        fontSize: 13, fontWeight: isActive ? 600 : 500,
                        cursor: "pointer", textAlign: "left",
                        transition: "background 0.15s, color 0.15s, border-color 0.15s, box-shadow 0.15s",
                        fontFamily: "inherit",
                        boxShadow: isActive && !showConnector ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
                        whiteSpace: "nowrap", overflow: "hidden",
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          (e.currentTarget as HTMLButtonElement).style.background = C.sidebarHoverBg;
                          (e.currentTarget as HTMLButtonElement).style.color = C.sidebarText2;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                          (e.currentTarget as HTMLButtonElement).style.color = C.sidebarText3;
                        }
                      }}
                    >
                      <div style={{
                        width: 28, height: 28, borderRadius: 8,
                        background: isActive ? "linear-gradient(135deg, #3A8F7A, #144E42)" : "rgba(169,216,200,0.08)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.15s", flexShrink: 0,
                        boxShadow: isActive ? "0 4px 10px rgba(58,143,122,0.25)" : "none",
                      }}>
                        <i
                          className={n.icon}
                          style={{ fontSize: 12, color: isActive ? "#EDE3D1" : C.sidebarText3 }}
                        />
                      </div>
                      {!isCollapsed && (
                        <>
                          {n.label}
                          {isActive && (
                            <div style={{
                              marginLeft: "auto", width: 5, height: 5, borderRadius: "50%",
                              background: "#C08A5A", flexShrink: 0,
                              boxShadow: "0 0 8px rgba(192,138,90,0.5)",
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

            <div style={{ flex: 1 }} />

            {/* Role Switcher — hidden when collapsed */}
            {!isCollapsed && userRoles.length > 1 && (
              <div style={{
                margin: "0 10px 8px",
                padding: "10px",
                background: C.sidebarCardBg,
                borderRadius: 10,
                border: `1px solid ${C.sidebarBorder}`,
                flexShrink: 0,
              }}>
                <div style={{
                  fontSize: 9.5, fontWeight: 700,
                  color: C.sidebarText3,
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
                        background: r === currentRole ? C.sidebarActiveBg : "transparent",
                        color: r === currentRole ? C.sidebarText1 : C.sidebarText3,
                        fontSize: 12, fontWeight: r === currentRole ? 700 : 500,
                        cursor: "pointer", fontFamily: "inherit",
                        textTransform: "capitalize", transition: "all 0.15s",
                      }}
                    >
                      <span style={{
                        width: 6, height: 6, borderRadius: "50%",
                        background: r === currentRole ? "var(--copper)" : "rgba(169,216,200,0.2)",
                        flexShrink: 0,
                        boxShadow: r === currentRole ? "0 0 6px var(--copper-glow)" : "none",
                      }} />
                      {r}
                      {r === currentRole && (
                        <i className="fa-solid fa-check" style={{ marginLeft: "auto", fontSize: 9, color: "#3A8F7A" }} />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* User card */}
            <div
              onClick={() => onSectionChange("profile")}
              title={isCollapsed ? `${userName} — Profile` : "Open Profile Settings"}
              style={{
                margin: "0 10px",
                padding: isCollapsed ? "9px 0" : "11px 12px",
                background: C.sidebarCardBg,
                cursor: "pointer", borderRadius: 12,
                display: "flex", alignItems: "center",
                justifyContent: isCollapsed ? "center" : "flex-start",
                gap: 10,
                border: `1px solid ${C.sidebarBorder}`,
                transition: "background 0.15s, padding 0.25s",
                overflow: "hidden", flexShrink: 0,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = C.sidebarHoverBg)}
              onMouseLeave={(e) => (e.currentTarget.style.background = C.sidebarCardBg)}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 9,
                background: meta.avatarGradient,
                color: "#EDE3D1", display: "flex", alignItems: "center", justifyContent: "center",
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
                      fontSize: 12, fontWeight: 700, color: C.sidebarText1,
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>
                      {userName}
                    </div>
                    <div style={{ fontSize: 10, color: C.sidebarText3, textTransform: "capitalize" }}>
                      {currentRole}
                    </div>
                  </div>
                  <i
                    className="fa-solid fa-right-from-bracket"
                    style={{ color: C.sidebarText3, fontSize: 13, cursor: "pointer", transition: "color 0.15s" }}
                    title="Sign Out"
                    onClick={(e) => {
                      e.stopPropagation();
                      signOut({ callbackUrl: "/" });
                    }}
                    onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = "var(--theme-danger-color)"}
                    onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = C.sidebarText3}
                  />
                </>
              )}
            </div>
          </div>{/* end sidebar content wrapper */}
        </aside>

        {/* Main */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Header */}
          <header style={{
            padding: "0 24px", height: 60,
            borderBottom: `1px solid ${C.border}`,
            background: C.headerBg,
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexShrink: 0,
            boxShadow: "0 2px 20px rgba(0,0,0,0.15)",
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
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(58,143,122,0.15)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "none";
                }}
              >
                <i className="fa-solid fa-bars" style={{ color: C.text2, fontSize: 13 }} />
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h1 style={{
                  fontSize: 16, fontWeight: 700,
                  fontFamily: "'Inter', sans-serif", color: C.text1, margin: 0,
                }}>
                  {sectionTitles[activeSection] ?? activeSection}
                </h1>
                <span style={{ color: "var(--theme-text3)", fontSize: 13 }}>/</span>
                <span style={{ fontSize: 12, color: C.text3, fontWeight: 500 }}>Overview</span>
              </div>
            </div>

            {/* Right: Actions */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ fontSize: 12, color: C.text3, display: "flex", alignItems: "center", gap: 5 }}>
                <i className="fa-regular fa-calendar" style={{ fontSize: 11, color: C.copper }} />
                {new Date().toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
              </div>

              <div style={{ width: 1, height: 20, background: C.border }} />

              <button onClick={toggleTheme} className="dash-theme-toggle" title={isDark ? "Light mode" : "Dark mode"}>
                {isDark
                  ? <i className="fa-solid fa-sun" style={{ color: "var(--copper)", fontSize: 13 }} />
                  : <i className="fa-solid fa-moon" style={{ color: "var(--theme-text2)", fontSize: 13 }} />}
              </button>

              <button style={{
                background: "none", border: `1px solid ${C.border}`, borderRadius: 10,
                width: 36, height: 36,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", position: "relative",
              }}>
                <i className="fa-regular fa-bell" style={{ color: C.text2, fontSize: 14 }} />
                <span style={{
                  position: "absolute", top: 8, right: 8, width: 5, height: 5,
                  borderRadius: "50%", background: "#C08A5A",
                  border: `1.5px solid ${C.headerBg}`,
                  boxShadow: "0 0 6px rgba(192,138,90,0.5)",
                }} />
              </button>

              <div
                style={{
                  width: 32, height: 32, borderRadius: 9,
                  background: meta.avatarGradient,
                  color: "#EDE3D1", display: "flex", alignItems: "center", justifyContent: "center",
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
            background: C.pageBg,
            color: C.text1,
          }}>
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
