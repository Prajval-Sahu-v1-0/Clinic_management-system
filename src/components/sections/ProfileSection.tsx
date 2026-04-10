"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Badge, ActionButton } from "@/components/DashboardShared";
import { useUsers } from "@/hooks/useAdminData";

export default function ProfileSection({ currentRole }: { currentRole: string }) {
  const { data: session } = useSession();
  const { resetPassword } = useUsers();

  const [showPwModal, setShowPwModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  const handlePasswordChange = async () => {
    setPwError("");
    setPwSuccess("");
    if (!newPassword) {
      setPwError("Please enter a new password.");
      return;
    }
    if (newPassword.length < 6) {
      setPwError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("Passwords do not match.");
      return;
    }
    if (!session?.user?.id) {
      setPwError("Unable to identify current user.");
      return;
    }

    setPwSaving(true);
    try {
      await resetPassword(session.user.id as string, newPassword);
      setPwSuccess("Password successfully updated. Your session is active.");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPwError(err.message || "Failed to update password.");
    } finally {
      setPwSaving(false);
    }
  };
  const userName = session?.user?.name ?? "User";
  const userEmail = session?.user?.email ?? "";
  const userInitials = userName.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 32, flex: "0 0 280px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div style={{ position: "relative" }}>
          <div style={{ width: 80, height: 80, borderRadius: 20, background: "linear-gradient(135deg, #0d9488, #14b8a6)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 700, boxShadow: "0 8px 24px rgba(22,163,74,0.3)" }}>{userInitials}</div>
          <div style={{ position: "absolute", bottom: -4, right: -4, width: 22, height: 22, borderRadius: "50%", background: "#0d9488", border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <i className="fa-solid fa-check" style={{ color: "#fff", fontSize: 9 }} />
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#111827", fontFamily: "'Outfit', sans-serif" }}>{userName}</div>
          <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 2 }}>{userEmail}</div>
        </div>
        <Badge label={currentRole.charAt(0).toUpperCase() + currentRole.slice(1)} color="#0d9488" bg="#f0fdfa" />
      </div>
      <div style={{ flex: 1, minWidth: 300, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 16, fontFamily: "'Outfit', sans-serif", display: "flex", alignItems: "center", gap: 9 }}>
          <i className="fa-solid fa-lock" style={{ color: "#0d9488", fontSize: 16 }} />
          Security
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { label: "Change Password", icon: "fa-solid fa-key", danger: false, onClick: () => setShowPwModal(true) },
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

      {showPwModal && (
        <div
          onClick={() => { setShowPwModal(false); setPwError(""); setPwSuccess(""); setNewPassword(""); setConfirmPassword(""); }}
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
              <div style={{ fontSize: 16, fontWeight: 700, color: "#111827", display: "flex", alignItems: "center", gap: 8 }}>
                <i className="fa-solid fa-key" style={{ color: "#0d9488" }} />
                Update Security Credentials
              </div>
              <button 
                onClick={() => { setShowPwModal(false); setPwError(""); setPwSuccess(""); setNewPassword(""); setConfirmPassword(""); }}
                style={{ background: "none", border: "none", cursor: "pointer", width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f6")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <i className="fa-solid fa-xmark" style={{ color: "#9ca3af", fontSize: 16 }} />
              </button>
            </div>
            
            <div style={{ padding: "20px 24px" }}>
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
              <ActionButton onClick={() => { setShowPwModal(false); setPwError(""); setPwSuccess(""); setNewPassword(""); setConfirmPassword(""); }}>Cancel</ActionButton>
              <ActionButton variant="primary" onClick={handlePasswordChange} disabled={pwSaving}>
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
