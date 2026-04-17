"use client";

import { StatCard, Badge, statusColor, statusBg } from "@/components/DashboardShared";
import {
  useDashboardStats,
  useTodaysAppointments,
  useAppointments,
  usePrescriptions,
} from "@/hooks/useAdminData";
import type { Appointment, Prescription } from "@/hooks/types";

// ─── Dashboard Overview Section ───────────────────────────────────────────────
// Adapts its content based on the current role and permissions.

export default function DashboardOverview({
  setSection,
  userName,
  currentRole,
  permissions,
}: {
  setSection: (s: string) => void;
  userName: string;
  currentRole: string;
  permissions: string[];
}) {
  const hasPerm = (p: string) => permissions.includes(p);

  // Always fetch appointments & prescriptions for stat counts
  const { data: appointments, loading: aptsLoading } = useAppointments();
  const { data: prescriptions, loading: rxLoading } = usePrescriptions();
  const { data: todayApts, loading: todayLoading, error: todayError } = useTodaysAppointments();
  const { data: stats, loading: statsLoading } = useDashboardStats();

  const upcoming = (appointments ?? []).filter((a) => a.status === "confirmed" || a.status === "pending");
  const activeRx = (prescriptions ?? []).filter((r) => r.status === "active");
  const completedCount = (appointments ?? []).filter((a) => a.status === "completed").length;

  // Determine greeting
  const greeting = currentRole === "patient" ? `Welcome back, ${userName}` : `Good morning, ${userName}`;
  const subtitle = currentRole === "patient"
    ? `${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} — Your health summary`
    : currentRole === "admin"
      ? `${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} — All systems operational`
      : `${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} — ${currentRole.charAt(0).toUpperCase() + currentRole.slice(1)} Dashboard`;

  const statusLabel = currentRole === "admin" ? "All systems live" : currentRole === "staff" ? "On duty" : "Portal active";

  // Build stats cards based on role/permissions
  const statCards: { iconClass: string; label: string; value: string | number; loading: boolean }[] = [];

  if (currentRole === "admin") {
    statCards.push(
      { iconClass: "fa-solid fa-user-injured", label: "Total Patients", value: stats?.totalPatients ?? "—", loading: statsLoading },
      { iconClass: "fa-solid fa-user-nurse", label: "Staff Members", value: stats?.staffMembers ?? "—", loading: statsLoading },
      { iconClass: "fa-solid fa-calendar-check", label: "Appointments Today", value: stats?.appointmentsToday ?? "—", loading: statsLoading },
      { iconClass: "fa-solid fa-pills", label: "Active Prescriptions", value: stats?.activePrescriptions ?? "—", loading: statsLoading },
      { iconClass: "fa-solid fa-shield-halved", label: "Roles Defined", value: stats?.rolesCount ?? "—", loading: statsLoading },
    );
  } else if (currentRole === "staff") {
    statCards.push(
      { iconClass: "fa-solid fa-calendar-check", label: "Today's Appointments", value: (todayApts ?? []).length, loading: todayLoading },
      { iconClass: "fa-solid fa-clock", label: "Upcoming Appointments", value: upcoming.length, loading: aptsLoading },
      { iconClass: "fa-solid fa-pills", label: "Active Prescriptions", value: activeRx.length, loading: rxLoading },
      { iconClass: "fa-solid fa-clipboard-check", label: "Completed Today", value: (todayApts ?? []).filter((a) => a.status === "completed").length, loading: todayLoading },
    );
  } else {
    // patient or any custom role
    statCards.push(
      { iconClass: "fa-solid fa-calendar-check", label: "Upcoming Appointments", value: upcoming.length, loading: aptsLoading },
      { iconClass: "fa-solid fa-pills", label: "Active Prescriptions", value: activeRx.length, loading: rxLoading },
      { iconClass: "fa-solid fa-clipboard-check", label: "Completed Visits", value: completedCount, loading: aptsLoading },
    );
  }

  // Build quick actions — only show actions the user has permission for
  const quickActions: { label: string; icon: string; section: string }[] = [];

  if (hasPerm("view_patients"))       quickActions.push({ label: currentRole === "patient" ? "My Profile" : "View Patients", icon: "fa-solid fa-user-injured", section: currentRole === "patient" ? "profile" : "patients" });
  if (hasPerm("manage_staff"))        quickActions.push({ label: "Staff & Users", icon: "fa-solid fa-user-nurse", section: "staff" });
  if (hasPerm("view_appointments"))   quickActions.push({ label: currentRole === "patient" ? "View Appointments" : "Appointments", icon: "fa-solid fa-calendar-days", section: "appointments" });
  if (hasPerm("create_appointments")) quickActions.push({ label: "New Appointment", icon: "fa-solid fa-calendar-plus", section: "appointments" });
  if (hasPerm("view_prescriptions"))  quickActions.push({ label: currentRole === "patient" ? "View Prescriptions" : "Prescriptions", icon: "fa-solid fa-file-prescription", section: "prescriptions" });
  if (hasPerm("write_prescriptions")) quickActions.push({ label: "Write Prescription", icon: "fa-solid fa-prescription", section: "prescriptions" });
  if (hasPerm("manage_inventory"))    quickActions.push({ label: "Inventory", icon: "fa-solid fa-boxes-stacked", section: "inventory" });
  if (hasPerm("manage_roles"))        quickActions.push({ label: "Manage Roles", icon: "fa-solid fa-shield-halved", section: "access" });
  if (hasPerm("view_audit_logs"))     quickActions.push({ label: "Audit Logs", icon: "fa-solid fa-clock-rotate-left", section: "audit" });

  // Fallback — always show at least profile
  if (quickActions.length === 0) {
    quickActions.push({ label: "My Profile", icon: "fa-solid fa-user", section: "profile" });
  }

  // Determine which appointments to show in the preview
  const previewApts: Appointment[] = currentRole === "patient"
    ? upcoming.slice(0, 4)
    : (todayApts ?? []).slice(0, 5);
  const previewLoading = currentRole === "patient" ? aptsLoading : todayLoading;
  const previewLabel = currentRole === "patient" ? "Upcoming Appointments" : "Today's Appointments";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {/* Greeting */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: "#EDE3D1", margin: 0, fontFamily: "'Inter', sans-serif", letterSpacing: "-0.3px" }}>
            {greeting}
          </h2>
          <p style={{ color: "#A9D8C8", margin: "4px 0 0", fontSize: 14, opacity: 0.7 }}>{subtitle}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(20,78,66,0.5)", border: "1px solid rgba(169,216,200,0.1)", borderRadius: 10, padding: "8px 14px" }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#3A8F7A", display: "inline-block", boxShadow: "0 0 8px rgba(58,143,122,0.5)" }} />
          <span style={{ fontSize: 12, color: "#A9D8C8", fontWeight: 600 }}>{statusLabel}</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 16 }}>
        {statCards.map((s) => (
          <StatCard key={s.label} iconClass={s.iconClass} label={s.label} value={s.value} loading={s.loading} />
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--theme-text3)", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.1em" }}>Quick Actions</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {quickActions.map((a) => (
            <button
              key={a.label}
              onClick={() => setSection(a.section)}
              style={{
                background: "var(--theme-card-bg)", border: "1px solid var(--theme-border)", borderRadius: 12,
                padding: "12px 18px", color: "var(--theme-text2)", fontSize: 13,
                cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
                fontWeight: 600, fontFamily: "inherit", transition: "all 0.2s",
                boxShadow: "var(--theme-card-shadow)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--sage)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--theme-filter-active-color)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "var(--theme-card-shadow)";
                (e.currentTarget as HTMLButtonElement).style.background = "var(--theme-filter-active-bg)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--theme-border)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--theme-text2)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "var(--theme-card-shadow)";
                (e.currentTarget as HTMLButtonElement).style.background = "var(--theme-card-bg)";
              }}
            >
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #3A8F7A, #144E42)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 8px rgba(58,143,122,0.3)" }}>
                <i className={a.icon} style={{ fontSize: 12, color: "#EDE3D1" }} />
              </div>
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Appointments Preview */}
      {hasPerm("view_appointments") && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--theme-text3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{previewLabel}</div>
            <button
              onClick={() => setSection("appointments")}
              style={{ fontSize: 12, color: "var(--copper)", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5, transition: "color 0.15s" }}
              onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.color = "var(--copper-light)"}
              onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.color = "var(--copper)"}
            >
              View all <i className="fa-solid fa-arrow-right" style={{ fontSize: 10 }} />
            </button>
          </div>
          <div style={{ background: "var(--theme-card-bg)", border: "1px solid var(--theme-border-soft)", borderRadius: 16, overflow: "hidden", boxShadow: "var(--theme-card-shadow)", backdropFilter: "blur(8px)" }}>
            {previewLoading ? (
              <div style={{ padding: 24, color: "var(--theme-text2)", fontSize: 13, textAlign: "center" }}>
                <i className="fa-solid fa-circle-notch fa-spin" style={{ marginRight: 8, color: "var(--sage)" }} />Loading appointments…
              </div>
            ) : previewApts.length === 0 ? (
              <div style={{ padding: 32, color: "var(--theme-text3)", fontSize: 14, textAlign: "center" }}>
                <i className="fa-solid fa-calendar-xmark" style={{ fontSize: 24, display: "block", marginBottom: 8, color: "var(--theme-text3)", opacity: 0.5 }} />
                No {currentRole === "patient" ? "upcoming" : "today's"} appointments
              </div>
            ) : (
              previewApts.map((apt, i) => (
                <div
                  key={apt.id}
                  style={{
                    padding: "16px 20px", display: "flex", alignItems: "center", gap: 16,
                    borderBottom: i < previewApts.length - 1 ? "1px solid var(--theme-border-soft)" : "none",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLDivElement).style.background = "var(--theme-table-hover-bg)"}
                  onMouseLeave={(e) => (e.currentTarget as HTMLDivElement).style.background = "transparent"}
                >
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg, #3A8F7A, #144E42)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 10px rgba(58,143,122,0.2)" }}>
                    <i className="fa-solid fa-clipboard-list" style={{ color: "#EDE3D1", fontSize: 14 }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "var(--theme-text1)" }}>{currentRole === "patient" ? apt.doctor : apt.patient}</div>
                    <div style={{ fontSize: 12, color: "var(--theme-text3)", marginTop: 2 }}>
                      {currentRole === "patient" ? `${apt.type} · ${apt.date}` : `${apt.doctor ?? ""} · ${apt.type}`}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--theme-text1)" }}>{apt.time}</div>
                    <Badge label={apt.status} color={statusColor[apt.status]} bg={statusBg[apt.status]} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
