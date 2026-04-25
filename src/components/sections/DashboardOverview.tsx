"use client";

import React from "react";
import { StatCard, CalendarStatCard, Badge, statusColor, statusBg } from "@/components/DashboardShared";
import {
  useDashboardStats,
  useTodaysAppointments,
  useAppointments,
  usePrescriptions,
  useUsers,
  useRoles,
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
  const { data: users, loading: usersLoading } = useUsers();
  const { data: roles, loading: rolesLoading } = useRoles();

  // Compute per-role user counts (only roles with members > 0)
  const roleCounts: { name: string; count: number; color: string }[] = React.useMemo(() => {
    if (!users) return [];
    const map: Record<string, number> = {};
    users.forEach(u => {
      const r = (u.role || "").toLowerCase();
      map[r] = (map[r] || 0) + 1;
    });
    return Object.entries(map)
      .filter(([, count]) => count > 0)
      .map(([name, count]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        count,
        color: name === "admin" ? "#C08A5A" : name === "staff" ? "#3A8F7A" : "#A9D8C8",
      }))
      .sort((a, b) => b.count - a.count);
  }, [users]);

  const activeRx = (prescriptions ?? []).filter((r) => r.status === "active");
  const completedCount = (appointments ?? []).filter((a) => a.status === "completed").length;

  // Unique patients with active prescriptions
  const activeRxPatients: string[] = React.useMemo(() => {
    const seen = new Set<string>();
    return activeRx
      .map(rx => rx.patient)
      .filter((name): name is string => !!name && !seen.has(name) && seen.add(name) !== undefined);
  }, [activeRx]);

  // Determine greeting
  const greeting = currentRole === "patient" ? `Welcome back, ${userName}` : `Good morning, ${userName}`;
  const subtitle = currentRole === "patient"
    ? `${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} — Your health summary`
    : currentRole === "admin"
      ? `${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} — All systems operational`
      : `${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} — ${currentRole.charAt(0).toUpperCase() + currentRole.slice(1)} Dashboard`;

  const statusLabel = currentRole === "admin" ? "All systems live" : currentRole === "staff" ? "On duty" : "Portal active";

  const scheduled = (appointments ?? []).filter((a) => a.status === "scheduled" || a.status === "confirmed" || a.status === "pending");
  const scheduledPct = (appointments && appointments.length > 0) ? Math.round((scheduled.length / appointments.length) * 100) : 0;

  // Build stats cards based on role/permissions
  const statCards: { iconClass: string; label: string; value: string | number; loading: boolean; isCircular?: boolean; pct?: number; totalValue?: number | string; sub?: string; hasCalendar?: boolean; }[] = [];

  if (currentRole === "admin") {
    statCards.push(
      { iconClass: "fa-solid fa-clock", label: "Scheduled Appointments", value: scheduled.length, totalValue: (appointments ?? []).length, pct: scheduledPct, isCircular: true, hasCalendar: true, loading: aptsLoading },
      { iconClass: "fa-solid fa-user-injured", label: "Total Patients", value: stats?.totalPatients ?? "—", loading: statsLoading, hasPatientsList: true },
      { iconClass: "fa-solid fa-user-nurse", label: "Staff Members", value: stats?.staffMembers ?? "—", loading: statsLoading, hasStaffBreakdown: true },
      { iconClass: "fa-solid fa-shield-halved", label: "Roles Defined", value: stats?.rolesCount ?? "—", loading: statsLoading },
    );
  } else if (currentRole === "staff") {
    statCards.push(
      { iconClass: "fa-solid fa-clock", label: "Scheduled Appointments", value: scheduled.length, totalValue: (appointments ?? []).length, pct: scheduledPct, isCircular: true, hasCalendar: true, loading: aptsLoading },
      { iconClass: "fa-solid fa-calendar-check", label: "Today's Appointments", value: (todayApts ?? []).length, loading: todayLoading },
      { iconClass: "fa-solid fa-clipboard-check", label: "Completed Today", value: (todayApts ?? []).filter((a) => a.status === "completed").length, loading: todayLoading },
    );
  } else {
    // patient or any custom role
    statCards.push(
      { iconClass: "fa-solid fa-calendar-check", label: "Scheduled Appointments", value: scheduled.length, totalValue: (appointments ?? []).length, pct: scheduledPct, isCircular: true, hasCalendar: true, loading: aptsLoading },
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

  // ── Prescription progress helpers ──────────────────────────────────────────
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const prescriptionBars = activeRx
    .filter((rx) => rx.dosageEndDate)
    .map((rx) => {
      const start = new Date(rx.date);
      const end   = new Date(rx.dosageEndDate as string);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      const total   = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));
      const elapsed = Math.max(0, Math.ceil((today.getTime() - start.getTime()) / 86400000));
      const pct     = Math.min(100, Math.round((elapsed / total) * 100));
      const left    = Math.max(0, total - elapsed);
      return { ...rx, pct, daysLeft: left, totalDays: total };
    })
    .sort((a, b) => b.pct - a.pct); // most-progressed first

  // Progress bar colour: green → amber → red
  function barColor(pct: number) {
    if (pct < 60) return "linear-gradient(90deg, #3A8F7A, #56b89e)";
    if (pct < 85) return "linear-gradient(90deg, #c9832a, #e0a847)";
    return "linear-gradient(90deg, #c94040, #e05c5c)";
  }

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

      {/* ── Stat Cards + Prescriptions Widget row ─────────────────────────── */}
      <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>

        {/* Stat cards column */}
        <div style={{ flex: "2 1 0", minWidth: 0 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14 }}>
            {statCards.map((s) =>
              s.hasCalendar ? (
                <CalendarStatCard key={s.label} {...s} appointments={appointments ?? []} />
              ) : (s as any).hasStaffBreakdown ? (
                <div key={s.label} style={{
                  background: "var(--theme-card-bg)",
                  border: "1px solid var(--theme-card-border)",
                  borderRadius: 18,
                  padding: "20px 22px",
                  display: "flex", flexDirection: "column", gap: 12,
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  boxShadow: "var(--theme-card-shadow)",
                  position: "relative", overflow: "hidden",
                }}>
                  {/* Glow */}
                  <div style={{ position: "absolute", top: -30, right: -30, width: 80, height: 80, borderRadius: "50%", background: "rgba(58,143,122,0.15)", filter: "blur(20px)", pointerEvents: "none" }} />

                  {/* Header: icon + label on top row */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 11, background: "linear-gradient(135deg, #3A8F7A, #144E42)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 12px rgba(58,143,122,0.3)" }}>
                      <i className="fa-solid fa-user-nurse" style={{ color: "#EDE3D1", fontSize: 15 }} />
                    </div>
                    <div style={{ fontSize: 12, color: "var(--theme-text2)", fontWeight: 500 }}>{s.label}</div>
                  </div>

                  {/* Count below heading */}
                  {s.loading ? (
                    <div style={{ height: 30, width: 50, borderRadius: 6, background: "var(--theme-border-soft)", animation: "shimmer 1.4s infinite" }} />
                  ) : (
                    <div style={{ fontSize: 30, fontWeight: 700, color: "var(--theme-text1)", lineHeight: 1, letterSpacing: "-0.5px" }}>{s.value}</div>
                  )}

                  {/* Role breakdown */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {(usersLoading ? [] : roleCounts).map(({ name, count, color }) => (
                      <div key={name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0, boxShadow: `0 0 5px ${color}88` }} />
                        <div style={{ flex: 1, height: 5, borderRadius: 99, background: "var(--theme-border-soft)", overflow: "hidden" }}>
                          <div style={{
                            height: "100%", borderRadius: 99,
                            width: `${Math.round((count / (s.value as number || 1)) * 100)}%`,
                            background: `linear-gradient(90deg, ${color}cc, ${color})`,
                            transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
                          }} />
                        </div>
                        <div style={{ fontSize: 11, color: "var(--theme-text2)", fontWeight: 600, minWidth: 18, textAlign: "right" }}>{count}</div>
                        <div style={{ fontSize: 10, color: "var(--theme-text3)", minWidth: 36 }}>{name}</div>
                      </div>
                    ))}
                    {usersLoading && (
                      <div style={{ height: 12, borderRadius: 6, background: "var(--theme-border-soft)", animation: "shimmer 1.4s infinite" }} />
                    )}
                  </div>
                </div>
              ) : (s as any).hasPatientsList ? (
                <div key={s.label} style={{
                  background: "var(--theme-card-bg)",
                  border: "1px solid var(--theme-card-border)",
                  borderRadius: 18,
                  padding: "20px 22px",
                  display: "flex", flexDirection: "column", gap: 12,
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  boxShadow: "var(--theme-card-shadow)",
                  position: "relative", overflow: "hidden",
                }}>
                  {/* Glow */}
                  <div style={{ position: "absolute", top: -30, right: -30, width: 80, height: 80, borderRadius: "50%", background: "rgba(58,143,122,0.15)", filter: "blur(20px)", pointerEvents: "none" }} />

                  {/* Icon + label */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 11, background: "linear-gradient(135deg, #3A8F7A, #144E42)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 12px rgba(58,143,122,0.3)" }}>
                      <i className="fa-solid fa-user-injured" style={{ color: "#EDE3D1", fontSize: 15 }} />
                    </div>
                    <div style={{ fontSize: 12, color: "var(--theme-text2)", fontWeight: 500 }}>{s.label}</div>
                  </div>

                  {/* Total count */}
                  {s.loading ? (
                    <div style={{ height: 30, width: 50, borderRadius: 6, background: "var(--theme-border-soft)", animation: "shimmer 1.4s infinite" }} />
                  ) : (
                    <div style={{ fontSize: 30, fontWeight: 700, color: "var(--theme-text1)", lineHeight: 1, letterSpacing: "-0.5px" }}>{s.value}</div>
                  )}

                  {/* Active Rx patient list */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: "var(--theme-text3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                      Active Prescriptions
                    </div>
                    {rxLoading ? (
                      <>
                        <div style={{ height: 10, borderRadius: 4, background: "var(--theme-border-soft)", animation: "shimmer 1.4s infinite", marginBottom: 4 }} />
                        <div style={{ height: 10, width: "70%", borderRadius: 4, background: "var(--theme-border-soft)", animation: "shimmer 1.4s infinite" }} />
                      </>
                    ) : activeRxPatients.length === 0 ? (
                      <div style={{ fontSize: 11, color: "var(--theme-text3)", fontStyle: "italic" }}>No active prescriptions</div>
                    ) : (
                      <div style={{ maxHeight: 90, overflowY: "auto" }}>
                        {activeRxPatients.map((name, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, padding: "3px 0", borderBottom: i < activeRxPatients.length - 1 ? "1px solid var(--theme-border-soft)" : "none" }}>
                            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--sage)", flexShrink: 0 }} />
                            <span style={{ fontSize: 11, color: "var(--theme-text2)", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div key={s.label} style={{ alignSelf: "start" }}>
                  <StatCard {...s} />
                </div>
              )
            )}
          </div>
        </div>

        {/* Prescriptions widget */}
        {hasPerm("view_prescriptions") && (
          <div style={{ flex: "1 1 260px", minWidth: 220, maxWidth: 340, display: "flex", flexDirection: "column" }}>
            {/* Widget header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 6,
                  background: "linear-gradient(135deg, #3A8F7A, #144E42)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(58,143,122,0.35)",
                }}>
                  <i className="fa-solid fa-pills" style={{ color: "#EDE3D1", fontSize: 9 }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--theme-text3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  Ongoing Rx
                </span>
              </div>
              <button
                onClick={() => setSection("prescriptions")}
                style={{ fontSize: 11, color: "var(--copper)", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4, transition: "color 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.color = "var(--copper-light)"}
                onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.color = "var(--copper)"}
              >
                All <i className="fa-solid fa-arrow-right" style={{ fontSize: 9 }} />
              </button>
            </div>

            {/* Widget body */}
            <div style={{
              flex: 1,
              background: "var(--theme-card-bg)",
              border: "1px solid var(--theme-border-soft)",
              borderRadius: 16,
              boxShadow: "var(--theme-card-shadow)",
              backdropFilter: "blur(8px)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}>
              {rxLoading ? (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--theme-text3)", fontSize: 12, gap: 8 }}>
                  <i className="fa-solid fa-circle-notch fa-spin" style={{ color: "var(--sage)" }} /> Loading…
                </div>
              ) : prescriptionBars.length === 0 ? (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--theme-text3)", fontSize: 13, padding: 24 }}>
                  <i className="fa-solid fa-capsules" style={{ fontSize: 22, marginBottom: 8, opacity: 0.35 }} />
                  No active prescriptions
                </div>
              ) : (
                <div>
                  {prescriptionBars.slice(0, 3).map((rx, i) => (
                    <div
                      key={rx.id}
                      style={{
                        padding: "11px 14px",
                        borderBottom: "1px solid var(--theme-border-soft)",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget as HTMLDivElement).style.background = "var(--theme-table-hover-bg)"}
                      onMouseLeave={(e) => (e.currentTarget as HTMLDivElement).style.background = "transparent"}
                    >
                      {/* Patient name + % badge */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5, gap: 8 }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 12, color: "var(--theme-text1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {rx.patient}
                          </div>
                          <div style={{ fontSize: 10, color: "var(--theme-text3)", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {rx.medication}{rx.dosage ? ` · ${rx.dosage}` : ""}
                          </div>
                        </div>
                        <span style={{
                          fontSize: 10, fontWeight: 700, flexShrink: 0,
                          color: rx.pct >= 85 ? "#e05c5c" : rx.pct >= 60 ? "#e0a847" : "#56b89e",
                          background: rx.pct >= 85 ? "rgba(192,64,64,0.12)" : rx.pct >= 60 ? "rgba(192,140,40,0.12)" : "rgba(58,143,122,0.12)",
                          border: `1px solid ${rx.pct >= 85 ? "rgba(192,64,64,0.25)" : rx.pct >= 60 ? "rgba(192,140,40,0.25)" : "rgba(58,143,122,0.25)"}`,
                          borderRadius: 5, padding: "1px 5px",
                        }}>
                          {rx.pct}%
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div style={{ height: 4, borderRadius: 99, background: "var(--theme-border-soft)", overflow: "hidden", position: "relative" }}>
                        <div style={{
                          position: "absolute", left: 0, top: 0, height: "100%",
                          width: `${rx.pct}%`,
                          background: barColor(rx.pct),
                          borderRadius: 99,
                          transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
                          boxShadow: rx.pct >= 85 ? "0 0 5px rgba(200,64,64,0.5)" : "0 0 5px rgba(58,143,122,0.45)",
                        }} />
                      </div>
                      {/* Day counter */}
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 10, color: "var(--theme-text3)" }}>
                        <span>Day {Math.min(rx.totalDays - rx.daysLeft, rx.totalDays)}/{rx.totalDays}</span>
                        <span style={{ color: rx.daysLeft === 0 ? "#e05c5c" : "inherit" }}>
                          {rx.daysLeft === 0 ? "Ends today" : `${rx.daysLeft}d left`}
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* "View more" footer — only when >3 exist */}
                  {prescriptionBars.length > 3 && (
                    <button
                      onClick={() => setSection("prescriptions")}
                      style={{
                        width: "100%", padding: "10px 14px",
                        background: "var(--theme-filter-active-bg)",
                        border: "none", borderTop: "1px solid var(--theme-border-soft)",
                        color: "var(--theme-text3)", fontSize: 11, fontWeight: 600,
                        cursor: "pointer", fontFamily: "inherit",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        transition: "color 0.15s, background 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.color = "var(--copper)";
                        (e.currentTarget as HTMLButtonElement).style.background = "var(--theme-table-hover-bg)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.color = "var(--theme-text3)";
                        (e.currentTarget as HTMLButtonElement).style.background = "var(--theme-filter-active-bg)";
                      }}
                    >
                      <i className="fa-solid fa-ellipsis" style={{ fontSize: 10 }} />
                      View {prescriptionBars.length - 3} more
                      <i className="fa-solid fa-arrow-right" style={{ fontSize: 9 }} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
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

      {/* Appointments preview — full width */}
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
                <i className="fa-solid fa-calendar-xmark" style={{ fontSize: 24, display: "block", marginBottom: 8, opacity: 0.5 }} />
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
