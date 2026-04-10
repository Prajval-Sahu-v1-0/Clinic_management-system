"use client";

import { useState } from "react";
import { Badge, ActionButton, LoadingRows, ErrorMessage, statusColor, statusBg, roleColor } from "@/components/DashboardShared";
import { useUsers } from "@/hooks/useAdminData";
import type { User } from "@/hooks/types";

export default function UsersSection() {
  const [search, setSearch] = useState("");
  const { data: allUsers, loading, error, deactivate, resetPassword } = useUsers();

  const [editUser, setEditUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  const filtered = (allUsers ?? []).filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (u: User) => {
    setEditUser(u);
    setNewPassword(""); setConfirmPassword(""); setPwError(""); setPwSuccess("");
  };
  const closeEdit = () => {
    setEditUser(null);
    setNewPassword(""); setConfirmPassword(""); setPwError(""); setPwSuccess("");
  };
  const handleChangePassword = async () => {
    setPwError(""); setPwSuccess("");
    if (!newPassword) { setPwError("Please enter a new password."); return; }
    if (newPassword.length < 6) { setPwError("Password must be at least 6 characters."); return; }
    if (newPassword !== confirmPassword) { setPwError("Passwords do not match."); return; }
    if (!editUser) return;
    setPwSaving(true);
    try {
      await resetPassword(editUser.id, newPassword);
      setPwSuccess(`Password updated successfully for ${editUser.name}.`);
      setNewPassword(""); setConfirmPassword("");
    } catch (err: any) {
      setPwError(err?.message || "Failed to update password.");
    } finally { setPwSaving(false); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <p style={{ color: "#9ca3af", fontSize: 14, marginBottom: 8 }}>Manage all users: staff, doctors, and administrators.</p>
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
              <tr><td colSpan={6} style={{ padding: "32px 18px", textAlign: "center", color: "#9ca3af", fontSize: 14 }}>No users found</td></tr>
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
                        background: (roleColor[u.role] ?? "#0d9488") + "18",
                        color: roleColor[u.role] ?? "#0d9488",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 700,
                        border: `1px solid ${(roleColor[u.role] ?? "#0d9488")}33`,
                      }}>{u.avatar}</div>
                      <span style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: "14px 18px", fontSize: 13, color: "#6b7280" }}>{u.email}</td>
                  <td style={{ padding: "14px 18px" }}>
                    <Badge label={u.role} color={roleColor[u.role] ?? "#0d9488"} bg={(roleColor[u.role] ?? "#0d9488") + "18"} />
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
                        onClick={() => deactivate(u.id)}
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

      {/* Edit User Modal */}
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
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: (roleColor[editUser.role] ?? "#0d9488") + "18",
                  color: roleColor[editUser.role] ?? "#0d9488",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, fontWeight: 700,
                  border: `1px solid ${(roleColor[editUser.role] ?? "#0d9488")}33`,
                }}>{editUser.avatar}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: "#111827", fontFamily: "'Outfit', sans-serif" }}>{editUser.name}</div>
                  <div style={{ fontSize: 12, color: "#9ca3af" }}>{editUser.email}</div>
                </div>
              </div>
              <button onClick={closeEdit} style={{ background: "none", border: "none", cursor: "pointer", width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}
                onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.background = "#f3f4f6"}
                onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.background = "transparent"}
              >
                <i className="fa-solid fa-xmark" style={{ color: "#9ca3af", fontSize: 16 }} />
              </button>
            </div>
            <div style={{ padding: "20px 24px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14, display: "flex", alignItems: "center", gap: 7 }}>
                <i className="fa-solid fa-key" style={{ color: "#0d9488", fontSize: 12 }} /> Change Password
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>New Password</label>
                  <input type="password" placeholder="Enter new password (min 6 chars)" value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setPwError(""); setPwSuccess(""); }}
                    style={{ width: "100%", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 9, padding: "10px 14px", fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Confirm Password</label>
                  <input type="password" placeholder="Re-enter new password" value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setPwError(""); setPwSuccess(""); }}
                    style={{ width: "100%", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 9, padding: "10px 14px", fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
                  />
                </div>
              </div>
              {pwError && (
                <div style={{ marginTop: 12, padding: "10px 14px", background: "#fef2f2", border: "1px solid #fee2e2", borderRadius: 8, color: "#dc2626", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                  <i className="fa-solid fa-circle-exclamation" style={{ fontSize: 13 }} />{pwError}
                </div>
              )}
              {pwSuccess && (
                <div style={{ marginTop: 12, padding: "10px 14px", background: "#f0fdfa", border: "1px solid #ccfbf1", borderRadius: 8, color: "#0d9488", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                  <i className="fa-solid fa-circle-check" style={{ fontSize: 13 }} />{pwSuccess}
                </div>
              )}
            </div>
            <div style={{ padding: "14px 24px", borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "flex-end", gap: 10, background: "#f9fafb" }}>
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
