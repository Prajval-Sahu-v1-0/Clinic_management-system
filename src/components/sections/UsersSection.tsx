"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Badge, ActionButton, LoadingRows, ErrorMessage, statusColor, statusBg, roleColor } from "@/components/DashboardShared";
import { useUsers } from "@/hooks/useAdminData";
import type { User } from "@/hooks/types";
import { T } from "./themeTokens";

export default function UsersSection() {
  const { data: session } = useSession();
  const activeName = session?.user?.name || "Unknown Admin";

  const [search, setSearch] = useState("");
  const [actionErr, setActionErr] = useState("");
  const { data: allUsers, loading, error, removeUser, resetPassword } = useUsers();

  const [deletingEntity, setDeletingEntity] = useState<User | null>(null);
  const [authChallenge, setAuthChallenge] = useState(false);
  const [authInput, setAuthInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const expectedAuthString = deletingEntity ? `${activeName} - ${deletingEntity.name}` : "";

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
      <p style={{ color: T.text3, fontSize: 14, marginBottom: 8 }}>Manage all users: staff, doctors, and administrators.</p>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 360 }}>
          <i className="fa-solid fa-magnifying-glass" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: T.searchIcon, fontSize: 13 }} />
          <input
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: T.inputBg, border: `1px solid ${T.inputBorder}`, borderRadius: 9,
              padding: "9px 14px 9px 36px", color: T.text1, fontSize: 14,
              outline: "none", width: "100%", boxSizing: "border-box",
              fontFamily: "inherit", boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          />
        </div>
      </div>

      {actionErr && <ErrorMessage message={actionErr} />}
      {error && <ErrorMessage message={error} />}

      <div style={{ background: T.tableBg, border: `1px solid ${T.cardBorder}`, borderRadius: 12, overflow: "hidden", boxShadow: T.cardShadow, backdropFilter: "blur(8px)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.tableRowBorder}`, background: T.tableHeaderBg }}>
              {["User", "Email", "Role", "Status", "Joined", "Actions"].map((h) => (
                <th key={h} style={{ padding: "11px 18px", textAlign: "left", fontSize: 11, fontWeight: 700, color: T.text2, textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <LoadingRows cols={6} />
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: "32px 18px", textAlign: "center", color: T.text3, fontSize: 14 }}>No users found</td></tr>
            ) : (
              filtered.map((u, idx) => (
                <tr
                  key={u.id}
                  style={{ borderBottom: idx < filtered.length - 1 ? `1px solid ${T.tableRowBorder}` : "none", transition: "background 0.1s" }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLTableRowElement).style.background = T.tableHoverBg}
                  onMouseLeave={(e) => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}
                >
                  <td style={{ padding: "14px 18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 9,
                        background: T.avatarBg,
                        color: roleColor[u.role] ?? T.sage,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 700,
                        border: `1px solid ${T.avatarBorder}`,
                      }}>{u.avatar}</div>
                      <span style={{ fontWeight: 600, fontSize: 14, color: T.text1 }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: "14px 18px", fontSize: 13, color: T.text2 }}>{u.email}</td>
                  <td style={{ padding: "14px 18px" }}>
                    <Badge label={u.role} color={roleColor[u.role] ?? T.sage} bg={T.chipBg} />
                  </td>
                  <td style={{ padding: "14px 18px" }}>
                    <Badge label={u.status} color={statusColor[u.status]} bg={statusBg[u.status]} />
                  </td>
                  <td style={{ padding: "14px 18px", fontSize: 13, color: T.text3 }}>{u.joined}</td>
                  <td style={{ padding: "14px 18px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <ActionButton onClick={() => openEdit(u)}>
                        <i className="fa-solid fa-pen-to-square" style={{ fontSize: 11 }} /> Edit
                      </ActionButton>
                      <ActionButton
                        variant="danger"
                        onClick={() => {
                          setActionErr("");
                          setDeletingEntity(u);
                          setAuthChallenge(false);
                          setAuthInput("");
                        }}
                      >
                        <i className="fa-solid fa-trash" style={{ fontSize: 11 }} /> Delete
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
        <div onClick={closeEdit} style={{ position: "fixed", inset: 0, background: T.modalOverlay, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(6px)" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: T.modalBg, border: `1px solid ${T.modalBorder}`, borderRadius: 16, width: 420, maxWidth: "92vw", boxShadow: T.modalShadow, overflow: "hidden", backdropFilter: "blur(20px)" }}>
            <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${T.modalHeaderBorder}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: T.avatarBg,
                  color: roleColor[editUser.role] ?? T.sage,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, fontWeight: 700,
                  border: `1px solid ${T.avatarBorder}`,
                }}>{editUser.avatar}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: T.text1, fontFamily: "'Inter', sans-serif" }}>{editUser.name}</div>
                  <div style={{ fontSize: 12, color: T.text3 }}>{editUser.email}</div>
                </div>
              </div>
              <button onClick={closeEdit} style={{ background: "none", border: "none", cursor: "pointer", width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}
                onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.background = T.closeBtnHover}
                onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.background = "transparent"}
              >
                <i className="fa-solid fa-xmark" style={{ color: T.text3, fontSize: 16 }} />
              </button>
            </div>
            <div style={{ padding: "20px 24px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14, display: "flex", alignItems: "center", gap: 7 }}>
                <i className="fa-solid fa-key" style={{ color: T.sage, fontSize: 12 }} /> Change Password
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: T.textLabel, display: "block", marginBottom: 5 }}>New Password</label>
                  <input type="password" placeholder="Enter new password (min 6 chars)" value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setPwError(""); setPwSuccess(""); }}
                    style={{ width: "100%", background: T.inputBg, border: `1px solid ${T.inputBorder}`, borderRadius: 9, padding: "10px 14px", fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box", color: T.text1 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: T.textLabel, display: "block", marginBottom: 5 }}>Confirm Password</label>
                  <input type="password" placeholder="Re-enter new password" value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setPwError(""); setPwSuccess(""); }}
                    style={{ width: "100%", background: T.inputBg, border: `1px solid ${T.inputBorder}`, borderRadius: 9, padding: "10px 14px", fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box", color: T.text1 }}
                  />
                </div>
              </div>
              {pwError && (
                <div style={{ marginTop: 12, padding: "10px 14px", background: T.errorBg, border: `1px solid ${T.errorBorder}`, borderRadius: 8, color: T.errorColor, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                  <i className="fa-solid fa-circle-exclamation" style={{ fontSize: 13 }} />{pwError}
                </div>
              )}
              {pwSuccess && (
                <div style={{ marginTop: 12, padding: "10px 14px", background: T.successBg, border: `1px solid ${T.successBorder}`, borderRadius: 8, color: T.successColor, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                  <i className="fa-solid fa-circle-check" style={{ fontSize: 13 }} />{pwSuccess}
                </div>
              )}
            </div>
            <div style={{ padding: "14px 24px", borderTop: `1px solid ${T.modalHeaderBorder}`, display: "flex", justifyContent: "flex-end", gap: 10, background: T.modalFooterBg }}>
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

      {/* Delete User Modal */}
      {deletingEntity && (
        <div onClick={() => { setDeletingEntity(null); setAuthChallenge(false); }} style={{ position: "fixed", inset: 0, background: T.modalOverlay, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(6px)" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: T.modalBg, border: `1px solid ${T.modalBorder}`, borderRadius: 16, width: 400, maxWidth: "90vw", boxShadow: T.modalShadow, overflow: "hidden", backdropFilter: "blur(20px)" }}>
            <div style={{ padding: "16px 24px", borderBottom: `1px solid ${T.modalHeaderBorder}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: T.text1, display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: T.dangerBg, color: T.dangerColor, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: 14 }} />
                </div>
                {authChallenge ? "Authentication Required" : "Confirm Deletion"}
              </div>
              <button onClick={() => { setDeletingEntity(null); setAuthChallenge(false); }} style={{ background: "none", border: "none", cursor: "pointer", width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = T.closeBtnHover)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <i className="fa-solid fa-xmark" style={{ color: T.text3, fontSize: 16 }} />
              </button>
            </div>

            <div style={{ padding: "24px" }}>
              {!authChallenge ? (
                <>
                  <p style={{ margin: 0, fontSize: 15, color: T.text2, lineHeight: 1.5 }}>
                    Are you absolutely sure you want to permanently delete <strong style={{ color: T.text1 }}>{deletingEntity.name}</strong>?
                  </p>
                  <p style={{ margin: "12px 0 0", fontSize: 13, color: T.text3 }}>
                    This action cannot be undone. Any compliant historical records mapped here might cascade.
                  </p>
                </>
              ) : (
                <>
                  <p style={{ margin: "0 0 16px", fontSize: 14, color: T.text2 }}>
                    To authorize this deletion, please type the following confirmation signature exactly as it appears below:
                  </p>
                  <div style={{ background: T.chipBg, padding: "10px 14px", borderRadius: 8, fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: T.text1, fontWeight: 600, letterSpacing: "-0.01em", userSelect: "all", marginBottom: 16, border: `1px dashed ${T.inputBorder}` }}>
                    {expectedAuthString}
                  </div>
                  <input
                    autoFocus
                    placeholder="Type signature here..."
                    value={authInput}
                    onChange={(e) => setAuthInput(e.target.value)}
                    style={{
                      width: "100%", background: T.inputBg, border: authInput === expectedAuthString ? `1px solid ${T.sage}` : `1px solid ${T.inputBorder}`, 
                      borderRadius: 8, padding: "12px 14px", fontSize: 14, outline: "none", fontFamily: "'JetBrains Mono', monospace",
                      boxSizing: "border-box", transition: "border 0.2s", color: T.text1,
                    }}
                  />
                </>
              )}
            </div>

            <div style={{ padding: "16px 24px", borderTop: `1px solid ${T.modalHeaderBorder}`, background: T.modalFooterBg, display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <ActionButton onClick={() => { setDeletingEntity(null); setAuthChallenge(false); }}>Cancel</ActionButton>
              {!authChallenge ? (
                <ActionButton variant="primary" onClick={() => setAuthChallenge(true)}>
                  Proceed <i className="fa-solid fa-arrow-right" style={{ fontSize: 11, marginLeft: 4 }} />
                </ActionButton>
              ) : (
                <ActionButton
                  variant="danger"
                  disabled={authInput !== expectedAuthString || isDeleting}
                  onClick={async () => {
                    setIsDeleting(true);
                    try {
                      await removeUser(deletingEntity.id);
                      setDeletingEntity(null);
                      setAuthChallenge(false);
                    } catch(err: any) {
                      setActionErr(err.message || "Failed to delete user");
                      setDeletingEntity(null);
                      setAuthChallenge(false);
                    } finally {
                      setIsDeleting(false);
                    }
                  }}
                >
                  {isDeleting ? <i className="fa-solid fa-circle-notch fa-spin" /> : <i className="fa-solid fa-trash" />} Confirm Delete
                </ActionButton>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
