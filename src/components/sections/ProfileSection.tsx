"use client";

import { useState, useRef } from "react";
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

  const [showNameModal, setShowNameModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [nameError, setNameError] = useState("");
  const [nameSuccess, setNameSuccess] = useState("");
  const [nameSaving, setNameSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const SUPABASE_URL = "https://dirqlpmlgorxxqqzqvls.supabase.co";

  // On mount, try to load saved avatar from Supabase storage
  const savedAvatarUrl = session?.user?.id
    ? `${SUPABASE_URL}/storage/v1/object/public/avatars/${session.user.id}.jpg?t=${Date.now()}`
    : null;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("File is too large. Please select an image under 2MB.");
      return;
    }

    // Instant local preview
    const localUrl = URL.createObjectURL(file);
    setAvatarUrl(localUrl);
    setAvatarLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Upload failed");
      }
      const data = await res.json();
      // Replace local preview with the persisted CDN url
      setAvatarUrl(`${SUPABASE_URL}/storage/v1/object/public/avatars/${session?.user?.id}.jpg?t=${Date.now()}`);
    } catch (err: any) {
      setAvatarUrl(null);
      alert(err.message || "Failed to upload avatar");
    } finally {
      setAvatarLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleNameChange = async () => {
    setNameError("");
    setNameSuccess("");
    if (!newName.trim() || newName.trim().length < 2) {
      setNameError("Name must be at least 2 characters.");
      return;
    }
    setNameSaving(true);
    try {
      const res = await fetch("/api/profile/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update name.");
      setNameSuccess("Name updated! It will reflect after your next sign-in.");
      // Optimistically update session display
      if (session?.user) (session.user as any).name = data.name;
    } catch (err: any) {
      setNameError(err.message || "Failed to update name.");
    } finally {
      setNameSaving(false);
    }
  };

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
          {/* Avatar circle: shows photo if available, else initials */}
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: 90, height: 90, borderRadius: 20,
              background: "linear-gradient(135deg, #0d9488, #14b8a6)",
              color: "#fff", display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 28, fontWeight: 700,
              boxShadow: "0 8px 24px rgba(22,163,74,0.3)",
              overflow: "hidden", cursor: "pointer", position: "relative",
              transition: "opacity 0.2s",
            }}
            title="Click to change profile picture"
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            {/* Initials fallback */}
            <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 0 }}>
              {userInitials}
            </span>
            {/* Avatar image — overlays initials when loaded */}
            <img
              key={avatarUrl || savedAvatarUrl}
              src={avatarUrl || savedAvatarUrl || ""}
              alt="Profile"
              style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0, zIndex: 1, display: avatarUrl ? "block" : "none" }}
              onLoad={(e) => { e.currentTarget.style.display = "block"; }}
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
            {/* Loading spinner overlay */}
            {avatarLoading && (
              <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}>
                <i className="fa-solid fa-circle-notch fa-spin" style={{ color: "#fff", fontSize: 22 }} />
              </div>
            )}
          </div>
          {/* Camera icon badge */}
          <div style={{ position: "absolute", bottom: -4, right: -4, width: 26, height: 26, borderRadius: "50%", background: "#fff", border: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 5px rgba(0,0,0,0.1)", pointerEvents: "none" }}>
            <i className="fa-solid fa-camera" style={{ color: "#4b5563", fontSize: 11 }} />
          </div>
          <input type="file" ref={fileInputRef} style={{ display: "none" }} accept="image/jpeg,image/png,image/webp" onChange={handleAvatarUpload} />
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#111827", fontFamily: "'Outfit', sans-serif" }}>{userName}</div>
          <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 2 }}>{userEmail}</div>
        </div>
        <Badge label={currentRole.charAt(0).toUpperCase() + currentRole.slice(1)} color="#0d9488" bg="#f0fdfa" />
        <button
          onClick={() => { setShowNameModal(true); setNewName(userName); setNameError(""); setNameSuccess(""); }}
          style={{ background: "#f0fdfa", border: "1px solid #ccfbf1", borderRadius: 8, padding: "8px 16px", color: "#0d9488", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}
        >
          <i className="fa-solid fa-pen" style={{ fontSize: 11 }} /> Edit Name
        </button>
      </div>
      <div style={{ flex: 1, minWidth: 300, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 16, fontFamily: "'Outfit', sans-serif", display: "flex", alignItems: "center", gap: 9 }}>
          <i className="fa-solid fa-lock" style={{ color: "#0d9488", fontSize: 16 }} />
          Security
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { label: "Change Name", icon: "fa-solid fa-pen", danger: false, onClick: () => { setShowNameModal(true); setNewName(userName); setNameError(""); setNameSuccess(""); } },
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

      {/* Change Name Modal */}
      {showNameModal && (
        <div
          onClick={() => { setShowNameModal(false); setNameError(""); setNameSuccess(""); }}
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
                <i className="fa-solid fa-pen" style={{ color: "#0d9488" }} />
                Change Display Name
              </div>
              <button 
                onClick={() => { setShowNameModal(false); setNameError(""); setNameSuccess(""); }}
                style={{ background: "none", border: "none", cursor: "pointer", width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f6")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <i className="fa-solid fa-xmark" style={{ color: "#9ca3af", fontSize: 16 }} />
              </button>
            </div>
            
            <div style={{ padding: "20px 24px" }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Display Name</label>
                <input
                  autoFocus
                  type="text"
                  placeholder="Enter your new name"
                  value={newName}
                  onChange={(e) => { setNewName(e.target.value); setNameError(""); setNameSuccess(""); }}
                  style={{ width: "100%", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 9, padding: "10px 14px", fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
                />
              </div>
              {nameError && (
                <div style={{ marginTop: 12, padding: "10px 14px", background: "#fef2f2", border: "1px solid #fee2e2", borderRadius: 8, color: "#dc2626", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                  <i className="fa-solid fa-circle-exclamation" style={{ fontSize: 13 }} />{nameError}
                </div>
              )}
              {nameSuccess && (
                <div style={{ marginTop: 12, padding: "10px 14px", background: "#f0fdfa", border: "1px solid #ccfbf1", borderRadius: 8, color: "#0d9488", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                  <i className="fa-solid fa-circle-check" style={{ fontSize: 13 }} />{nameSuccess}
                </div>
              )}
            </div>

            <div style={{ padding: "14px 24px", borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "flex-end", gap: 10, background: "#f9fafb" }}>
              <ActionButton onClick={() => { setShowNameModal(false); setNameError(""); setNameSuccess(""); }}>Cancel</ActionButton>
              <ActionButton variant="primary" onClick={handleNameChange} disabled={nameSaving || newName.trim() === userName}>
                {nameSaving
                  ? <><i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: 11 }} /> Saving…</>
                  : <><i className="fa-solid fa-floppy-disk" style={{ fontSize: 11 }} /> Save Name</>
                }
              </ActionButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
