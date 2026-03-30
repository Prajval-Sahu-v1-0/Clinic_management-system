"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/hooks/useTheme";
import {
  useDashboardStats,
  useUsers,
  usePatients,
  useAppointments,
  useTodaysAppointments,
  usePrescriptions,
  useRoles,
} from "@/hooks/useAdminData";
import type { User, Appointment, Prescription, Role, DashboardStats } from "@/hooks/types";

const getPermissions = (session: any) => {
  if (!session?.user) return [];
  return Array.isArray(session.user.permissions) ? session.user.permissions : [];
};

// ─── Types ────────────────────────────────────────────────────────────────────

type Section =
  | "dashboard"
  | "patients"
  | "staff"
  | "appointments"
  | "access"
  | "prescriptions"
  | "profile";

// ─── Constants ─────────────────────────────────────────────────────────────────

const ALL_PERMISSIONS = [
  "View Patients", "Edit Patients", "Delete Patients",
  "View Appointments", "Create Appointments", "Cancel Appointments",
  "View Prescriptions", "Write Prescriptions",
  "Manage Staff", "Manage Roles",
  "View Reports", "Export Data",
  "System Settings",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const statusColor: Record<string, string> = {
  active: "#0d9488", inactive: "#9ca3af", pending: "#d97706",
  confirmed: "#2563eb", completed: "#0d9488", cancelled: "#dc2626",
  expired: "#9ca3af", refill: "#d97706",
};

const statusBg: Record<string, string> = {
  active: "#f0fdfa", inactive: "#f9fafb", pending: "#fffbeb",
  confirmed: "#eff6ff", completed: "#f0fdfa", cancelled: "#fef2f2",
  expired: "#f9fafb", refill: "#fffbeb",
};

const roleColor: Record<string, string> = {
  admin: "#0d9488", staff: "#0d9488", patient: "#2563eb",
};

// ─── Loading / Error States ───────────────────────────────────────────────────

function LoadingRows({ cols }: { cols: number }) {
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

function ErrorMessage({ message }: { message: string }) {
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

// ─── Sub-Components ───────────────────────────────────────────────────────────

function StatCard({
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

function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
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

function ActionButton({
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

// ─── Section: Dashboard Overview ──────────────────────────────────────────────

function DashboardOverview({ setSection }: { setSection: (s: Section) => void }) {
  const { data: stats, loading: statsLoading } = useDashboardStats();
  const { data: todayApts, loading: aptsLoading, error: aptsError } = useTodaysAppointments();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: 0, fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.3px" }}>
            Good morning, Admin
          </h2>
          <p style={{ color: "#9ca3af", margin: "4px 0 0", fontSize: 14 }}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} — All systems operational
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f0fdfa", border: "1px solid #ccfbf1", borderRadius: 8, padding: "8px 14px" }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#0d9488", display: "inline-block", boxShadow: "0 0 0 3px rgba(22,163,74,0.2)" }} />
          <span style={{ fontSize: 12, color: "#0f766e", fontWeight: 600 }}>All systems live</span>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
        <StatCard iconClass="fa-solid fa-user-injured" label="Total Patients" value={stats?.totalPatients ?? "—"} loading={statsLoading} />
        <StatCard iconClass="fa-solid fa-user-nurse" label="Staff Members" value={stats?.staffMembers ?? "—"} loading={statsLoading} />
        <StatCard iconClass="fa-solid fa-calendar-check" label="Appointments Today" value={stats?.appointmentsToday ?? "—"} loading={statsLoading} />
        <StatCard iconClass="fa-solid fa-pills" label="Active Prescriptions" value={stats?.activePrescriptions ?? "—"} loading={statsLoading} />
        <StatCard iconClass="fa-solid fa-shield-halved" label="Roles Defined" value={stats?.rolesCount ?? "—"} loading={statsLoading} />
      </div>

      {/* Quick Actions */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.1em" }}>Quick Actions</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {[
            { label: "Add Patient", icon: "fa-solid fa-user-plus", section: "patients" as Section },
            { label: "New Appointment", icon: "fa-solid fa-calendar-plus", section: "appointments" as Section },
            { label: "Write Prescription", icon: "fa-solid fa-file-prescription", section: "prescriptions" as Section },
            { label: "Manage Roles", icon: "fa-solid fa-key", section: "access" as Section },
          ].map((a) => (
            <button
              key={a.label}
              onClick={() => setSection(a.section)}
              style={{
                background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10,
                padding: "12px 18px", color: "#374151", fontSize: 13,
                cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
                fontWeight: 600, fontFamily: "inherit", transition: "all 0.15s",
                boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#0d9488";
                (e.currentTarget as HTMLButtonElement).style.color = "#0d9488";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#e5e7eb";
                (e.currentTarget as HTMLButtonElement).style.color = "#374151";
              }}
            >
              <i className={a.icon} style={{ fontSize: 14, color: "#0d9488" }} />
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Today's Appointments */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em" }}>Today's Appointments</div>
          <button
            onClick={() => setSection("appointments")}
            style={{ fontSize: 12, color: "#0d9488", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5 }}
          >
            View all <i className="fa-solid fa-arrow-right" style={{ fontSize: 10 }} />
          </button>
        </div>

        {aptsError && <ErrorMessage message={aptsError} />}

        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          {aptsLoading ? (
            <div style={{ padding: 24, color: "#9ca3af", fontSize: 13, textAlign: "center" }}>
              <i className="fa-solid fa-circle-notch fa-spin" style={{ marginRight: 8 }} />
              Loading appointments…
            </div>
          ) : (todayApts ?? []).length === 0 ? (
            <div style={{ padding: 32, color: "#9ca3af", fontSize: 14, textAlign: "center" }}>
              <i className="fa-solid fa-calendar-xmark" style={{ fontSize: 24, display: "block", marginBottom: 8 }} />
              No appointments today
            </div>
          ) : (
            (todayApts ?? []).slice(0, 4).map((apt, i) => (
              <div
                key={apt.id}
                style={{
                  padding: "16px 20px", display: "flex", alignItems: "center", gap: 16,
                  borderBottom: i < Math.min((todayApts ?? []).length, 4) - 1 ? "1px solid #f3f4f6" : "none",
                }}
                onMouseEnter={(e) => (e.currentTarget as HTMLDivElement).style.background = "#f9fafb"}
                onMouseLeave={(e) => (e.currentTarget as HTMLDivElement).style.background = "transparent"}
              >
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "#f0fdfa", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <i className="fa-solid fa-clipboard-list" style={{ color: "#0d9488", fontSize: 16 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>{apt.patient}</div>
                  <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{apt.doctor} · {apt.type}</div>
                </div>
                <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>{apt.time}</div>
                  <Badge label={apt.status} color={statusColor[apt.status]} bg={statusBg[apt.status]} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Section: Users Table ──────────────────────────────────────────────────────

function UsersTable({ filterRole }: { filterRole?: "patient" | "staff" | "admin" }) {
  const [search, setSearch] = useState("");
  const patientsHook = usePatients();
  const usersHook = useUsers();

  // Edit modal state
  const [editUser, setEditUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  const hook = filterRole === "patient" ? patientsHook : usersHook;
  const { data: allUsers, loading, error } = hook;

  const filtered = (allUsers ?? []).filter((u) =>
    (!filterRole || u.role === filterRole) &&
    (u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()))
  );

  const openEdit = (u: User) => {
    setEditUser(u);
    setNewPassword("");
    setConfirmPassword("");
    setPwError("");
    setPwSuccess("");
  };

  const closeEdit = () => {
    setEditUser(null);
    setNewPassword("");
    setConfirmPassword("");
    setPwError("");
    setPwSuccess("");
  };

  const handleChangePassword = async () => {
    setPwError("");
    setPwSuccess("");
    if (!newPassword) { setPwError("Please enter a new password."); return; }
    if (newPassword.length < 6) { setPwError("Password must be at least 6 characters."); return; }
    if (newPassword !== confirmPassword) { setPwError("Passwords do not match."); return; }
    if (!editUser) return;

    setPwSaving(true);
    try {
      await (usersHook as any).resetPassword(editUser.id, newPassword);
      setPwSuccess(`Password updated successfully for ${editUser.name}.`);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPwError(err?.message || "Failed to update password.");
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 360 }}>
          <i className="fa-solid fa-magnifying-glass" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: 13 }} />
          <input
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: "#fff", border: "1px solid #e5e7eb", borderRadius: 9,
              padding: "9px 14px 9px 36px", color: "#111827", fontSize: 14,
              outline: "none", width: "100%", boxSizing: "border-box",
              fontFamily: "inherit", boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            }}
          />
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #f3f4f6", background: "#f9fafb" }}>
              {["User", "Email", "Role", "Status", "Joined", "Actions"].map((h) => (
                <th key={h} style={{ padding: "11px 18px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <LoadingRows cols={6} />
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: "32px 18px", textAlign: "center", color: "#9ca3af", fontSize: 14 }}>
                  No users found
                </td>
              </tr>
            ) : (
              filtered.map((u, idx) => (
                <tr
                  key={u.id}
                  style={{ borderBottom: idx < filtered.length - 1 ? "1px solid #f3f4f6" : "none", transition: "background 0.1s" }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLTableRowElement).style.background = "#f9fafb"}
                  onMouseLeave={(e) => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}
                >
                  <td style={{ padding: "14px 18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 9,
                        background: roleColor[u.role] + "18",
                        color: roleColor[u.role],
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 700,
                        border: `1px solid ${roleColor[u.role]}33`,
                      }}>{u.avatar}</div>
                      <span style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: "14px 18px", fontSize: 13, color: "#6b7280" }}>{u.email}</td>
                  <td style={{ padding: "14px 18px" }}>
                    <Badge label={u.role} color={roleColor[u.role]} bg={roleColor[u.role] + "18"} />
                  </td>
                  <td style={{ padding: "14px 18px" }}>
                    <Badge label={u.status} color={statusColor[u.status]} bg={statusBg[u.status]} />
                  </td>
                  <td style={{ padding: "14px 18px", fontSize: 13, color: "#9ca3af" }}>{u.joined}</td>
                  <td style={{ padding: "14px 18px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <ActionButton onClick={() => openEdit(u)}>
                        <i className="fa-solid fa-pen-to-square" style={{ fontSize: 11 }} /> Edit
                      </ActionButton>
                      <ActionButton
                        variant="danger"
                        onClick={() => {
                          if (filterRole === "patient") {
                            (patientsHook as any).deactivate?.(u.id);
                          } else {
                            (usersHook as any).deactivate?.(u.id);
                          }
                        }}
                        disabled={u.status === "inactive"}
                      >
                        <i className="fa-solid fa-ban" style={{ fontSize: 11 }} />
                        {u.status === "inactive" ? "Inactive" : "Deactivate"}
                      </ActionButton>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Edit User Modal ── */}
      {editUser && (
        <div
          onClick={closeEdit}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1000, backdropFilter: "blur(3px)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff", borderRadius: 16, width: 420, maxWidth: "92vw",
              boxShadow: "0 20px 60px rgba(0,0,0,0.15)", overflow: "hidden",
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: "20px 24px 16px", borderBottom: "1px solid #f3f4f6",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: roleColor[editUser.role] + "18",
                  color: roleColor[editUser.role],
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, fontWeight: 700,
                  border: `1px solid ${roleColor[editUser.role]}33`,
                }}>{editUser.avatar}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: "#111827", fontFamily: "'Outfit', sans-serif" }}>
                    {editUser.name}
                  </div>
                  <div style={{ fontSize: 12, color: "#9ca3af" }}>{editUser.email}</div>
                </div>
              </div>
              <button
                onClick={closeEdit}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  width: 30, height: 30, borderRadius: 8, display: "flex",
                  alignItems: "center", justifyContent: "center",
                }}
                onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.background = "#f3f4f6"}
                onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.background = "transparent"}
              >
                <i className="fa-solid fa-xmark" style={{ color: "#9ca3af", fontSize: 16 }} />
              </button>
            </div>

            {/* Modal Body — Change Password */}
            <div style={{ padding: "20px 24px" }}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase",
                letterSpacing: "0.1em", marginBottom: 14, display: "flex", alignItems: "center", gap: 7,
              }}>
                <i className="fa-solid fa-key" style={{ color: "#0d9488", fontSize: 12 }} />
                Change Password
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>
                    New Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter new password (min 6 chars)"
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setPwError(""); setPwSuccess(""); }}
                    style={{
                      width: "100%", background: "#fff", border: "1px solid #e5e7eb",
                      borderRadius: 9, padding: "10px 14px", fontSize: 13,
                      outline: "none", fontFamily: "inherit", boxSizing: "border-box",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setPwError(""); setPwSuccess(""); }}
                    style={{
                      width: "100%", background: "#fff", border: "1px solid #e5e7eb",
                      borderRadius: 9, padding: "10px 14px", fontSize: 13,
                      outline: "none", fontFamily: "inherit", boxSizing: "border-box",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                    }}
                  />
                </div>
              </div>

              {pwError && (
                <div style={{
                  marginTop: 12, padding: "10px 14px", background: "#fef2f2",
                  border: "1px solid #fee2e2", borderRadius: 8, color: "#dc2626",
                  fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 8,
                }}>
                  <i className="fa-solid fa-circle-exclamation" style={{ fontSize: 13 }} />
                  {pwError}
                </div>
              )}
              {pwSuccess && (
                <div style={{
                  marginTop: 12, padding: "10px 14px", background: "#f0fdfa",
                  border: "1px solid #ccfbf1", borderRadius: 8, color: "#0d9488",
                  fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 8,
                }}>
                  <i className="fa-solid fa-circle-check" style={{ fontSize: 13 }} />
                  {pwSuccess}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: "14px 24px", borderTop: "1px solid #f3f4f6",
              display: "flex", justifyContent: "flex-end", gap: 10, background: "#f9fafb",
            }}>
              <ActionButton onClick={closeEdit}>Cancel</ActionButton>
              <ActionButton variant="primary" onClick={handleChangePassword} disabled={pwSaving}>
                {pwSaving
                  ? <><i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: 11 }} /> Saving…</>
                  : <><i className="fa-solid fa-floppy-disk" style={{ fontSize: 11 }} /> Update Password</>
                }
              </ActionButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Section: Appointments ─────────────────────────────────────────────────────

function AppointmentsSection() {
  const [filter, setFilter] = useState<string>("all");
  const { data: appointments, loading, error, cancel, addAppointment } = useAppointments();
  
  const { data: users } = useUsers();
  const { data: patients } = usePatients();
  const activeStaff = (users ?? []).filter(u => u.status === "active" && (u.role === "staff" || u.role === "admin"));
  const activePatients = (patients ?? []).filter(p => p.status === "active");

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ patientId: "", staffId: "", date: "", time: "", type: "Checkup" });
  const [saving, setSaving] = useState(false);
  const [modalErr, setModalErr] = useState("");

  const handleSubmit = async () => {
    setModalErr("");
    if (!formData.patientId || !formData.staffId || !formData.date || !formData.time || !formData.type) {
        setModalErr("All fields are required.");
        return;
    }
    const dateTime = `${formData.date}T${formData.time}:00`;
    setSaving(true);
    try {
        await addAppointment(formData.patientId, formData.staffId, dateTime, formData.type);
        setShowModal(false);
        setFormData({ patientId: "", staffId: "", date: "", time: "", type: "Checkup" });
    } catch (e: any) {
        setModalErr(e.message || "Failed to create appointment");
    } finally {
        setSaving(false);
    }
  };

  const statuses = ["all", "confirmed", "pending", "completed", "cancelled"];

  const filtered = (appointments ?? []).filter(
    (a) => filter === "all" || a.status === filter
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 4, background: "#f3f4f6", borderRadius: 10, padding: 4 }}>
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={{
                background: filter === s ? "#fff" : "transparent",
                border: "none", borderRadius: 7, padding: "6px 14px",
                color: filter === s ? "#111827" : "#6b7280",
                fontSize: 12, fontWeight: filter === s ? 700 : 500,
                cursor: "pointer", textTransform: "capitalize", fontFamily: "inherit",
                boxShadow: filter === s ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                transition: "all 0.15s",
              }}
            >{s}</button>
          ))}
        </div>
        <div style={{ marginLeft: "auto" }}>
          <ActionButton variant="primary" onClick={() => setShowModal(true)}>
            <i className="fa-solid fa-calendar-plus" style={{ fontSize: 12 }} />
            New Appointment
          </ActionButton>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #f3f4f6", background: "#f9fafb" }}>
              {["ID", "Patient", "Doctor", "Date & Time", "Type", "Status", "Actions"].map((h) => (
                <th key={h} style={{ padding: "11px 18px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <LoadingRows cols={7} />
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: "32px 18px", textAlign: "center", color: "#9ca3af", fontSize: 14 }}>
                  No appointments found
                </td>
              </tr>
            ) : (
              filtered.map((apt, idx) => (
                <tr
                  key={apt.id}
                  style={{ borderBottom: idx < filtered.length - 1 ? "1px solid #f3f4f6" : "none", transition: "background 0.1s" }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLTableRowElement).style.background = "#f9fafb"}
                  onMouseLeave={(e) => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}
                >
                  <td style={{ padding: "14px 18px", fontSize: 12, color: "#9ca3af", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{apt.id}</td>
                  <td style={{ padding: "14px 18px", fontWeight: 600, fontSize: 14, color: "#111827" }}>{apt.patient}</td>
                  <td style={{ padding: "14px 18px", fontSize: 13, color: "#6b7280" }}>{apt.doctor}</td>
                  <td style={{ padding: "14px 18px", fontSize: 13, color: "#374151", fontWeight: 500 }}>
                    {apt.date} <span style={{ color: "#9ca3af" }}>·</span>{" "}
                    <span style={{ color: "#0d9488", fontWeight: 700 }}>{apt.time}</span>
                  </td>
                  <td style={{ padding: "14px 18px" }}>
                    <span style={{ fontSize: 12, color: "#6b7280", background: "#f3f4f6", borderRadius: 6, padding: "3px 10px", fontWeight: 500 }}>{apt.type}</span>
                  </td>
                  <td style={{ padding: "14px 18px" }}>
                    <Badge label={apt.status} color={statusColor[apt.status]} bg={statusBg[apt.status]} />
                  </td>
                  <td style={{ padding: "14px 18px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <ActionButton><i className="fa-solid fa-pen-to-square" style={{ fontSize: 11 }} /> Edit</ActionButton>
                      <ActionButton
                        variant="danger"
                        onClick={() => cancel(apt.id)}
                        disabled={apt.status === "cancelled" || apt.status === "completed"}
                      >
                        <i className="fa-solid fa-xmark" style={{ fontSize: 11 }} /> Cancel
                      </ActionButton>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* New Appointment Modal */}
      {showModal && (
        <div onClick={() => setShowModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(3px)" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, width: 420, maxWidth: "92vw", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", overflow: "hidden" }}>
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#111827", fontFamily: "'Outfit', sans-serif" }}>New Appointment</div>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }} onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.background = "#f3f4f6"} onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.background = "transparent"}>
                <i className="fa-solid fa-xmark" style={{ color: "#9ca3af", fontSize: 16 }} />
              </button>
            </div>
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Patient</label>
                <select value={formData.patientId} onChange={(e) => setFormData({ ...formData, patientId: e.target.value })} style={{ width: "100%", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 9, padding: "10px 14px", fontSize: 13, outline: "none", fontFamily: "inherit" }}>
                   <option value="">Select Patient</option>
                   {activePatients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Doctor/Staff</label>
                <select value={formData.staffId} onChange={(e) => setFormData({ ...formData, staffId: e.target.value })} style={{ width: "100%", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 9, padding: "10px 14px", fontSize: 13, outline: "none", fontFamily: "inherit" }}>
                   <option value="">Select Staff</option>
                   {activeStaff.map(s => <option key={s.id} value={s.id}>Dr. {s.name}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Date</label>
                    <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} style={{ width: "100%", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 9, padding: "10px 14px", fontSize: 13, outline: "none", fontFamily: "inherit" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Time</label>
                    <input type="time" value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} style={{ width: "100%", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 9, padding: "10px 14px", fontSize: 13, outline: "none", fontFamily: "inherit" }} />
                  </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Type</label>
                <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} style={{ width: "100%", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 9, padding: "10px 14px", fontSize: 13, outline: "none", fontFamily: "inherit" }}>
                   <option value="Checkup">Checkup</option>
                   <option value="Follow-up">Follow-up</option>
                   <option value="Consultation">Consultation</option>
                   <option value="Procedure">Procedure</option>
                </select>
              </div>
              {modalErr && (
                <div style={{ marginTop: 8, padding: "10px 14px", background: "#fef2f2", border: "1px solid #fee2e2", borderRadius: 8, color: "#dc2626", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                  <i className="fa-solid fa-circle-exclamation" style={{ fontSize: 13 }} />
                  {modalErr}
                </div>
              )}
            </div>
            <div style={{ padding: "14px 24px", borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "flex-end", gap: 10, background: "#f9fafb" }}>
              <ActionButton onClick={() => setShowModal(false)}>Cancel</ActionButton>
              <ActionButton variant="primary" onClick={handleSubmit} disabled={saving}>
                {saving ? <><i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: 11 }} /> Saving…</> : <><i className="fa-solid fa-check" style={{ fontSize: 11 }} /> Create</>}
              </ActionButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Section: Access / Roles ───────────────────────────────────────────────────

function AccessSection() {
  const { data: roles, loading, error, saveRole, addRole } = useRoles();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [editColor, setEditColor] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!selectedId && (roles ?? []).length > 0) {
      const first = (roles ?? [])[0];
      setSelectedId(first.id);
      setEditName(first.name);
      setEditPermissions(first.permissions);
      setEditColor(first.color);
    }
  }, [roles, selectedId]);

  const selectedRole = (roles ?? []).find((r) => r.id === selectedId) ?? null;

  const selectRole = (r: Role) => {
    setSelectedId(r.id);
    setEditName(r.name);
    setEditPermissions(r.permissions);
    setEditColor(r.color);
  };

  const togglePermission = (perm: string) => {
    setEditPermissions(prev => 
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    );
  };

  const handleSave = async () => {
    if (!selectedRole) return;
    setSaving(true);
    await saveRole(selectedRole.id, { 
        role_name: editName,
        color: editColor,
        permissions: editPermissions 
    } as any);
    setSaving(false);
  };

  const COLORS = ["#0d9488", "#0d9488", "#2563eb", "#7c3aed", "#d97706", "#dc2626", "#059669"];

  const permCategories: Record<string, { perms: string[]; icon: string }> = {
    "Patient Management": { perms: ["View Patients", "Edit Patients", "Delete Patients"], icon: "fa-solid fa-user-injured" },
    "Appointments": { perms: ["View Appointments", "Create Appointments", "Cancel Appointments"], icon: "fa-solid fa-calendar" },
    "Prescriptions": { perms: ["View Prescriptions", "Write Prescriptions"], icon: "fa-solid fa-pills" },
    "Staff & Admin": { perms: ["Manage Staff", "Manage Roles"], icon: "fa-solid fa-users-gear" },
    "Data & Reports": { perms: ["View Reports", "Export Data", "System Settings"], icon: "fa-solid fa-chart-bar" },
  };

  if (loading) return (
    <div style={{ textAlign: "center", padding: 48, color: "#9ca3af" }}>
      <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: 24 }} />
    </div>
  );
  if (error) return <ErrorMessage message={error} />;
  if (!selectedRole && (roles ?? []).length === 0) return <ErrorMessage message="No roles found. Create one below." />;

  const activeRole = selectedRole ?? (roles ?? [])[0];

  return (
    <div style={{ display: "flex", gap: 18, height: "calc(100vh - 200px)", minHeight: 500 }}>
      {/* Role List */}
      <div style={{
        width: 248, flexShrink: 0, background: "#fff", border: "1px solid #e5e7eb",
        borderRadius: 12, display: "flex", flexDirection: "column", overflow: "hidden",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}>
        <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid #f3f4f6" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Roles — {(roles ?? []).length}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 8 }}>
          {(roles ?? []).map((r) => (
            <button
              key={r.id}
              onClick={() => selectRole(r)}
              style={{
                width: "100%",
                background: activeRole?.id === r.id ? r.color + "10" : "transparent",
                border: activeRole?.id === r.id ? `1px solid ${r.color}30` : "1px solid transparent",
                borderRadius: 9, padding: "11px 12px", display: "flex", alignItems: "center",
                gap: 10, cursor: "pointer", textAlign: "left", marginBottom: 2,
                fontFamily: "inherit", transition: "all 0.15s",
              }}
            >
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: r.color, flexShrink: 0 }} />
              <div style={{ flex: 1, overflow: "hidden" }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.name}</div>
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{r.members} member{r.members !== 1 ? "s" : ""} · {r.permissions.length} perms</div>
              </div>
            </button>
          ))}
        </div>
        <div style={{ padding: 10, borderTop: "1px solid #f3f4f6" }}>
          <button
            onClick={() => addRole("New Role", "#0d9488", [])}
            style={{
              width: "100%", background: "linear-gradient(135deg, #0d9488, #14b8a6)",
              border: "none", borderRadius: 8, padding: "9px 0", color: "#fff",
              fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
              boxShadow: "0 2px 8px rgba(22,163,74,0.3)",
            }}
          >
            <i className="fa-solid fa-plus" style={{ fontSize: 11 }} />
            Create Role
          </button>
        </div>
      </div>

      {/* Role Editor */}
      {activeRole && (
        <div style={{
          flex: 1, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12,
          display: "flex", flexDirection: "column", overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}>
          <div style={{ padding: "18px 24px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", gap: 14, background: "#f9fafb" }}>
            <span style={{ width: 14, height: 14, borderRadius: "50%", background: editColor || activeRole.color, boxShadow: `0 0 0 3px ${editColor || activeRole.color}30` }} />
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              style={{ background: "transparent", border: "none", outline: "none", fontSize: 18, fontWeight: 700, color: "#111827", fontFamily: "'Outfit', sans-serif", flex: 1 }}
            />
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, marginRight: 4 }}>Color</span>
              {COLORS.map((c, idx) => (
                <button
                  key={`${c}-${idx}`}
                  onClick={() => setEditColor(c)}
                  style={{
                    width: 18, height: 18, borderRadius: "50%", background: c,
                    border: editColor === c ? "2px solid #111827" : "2px solid transparent",
                    cursor: "pointer", outline: editColor === c ? "2px solid #fff" : "none",
                    outlineOffset: "1px", transition: "all 0.15s",
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
            {Object.entries(permCategories).map(([cat, { perms, icon }]) => (
              <div key={cat} style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10, display: "flex", alignItems: "center", gap: 7 }}>
                  <i className={icon} style={{ color: "#0d9488", fontSize: 12 }} />
                  {cat}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {perms.map((perm) => {
                    const enabled = editPermissions.includes(perm);
                    const drawColor = editColor || activeRole.color;
                    return (
                      <div
                        key={perm}
                        onClick={() => togglePermission(perm)}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "12px 16px",
                          background: enabled ? drawColor + "08" : "#f9fafb",
                          border: `1px solid ${enabled ? drawColor + "40" : "#f3f4f6"}`,
                          borderRadius: 9, cursor: "pointer", transition: "all 0.15s",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <i className={enabled ? "fa-solid fa-circle-check" : "fa-regular fa-circle"} style={{ color: enabled ? drawColor : "#d1d5db", fontSize: 15 }} />
                          <span style={{ fontSize: 13, fontWeight: 500, color: enabled ? "#111827" : "#6b7280" }}>{perm}</span>
                        </div>
                        <div style={{ width: 40, height: 22, borderRadius: 11, background: enabled ? drawColor : "#e5e7eb", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                          <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: enabled ? 21 : 3, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div style={{ padding: "14px 24px", borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "flex-end", gap: 10, background: "#f9fafb" }}>
            <ActionButton onClick={() => { 
                setEditName(activeRole?.name ?? ""); 
                setEditColor(activeRole?.color ?? ""); 
                setEditPermissions(activeRole?.permissions ?? []); 
            }}>
              <i className="fa-solid fa-rotate-left" style={{ fontSize: 11 }} /> Reset
            </ActionButton>
            <ActionButton variant="primary" onClick={handleSave} disabled={saving}>
              {saving
                ? <><i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: 11 }} /> Saving…</>
                : <><i className="fa-solid fa-floppy-disk" style={{ fontSize: 11 }} /> Save Changes</>
              }
            </ActionButton>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Section: Prescriptions ────────────────────────────────────────────────────

function PrescriptionsSection() {
  const { data: prescriptions, loading, error, renew, addPrescription } = usePrescriptions();
  
  const { data: users } = useUsers();
  const { data: patients } = usePatients();
  const activeStaff = (users ?? []).filter(u => u.status === "active" && (u.role === "staff" || u.role === "admin"));
  const activePatients = (patients ?? []).filter(p => p.status === "active");

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ patientId: "", staffId: "", medication: "", dosage: "" });
  const [saving, setSaving] = useState(false);
  const [modalErr, setModalErr] = useState("");

  const handleSubmit = async () => {
    setModalErr("");
    if (!formData.patientId || !formData.staffId || !formData.medication || !formData.dosage) {
        setModalErr("All fields are required.");
        return;
    }
    setSaving(true);
    try {
        await addPrescription(formData.patientId, formData.staffId, formData.medication, formData.dosage);
        setShowModal(false);
        setFormData({ patientId: "", staffId: "", medication: "", dosage: "" });
    } catch (e: any) {
        setModalErr(e.message || "Failed to create prescription");
    } finally {
        setSaving(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <ActionButton variant="primary" onClick={() => setShowModal(true)}>
          <i className="fa-solid fa-file-prescription" style={{ fontSize: 12 }} />
          New Prescription
        </ActionButton>
      </div>

      {error && <ErrorMessage message={error} />}

      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #f3f4f6", background: "#f9fafb" }}>
              {["Rx ID", "Patient", "Doctor", "Medication", "Dosage", "Date", "Status", "Actions"].map((h) => (
                <th key={h} style={{ padding: "11px 18px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <LoadingRows cols={8} />
            ) : (prescriptions ?? []).length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: "32px 18px", textAlign: "center", color: "#9ca3af", fontSize: 14 }}>
                  No prescriptions found
                </td>
              </tr>
            ) : (
              (prescriptions ?? []).map((rx, idx) => (
                <tr
                  key={rx.id}
                  style={{ borderBottom: idx < (prescriptions ?? []).length - 1 ? "1px solid #f3f4f6" : "none", transition: "background 0.1s" }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLTableRowElement).style.background = "#f9fafb"}
                  onMouseLeave={(e) => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}
                >
                  <td style={{ padding: "14px 18px", fontSize: 12, color: "#9ca3af", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{rx.id}</td>
                  <td style={{ padding: "14px 18px", fontWeight: 600, fontSize: 14, color: "#111827" }}>{rx.patient}</td>
                  <td style={{ padding: "14px 18px", fontSize: 13, color: "#6b7280" }}>{rx.doctor}</td>
                  <td style={{ padding: "14px 18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <i className="fa-solid fa-capsules" style={{ color: "#0d9488", fontSize: 13 }} />
                      <span style={{ fontSize: 13, color: "#111827", fontWeight: 600 }}>{rx.medication}</span>
                    </div>
                  </td>
                  <td style={{ padding: "14px 18px", fontSize: 12, color: "#6b7280" }}>
                    <span style={{ background: "#f3f4f6", borderRadius: 5, padding: "3px 9px", fontWeight: 500 }}>{rx.dosage}</span>
                  </td>
                  <td style={{ padding: "14px 18px", fontSize: 13, color: "#9ca3af" }}>{rx.date}</td>
                  <td style={{ padding: "14px 18px" }}>
                    <Badge label={rx.status} color={statusColor[rx.status]} bg={statusBg[rx.status]} />
                  </td>
                  <td style={{ padding: "14px 18px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <ActionButton><i className="fa-solid fa-eye" style={{ fontSize: 11 }} /> View</ActionButton>
                      <ActionButton
                        variant="primary"
                        onClick={() => renew(rx.id)}
                        disabled={rx.status === "active"}
                      >
                        <i className="fa-solid fa-arrow-rotate-right" style={{ fontSize: 11 }} /> Renew
                      </ActionButton>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Write Prescription Modal */}
      {showModal && (
        <div onClick={() => setShowModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(3px)" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, width: 420, maxWidth: "92vw", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", overflow: "hidden" }}>
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#111827", fontFamily: "'Outfit', sans-serif" }}>Write Prescription</div>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }} onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.background = "#f3f4f6"} onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.background = "transparent"}>
                <i className="fa-solid fa-xmark" style={{ color: "#9ca3af", fontSize: 16 }} />
              </button>
            </div>
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Patient</label>
                <select value={formData.patientId} onChange={(e) => setFormData({ ...formData, patientId: e.target.value })} style={{ width: "100%", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 9, padding: "10px 14px", fontSize: 13, outline: "none", fontFamily: "inherit" }}>
                   <option value="">Select Patient</option>
                   {activePatients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Doctor/Staff</label>
                <select value={formData.staffId} onChange={(e) => setFormData({ ...formData, staffId: e.target.value })} style={{ width: "100%", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 9, padding: "10px 14px", fontSize: 13, outline: "none", fontFamily: "inherit" }}>
                   <option value="">Select Staff</option>
                   {activeStaff.map(s => <option key={s.id} value={s.id}>Dr. {s.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Medication Name</label>
                <input type="text" placeholder="e.g. Amoxicillin 500mg" value={formData.medication} onChange={(e) => setFormData({ ...formData, medication: e.target.value })} style={{ width: "100%", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 9, padding: "10px 14px", fontSize: 13, outline: "none", fontFamily: "inherit" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Dosage & Instructions</label>
                <input type="text" placeholder="e.g. 1 pill twice a day for 7 days" value={formData.dosage} onChange={(e) => setFormData({ ...formData, dosage: e.target.value })} style={{ width: "100%", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 9, padding: "10px 14px", fontSize: 13, outline: "none", fontFamily: "inherit" }} />
              </div>
              {modalErr && (
                <div style={{ marginTop: 8, padding: "10px 14px", background: "#fef2f2", border: "1px solid #fee2e2", borderRadius: 8, color: "#dc2626", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                  <i className="fa-solid fa-circle-exclamation" style={{ fontSize: 13 }} />
                  {modalErr}
                </div>
              )}
            </div>
            <div style={{ padding: "14px 24px", borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "flex-end", gap: 10, background: "#f9fafb" }}>
              <ActionButton onClick={() => setShowModal(false)}>Cancel</ActionButton>
              <ActionButton variant="primary" onClick={handleSubmit} disabled={saving}>
                {saving ? <><i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: 11 }} /> Saving…</> : <><i className="fa-solid fa-check" style={{ fontSize: 11 }} /> Create</>}
              </ActionButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Section: Profile ──────────────────────────────────────────────────────────
// Profile reads from NextAuth session — keeping it static for now
// Replace "James Okafor" with useSession().data?.user?.name when ready

function ProfileSection() {
  return (
    <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 32, flex: "0 0 280px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div style={{ position: "relative" }}>
          <div style={{ width: 80, height: 80, borderRadius: 20, background: "linear-gradient(135deg, #0d9488, #14b8a6)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 700, boxShadow: "0 8px 24px rgba(22,163,74,0.3)" }}>JO</div>
          <div style={{ position: "absolute", bottom: -4, right: -4, width: 22, height: 22, borderRadius: "50%", background: "#0d9488", border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <i className="fa-solid fa-check" style={{ color: "#fff", fontSize: 9 }} />
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#111827", fontFamily: "'Outfit', sans-serif" }}>James Okafor</div>
          <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 2 }}>james@clinic.com</div>
        </div>
        <Badge label="Chief Administrator" color="#0d9488" bg="#f0fdfa" />
      </div>
      <div style={{ flex: 1, minWidth: 300, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 16, fontFamily: "'Outfit', sans-serif", display: "flex", alignItems: "center", gap: 9 }}>
          <i className="fa-solid fa-lock" style={{ color: "#0d9488", fontSize: 16 }} />
          Security
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { label: "Change Password", icon: "fa-solid fa-key", danger: false },
            { label: "Manage Two-Factor Authentication", icon: "fa-solid fa-mobile-screen-button", danger: false },
            { label: "Sign Out of All Sessions", icon: "fa-solid fa-right-from-bracket", danger: true, onClick: () => signOut({ callbackUrl: "/" }) },
          ].map((item) => (
            <button key={item.label} onClick={item.onClick} style={{
              background: item.danger ? "#fef2f2" : "#f9fafb",
              border: `1px solid ${item.danger ? "#fee2e2" : "#e5e7eb"}`,
              borderRadius: 9, padding: "12px 16px",
              color: item.danger ? "#dc2626" : "#374151",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              textAlign: "left", fontFamily: "inherit",
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <i className={item.icon} style={{ fontSize: 14, width: 16, color: item.danger ? "#dc2626" : "#9ca3af" }} />
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar Nav ───────────────────────────────────────────────────────────────

const NAV: { id: Section; icon: string; label: string; requiredPermission?: string }[] = [
  { id: "dashboard", icon: "fa-solid fa-gauge-high", label: "Dashboard" },
  { id: "patients", icon: "fa-solid fa-user-injured", label: "Patients", requiredPermission: "view_patients" },
  { id: "staff", icon: "fa-solid fa-user-nurse", label: "Staff & Users", requiredPermission: "manage_staff" },
  { id: "appointments", icon: "fa-solid fa-calendar-days", label: "Appointments", requiredPermission: "view_appointments" },
  { id: "access", icon: "fa-solid fa-shield-halved", label: "Access & Roles", requiredPermission: "manage_roles" },
  { id: "prescriptions", icon: "fa-solid fa-pills", label: "Prescriptions", requiredPermission: "view_prescriptions" },
  { id: "profile", icon: "fa-solid fa-gear", label: "Settings" }
];

const SECTION_TITLES: Record<Section, string> = {
  dashboard: "Dashboard", patients: "Patients", staff: "Staff & Users",
  appointments: "Appointments", access: "Access & Roles",
  prescriptions: "Prescriptions", profile: "Profile & Settings",
};

const NoAccess = () => (
  <div style={{ padding: 16, color: "#9ca3af", fontSize: 14 }}>
    You do not have permission to view this section.
  </div>
);

// ─── Root Component ────────────────────────────────────────────────────────────

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [section, setSection] = useState<Section>("dashboard");
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();

  const hasPermission = (permission: string) => {
    const permissions = getPermissions(session);
    return permissions.includes(permission);
  };

  useEffect(() => {
    if (status === "loading") return; // wait for session to resolve before computing allowed sections
    const allowedSections = NAV
      .filter(n => !n.requiredPermission || hasPermission(n.requiredPermission))
      .map(n => n.id);

    if (!allowedSections.includes(section)) {
      setSection(allowedSections[0] || "dashboard");
    }
  }, [session, section, status]);

  return (
    <>
      <style>{`
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
        /* ═══════════════════════════════════════════════════════
           COMPREHENSIVE DARK MODE
           (overrides every inline-styled light colour)
           ═══════════════════════════════════════════════════════ */
        [data-theme="dark"] { color-scheme: dark; }

        /* ── Scrollbar ── */
        [data-theme="dark"] ::-webkit-scrollbar-thumb { background: #475569; }

        /* ── Global surface / text ── */
        [data-theme="dark"] div,
        [data-theme="dark"] aside,
        [data-theme="dark"] main,
        [data-theme="dark"] header,
        [data-theme="dark"] section {
          transition: background 0.2s, border-color 0.2s, color 0.2s;
        }

        /* ── Cards, panels, table wrappers (background:#fff  →  #1e293b) ── */
        [data-theme="dark"] div[style*="background: rgb(255, 255, 255)"],
        [data-theme="dark"] div[style*="background:#fff"],
        [data-theme="dark"] div[style*="background: #fff"] {
          background: #1e293b !important;
          border-color: #334155 !important;
        }

        /* ── Alt surfaces (background:#f9fafb / #f3f4f6  →  #162032 / #0f172a) ── */
        [data-theme="dark"] div[style*="background: rgb(249, 250, 251)"],
        [data-theme="dark"] div[style*="background:#f9fafb"],
        [data-theme="dark"] div[style*="background: #f9fafb"],
        [data-theme="dark"] div[style*="background: rgb(243, 244, 246)"],
        [data-theme="dark"] div[style*="background:#f3f4f6"],
        [data-theme="dark"] div[style*="background: #f3f4f6"] {
          background: #162032 !important;
          border-color: #334155 !important;
        }

        /* light teal surfaces */
        [data-theme="dark"] div[style*="background: rgb(240, 253, 250)"],
        [data-theme="dark"] div[style*="background:#f0fdfa"],
        [data-theme="dark"] div[style*="background: #f0fdfa"] {
          background: #0c2a22 !important;
          border-color: #134e3a !important;
        }

        /* ── Main text (#111827 → #e2e8f0) ── */
        [data-theme="dark"] div[style*="color: rgb(17, 24, 39)"],
        [data-theme="dark"] div[style*="color:#111827"],
        [data-theme="dark"] div[style*="color: #111827"],
        [data-theme="dark"] span[style*="color: rgb(17, 24, 39)"],
        [data-theme="dark"] span[style*="color:#111827"],
        [data-theme="dark"] span[style*="color: #111827"],
        [data-theme="dark"] h1[style*="color:#111827"],
        [data-theme="dark"] h1[style*="color: #111827"],
        [data-theme="dark"] h2[style*="color:#111827"],
        [data-theme="dark"] h2[style*="color: #111827"],
        [data-theme="dark"] h2[style*="color: rgb(17, 24, 39)"] {
          color: #e2e8f0 !important;
        }

        /* Secondary text (#374151 → #cbd5e1) */
        [data-theme="dark"] div[style*="color: rgb(55, 65, 81)"],
        [data-theme="dark"] div[style*="color:#374151"],
        [data-theme="dark"] div[style*="color: #374151"],
        [data-theme="dark"] span[style*="color: rgb(55, 65, 81)"],
        [data-theme="dark"] span[style*="color:#374151"],
        [data-theme="dark"] span[style*="color: #374151"] {
          color: #cbd5e1 !important;
        }

        /* Muted text (#6b7280 → #94a3b8) */
        [data-theme="dark"] div[style*="color: rgb(107, 114, 128)"],
        [data-theme="dark"] div[style*="color:#6b7280"],
        [data-theme="dark"] div[style*="color: #6b7280"],
        [data-theme="dark"] span[style*="color: rgb(107, 114, 128)"],
        [data-theme="dark"] span[style*="color:#6b7280"],
        [data-theme="dark"] span[style*="color: #6b7280"],
        [data-theme="dark"] label[style*="color:#374151"],
        [data-theme="dark"] label[style*="color: #374151"] {
          color: #94a3b8 !important;
        }

        /* Subtle text (#9ca3af → #64748b) */
        [data-theme="dark"] div[style*="color: rgb(156, 163, 175)"],
        [data-theme="dark"] div[style*="color:#9ca3af"],
        [data-theme="dark"] div[style*="color: #9ca3af"],
        [data-theme="dark"] span[style*="color: rgb(156, 163, 175)"],
        [data-theme="dark"] span[style*="color:#9ca3af"],
        [data-theme="dark"] span[style*="color: #9ca3af"],
        [data-theme="dark"] p[style*="color:#9ca3af"],
        [data-theme="dark"] p[style*="color: #9ca3af"] {
          color: #64748b !important;
        }

        /* ── Borders ── */
        [data-theme="dark"] div[style*="border: 1px solid rgb(229, 231, 235)"],
        [data-theme="dark"] div[style*="border: 1px solid #e5e7eb"] {
          border-color: #334155 !important;
        }
        [data-theme="dark"] [style*="border-bottom: 1px solid rgb(243, 244, 246)"],
        [data-theme="dark"] [style*="border-bottom: 1px solid #f3f4f6"],
        [data-theme="dark"] [style*="border-top: 1px solid rgb(243, 244, 246)"],
        [data-theme="dark"] [style*="border-top: 1px solid #f3f4f6"] {
          border-color: #1e293b !important;
        }

        /* ── Tables ── */
        [data-theme="dark"] table { border-collapse: collapse; }
        [data-theme="dark"] thead tr {
          background: #162032 !important;
          border-color: #1e293b !important;
        }
        [data-theme="dark"] thead th {
          color: #64748b !important;
        }
        [data-theme="dark"] tbody tr {
          border-color: #1e293b !important;
        }
        [data-theme="dark"] tbody tr:hover {
          background: #1a2740 !important;
        }
        [data-theme="dark"] td {
          border-color: #1e293b !important;
        }
        [data-theme="dark"] td[style*="color: rgb(17, 24, 39)"],
        [data-theme="dark"] td[style*="color:#111827"],
        [data-theme="dark"] td[style*="color: #111827"] {
          color: #e2e8f0 !important;
        }
        [data-theme="dark"] td[style*="color: rgb(107, 114, 128)"],
        [data-theme="dark"] td[style*="color:#6b7280"],
        [data-theme="dark"] td[style*="color: #6b7280"] {
          color: #94a3b8 !important;
        }
        [data-theme="dark"] td[style*="color: rgb(156, 163, 175)"],
        [data-theme="dark"] td[style*="color:#9ca3af"],
        [data-theme="dark"] td[style*="color: #9ca3af"] {
          color: #64748b !important;
        }

        /* ── Inputs ── */
        [data-theme="dark"] input,
        [data-theme="dark"] select,
        [data-theme="dark"] textarea {
          background: #1e293b !important;
          border-color: #334155 !important;
          color: #e2e8f0 !important;
        }
        [data-theme="dark"] input::placeholder { color: #64748b !important; }

        /* ── Buttons (secondary / danger) ── */
        [data-theme="dark"] button[style*="background: rgb(255, 255, 255)"],
        [data-theme="dark"] button[style*="background:#fff"],
        [data-theme="dark"] button[style*="background: #fff"] {
          background: #1e293b !important;
          border-color: #334155 !important;
          color: #cbd5e1 !important;
        }
        [data-theme="dark"] button[style*="background: rgb(249, 250, 251)"],
        [data-theme="dark"] button[style*="background:#f9fafb"],
        [data-theme="dark"] button[style*="background: #f9fafb"] {
          background: #162032 !important;
          border-color: #334155 !important;
          color: #cbd5e1 !important;
        }

        /* filter tabs */
        [data-theme="dark"] div[style*="background: rgb(243, 244, 246)"][style*="border-radius"] {
          background: #1e293b !important;
        }

        /* ── Modals ── */
        [data-theme="dark"] div[style*="background: rgba(0, 0, 0"] {
          background: rgba(0,0,0,0.6) !important;
        }

        /* ── Dosage / small tags ── */
        [data-theme="dark"] span[style*="background: rgb(243, 244, 246)"],
        [data-theme="dark"] span[style*="background:#f3f4f6"],
        [data-theme="dark"] span[style*="background: #f3f4f6"] {
          background: #1e293b !important;
          color: #94a3b8 !important;
        }

        /* ── Loading shimmer ── */
        [data-theme="dark"] div[style*="shimmer"] {
          background: linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%) !important;
        }

        /* ── Error / Success alert transparency ── */
        [data-theme="dark"] div[style*="background: rgb(254, 242, 242)"],
        [data-theme="dark"] div[style*="background:#fef2f2"],
        [data-theme="dark"] div[style*="background: #fef2f2"] {
          background: #350a0a !important;
          border-color: #7f1d1d !important;
        }
        [data-theme="dark"] div[style*="background: rgb(240, 253, 250)"][style*="border"] {
          background: #0c2a22 !important;
          border-color: #134e3a !important;
        }

        /* ── Teal accents (keep them punchy) ── */
        [data-theme="dark"] span[style*="color: rgb(15, 118, 110)"],
        [data-theme="dark"] span[style*="color:#0f766e"],
        [data-theme="dark"] span[style*="color: #0f766e"] {
          color: #2dd4bf !important;
        }

        /* ── Nav sidebar items (hover states handled by JS too) ── */
        [data-theme="dark"] nav button {
          color: #94a3b8 !important;
        }
        [data-theme="dark"] nav button:hover {
          background: #162032 !important;
          color: #e2e8f0 !important;
        }
        [data-theme="dark"] nav button[style*="background: rgb(240, 253, 250)"] {
          background: #0c2a22 !important;
          border-color: #134e3a !important;
          color: #2dd4bf !important;
        }
        [data-theme="dark"] nav button[style*="background: rgb(240, 253, 250)"] i {
          color: #fff !important;
        }
        [data-theme="dark"] nav button[style*="background: rgb(240, 253, 250)"] div[style*="background: rgb(13, 148, 136)"] {
          box-shadow: 0 4px 12px rgba(45,212,191,0.35);
        }

        /* ── Toggle button ── */
        .adm-theme-toggle {
          background: none; border: 1px solid #e5e7eb; border-radius: 8px;
          width: 34px; height: 34px; display: flex; align-items: center;
          justify-content: center; cursor: pointer; transition: all 0.2s;
          flex-shrink: 0;
        }
        [data-theme="dark"] .adm-theme-toggle { border-color: #334155; background: #1e293b; }
        .adm-theme-toggle:hover { transform: scale(1.1); }

      `}</style>

      <div data-theme={isDark ? "dark" : "light"} style={{ display: "flex", height: "100vh", overflow: "hidden", background: isDark ? "#0f172a" : "#f3f4f6", transition: "background 0.2s", colorScheme: isDark ? "dark" : "light" }}>
        {/* Sidebar */}
        <aside className="adm-sidebar" style={{ width: 232, flexShrink: 0, background: isDark ? "#1e293b" : "#fff", borderRight: `1px solid ${isDark ? "#334155" : "#e5e7eb"}`, display: "flex", flexDirection: "column", padding: "0 0 16px", transition: "background 0.2s, border-color 0.2s" }}>
          <div style={{ padding: "20px 20px 16px", borderBottom: `1px solid ${isDark ? "#334155" : "#f3f4f6"}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg, #0d9488, #14b8a6)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 10px rgba(22,163,74,0.3)" }}>
                <i className="fa-solid fa-plus" style={{ color: "#fff", fontSize: 14 }} />
              </div>
              <div>
                <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 16, color: isDark ? "#e2e8f0" : "#111827", lineHeight: 1.1, letterSpacing: "-0.3px" }}>MediPanel</div>
                <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Admin Portal</div>
              </div>
            </div>
          </div>

          <div style={{ padding: "16px 16px 6px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: isDark ? "#64748b" : "#9ca3af", textTransform: "uppercase", letterSpacing: "0.12em" }}>Main Menu</div>
          </div>

          <nav style={{ flex: 1, padding: "0 8px", display: "flex", flexDirection: "column", gap: 1 }}>
            {NAV.filter(n => !n.requiredPermission || hasPermission(n.requiredPermission)).map((n) => (
              <button
                key={n.id}
                onClick={() => n.id === "access" ? router.push("/admin/access-role") : setSection(n.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 11, padding: "10px 12px",
                  borderRadius: 9,
                  background: section === n.id ? "#f0fdfa" : "transparent",
                  border: section === n.id ? "1px solid #ccfbf1" : "1px solid transparent",
                  color: section === n.id ? "#0f766e" : "#6b7280",
                  fontSize: 13, fontWeight: section === n.id ? 700 : 500,
                  cursor: "pointer", textAlign: "left", transition: "all 0.15s", fontFamily: "inherit",
                }}
                onMouseEnter={(e) => {
                  if (section !== n.id) {
                    (e.currentTarget as HTMLButtonElement).style.background = "#f9fafb";
                    (e.currentTarget as HTMLButtonElement).style.color = "#374151";
                  }
                }}
                onMouseLeave={(e) => {
                  if (section !== n.id) {
                    (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                    (e.currentTarget as HTMLButtonElement).style.color = "#6b7280";
                  }
                }}
              >
                <div style={{ width: 30, height: 30, borderRadius: 7, background: section === n.id ? "#0d9488" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s", flexShrink: 0 }}>
                  <i className={n.icon} style={{ fontSize: 13, color: section === n.id ? "#fff" : "#9ca3af" }} />
                </div>
                {n.label}
                {section === n.id && <i className="fa-solid fa-chevron-right" style={{ marginLeft: "auto", fontSize: 10, color: "#0d9488" }} />}
              </button>
            ))}
          </nav>

          <div style={{ margin: "0 8px", padding: "12px", background: isDark ? "#162032" : "#f9fafb", borderRadius: 10, display: "flex", alignItems: "center", gap: 10, border: `1px solid ${isDark ? "#334155" : "#f3f4f6"}` }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg, #0d9488, #14b8a6)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>JO</div>
            <div style={{ flex: 1, overflow: "hidden" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: isDark ? "#e2e8f0" : "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>James Okafor</div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>Administrator</div>
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

        {/* Main */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <header style={{ padding: "0 28px", height: 58, borderBottom: `1px solid ${isDark ? "#334155" : "#e5e7eb"}`, background: isDark ? "#1e293b" : "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, transition: "background 0.2s" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h1 style={{ fontSize: 17, fontWeight: 700, fontFamily: "'Outfit', sans-serif", color: isDark ? "#e2e8f0" : "#111827" }}>{SECTION_TITLES[section]}</h1>
              <span style={{ color: isDark ? "#475569" : "#d1d5db" }}>/</span>
              <span style={{ fontSize: 13, color: "#94a3b8" }}>Overview</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ fontSize: 13, color: "#9ca3af", display: "flex", alignItems: "center", gap: 6 }}>
                <i className="fa-solid fa-calendar-day" style={{ fontSize: 12 }} />
                {new Date().toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
              </div>
              {/* Dark mode toggle */}
              <button
                onClick={toggleTheme}
                className="adm-theme-toggle"
                title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              >
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
                <span style={{ fontSize: 12, color: isDark ? "#2dd4bf" : "#0f766e", fontWeight: 700 }}>Operational</span>
              </div>
            </div>
          </header>

          <div style={{ flex: 1, overflowY: "auto", padding: "26px 28px", background: isDark ? "#0f172a" : "#f3f4f6", transition: "background 0.2s", color: isDark ? "#e2e8f0" : "#111827" }}>
            {section === "dashboard" && <DashboardOverview setSection={setSection} />}
            {section === "patients" && (
              hasPermission("view_patients") ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <p style={{ color: "#9ca3af", fontSize: 14, marginBottom: 8 }}>All registered patients in the system.</p>
                  <UsersTable filterRole="patient" />
                </div>
              ) : <NoAccess />
            )}
            {section === "staff" && (
              hasPermission("manage_staff") ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <p style={{ color: "#9ca3af", fontSize: 14, marginBottom: 8 }}>Manage all users: staff, doctors, and administrators.</p>
                  <UsersTable />
                </div>
              ) : <NoAccess />
            )}
            {section === "appointments" && (
              hasPermission("view_appointments") ? <AppointmentsSection /> : <NoAccess />
            )}
            {/* Access & Roles now lives at /admin/access-role */}
            {section === "prescriptions" && (
              hasPermission("view_prescriptions") ? <PrescriptionsSection /> : <NoAccess />
            )}
            {section === "profile" && <ProfileSection />}
          </div>
        </main>
      </div>
    </>
  );
}
