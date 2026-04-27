"use client";

import { useState, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { ActionButton } from "@/components/DashboardShared";
import { useUsers, useAppointments, usePrescriptions } from "@/hooks/useAdminData";
import type { Appointment, Prescription } from "@/hooks/types";
import { T } from "./themeTokens";

/* ── tiny helpers ─────────────────────────────────────────── */
const Card = ({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{
    background: T.cardBg, border: `1px solid var(--theme-border)`,
    borderRadius: 16, backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
    boxShadow: "0 4px 24px rgba(0,0,0,0.12)", ...style,
  }}>{children}</div>
);

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 0", borderBottom: `1px solid var(--theme-border-soft)` }}>
    <span style={{ fontSize: 12, color: T.text3, fontWeight: 600, minWidth: 130, paddingTop: 1 }}>{label}</span>
    <span style={{ fontSize: 13, color: T.text1, fontWeight: 500, lineHeight: 1.5 }}>{value}</span>
  </div>
);

const SectionTitle = ({ icon, children, onEdit }: { icon: string; children: React.ReactNode; onEdit?: () => void }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15, fontWeight: 700, color: T.text1 }}>
      <i className={icon} style={{ color: "var(--sage)", fontSize: 14 }} />
      {children}
    </div>
    {onEdit && (
      <button onClick={onEdit} style={{ background: "none", border: "none", cursor: "pointer", color: T.text3, padding: "4px 6px", borderRadius: 6, transition: "color 0.15s" }}
        onMouseEnter={e => (e.currentTarget.style.color = "var(--sage)")}
        onMouseLeave={e => (e.currentTarget.style.color = T.text3)}>
        <i className="fa-solid fa-pen" style={{ fontSize: 13 }} />
      </button>
    )}
  </div>
);

/* ── Modal shell ──────────────────────────────────────────── */
const Modal = ({ title, icon, onClose, children, footer }: { title: string; icon: string; onClose: () => void; children: React.ReactNode; footer: React.ReactNode }) => (
  <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "var(--theme-modal-overlay)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(6px)" }}>
    <div onClick={e => e.stopPropagation()} style={{ background: "var(--theme-modal-bg)", border: `1px solid var(--theme-modal-border)`, borderRadius: 16, width: 420, maxWidth: "92vw", boxShadow: "var(--theme-modal-shadow)", overflow: "hidden", backdropFilter: "blur(20px)" }}>
      <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid var(--theme-modal-header-border)`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.text1, display: "flex", alignItems: "center", gap: 8 }}>
          <i className={icon} style={{ color: "var(--sage)" }} />{title}
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}
          onMouseEnter={e => (e.currentTarget.style.background = T.closeBtnHover)}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
          <i className="fa-solid fa-xmark" style={{ color: T.text3, fontSize: 15 }} />
        </button>
      </div>
      <div style={{ padding: "20px 24px" }}>{children}</div>
      <div style={{ padding: "14px 24px", borderTop: `1px solid var(--theme-modal-header-border)`, display: "flex", justifyContent: "flex-end", gap: 10, background: "var(--theme-modal-footer-bg)" }}>{footer}</div>
    </div>
  </div>
);

const inputSt: React.CSSProperties = { width: "100%", background: T.inputBg, border: `1px solid var(--theme-input-border)`, borderRadius: 9, padding: "10px 14px", fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box", color: T.text1 };
const labelSt: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: T.textLabel, display: "block", marginBottom: 5 };

/* ── Status badge colour ──────────────────────────────────── */
const statusColor = (s: string) => {
  switch (s.toLowerCase()) {
    case "confirmed": case "scheduled": return { bg: "var(--theme-success-bg)", color: "var(--theme-success-color)", border: "var(--theme-success-border)" };
    case "completed":  return { bg: "var(--theme-info-bg)",    color: "var(--theme-info-color)",    border: "var(--theme-info-border)"    };
    case "cancelled":  return { bg: "var(--theme-danger-bg)",  color: "var(--theme-danger-color)",  border: "var(--theme-danger-border)"  };
    default:           return { bg: "var(--theme-chip-bg)",    color: "var(--theme-chip-color)",    border: "var(--theme-border-soft)"    };
  }
};

const FILES: never[] = [];


/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
export default function ProfileSection({ currentRole }: { currentRole: string }) {
  const { data: session } = useSession();
  const { resetPassword } = useUsers();
  const { data: appointments, loading: aptsLoading } = useAppointments();
  const { data: prescriptions, loading: rxLoading } = usePrescriptions();

  /* classify appointments ──────────────────────────────────── */
  const now = new Date();
  const futureAppts: Appointment[] = (appointments ?? []).filter(
    a => new Date(a.date + "T" + a.time) > now && a.status !== "cancelled" && a.status !== "completed"
  );
  const pastAppts: Appointment[] = (appointments ?? []).filter(
    a => new Date(a.date + "T" + a.time) <= now || a.status === "completed"
  );

  /* classify prescriptions ─────────────────────────────────── */
  const activePrescriptions: Prescription[] = (prescriptions ?? []).filter(
    p => p.status === "active"
  );
  const pastPrescriptions: Prescription[] = (prescriptions ?? []).filter(
    p => p.status !== "active"
  );
  const allPrescriptions: Prescription[] = prescriptions ?? [];

  /* password modal */
  const [showPwModal, setShowPwModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  /* name modal */
  const [showNameModal, setShowNameModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [nameError, setNameError] = useState("");
  const [nameSuccess, setNameSuccess] = useState("");
  const [nameSaving, setNameSaving] = useState(false);

  /* avatar */
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  /* appointments tab */
  const [apptTab, setApptTab] = useState<"future" | "past" | "treatments">("future");

  const SUPABASE_URL = "https://dirqlpmlgorxxqqzqvls.supabase.co";
  const savedAvatarUrl = session?.user?.id
    ? `${SUPABASE_URL}/storage/v1/object/public/avatars/${session.user.id}.jpg?t=${Date.now()}`
    : null;

  const userName = session?.user?.name ?? "User";
  const userEmail = session?.user?.email ?? "";
  const userInitials = userName.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();

  /* ── handlers ──────────────────────────────────────────── */
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert("File too large (max 2 MB)."); return; }
    setAvatarUrl(URL.createObjectURL(file));
    setAvatarLoading(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const res = await fetch("/api/profile/avatar", { method: "POST", body: fd });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Upload failed");
      setAvatarUrl(`${SUPABASE_URL}/storage/v1/object/public/avatars/${session?.user?.id}.jpg?t=${Date.now()}`);
    } catch (err: any) { setAvatarUrl(null); alert(err.message || "Upload failed"); }
    finally { setAvatarLoading(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
  };

  const handleNameChange = async () => {
    setNameError(""); setNameSuccess("");
    if (!newName.trim() || newName.trim().length < 2) { setNameError("At least 2 characters."); return; }
    setNameSaving(true);
    try {
      const res = await fetch("/api/profile/update", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newName.trim() }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed.");
      setNameSuccess("Updated! Reflects after next sign-in.");
      if (session?.user) (session.user as any).name = data.name;
    } catch (err: any) { setNameError(err.message || "Failed."); }
    finally { setNameSaving(false); }
  };

  const handlePasswordChange = async () => {
    setPwError(""); setPwSuccess("");
    if (!newPassword) { setPwError("Enter a new password."); return; }
    if (newPassword.length < 6) { setPwError("Min 6 characters."); return; }
    if (newPassword !== confirmPassword) { setPwError("Passwords do not match."); return; }
    if (!session?.user?.id) { setPwError("Unable to identify user."); return; }
    setPwSaving(true);
    try {
      await resetPassword(session.user.id as string, newPassword);
      setPwSuccess("Password updated."); setNewPassword(""); setConfirmPassword("");
    } catch (err: any) { setPwError(err.message || "Failed."); }
    finally { setPwSaving(false); }
  };

  const closePw = () => { setShowPwModal(false); setPwError(""); setPwSuccess(""); setNewPassword(""); setConfirmPassword(""); };
  const closeName = () => { setShowNameModal(false); setNameError(""); setNameSuccess(""); };

  /* ── Registration date ─────────────────────────────────── */
  const regDate = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const apptTabStyle = (t: string): React.CSSProperties => ({
    background: "none", border: "none", cursor: "pointer", fontFamily: "inherit",
    fontSize: 13, fontWeight: 600, padding: "8px 2px", marginRight: 24,
    color: apptTab === t ? "var(--sage)" : T.text3,
    borderBottom: apptTab === t ? "2px solid var(--sage)" : "2px solid transparent",
    transition: "all 0.15s",
  });

  const shownAppts = apptTab === "future" ? futureAppts : pastAppts;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── TOP ROW ──────────────────────────────────────────── */}
      <div className="profile-top-row" style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>

        {/* Avatar card */}
        <Card style={{ padding: 28, display: "flex", flexDirection: "column", alignItems: "center", gap: 14, flex: "0 0 200px", minWidth: 180 }}>
          <div style={{ position: "relative" }}>
            <div
              onClick={() => fileInputRef.current?.click()}
              title="Click to change photo"
              style={{ width: 96, height: 96, borderRadius: "50%", background: "var(--theme-icon-bg)", color: "var(--theme-icon-color)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 700, overflow: "hidden", cursor: "pointer", position: "relative", boxShadow: "0 0 0 4px var(--theme-border)", transition: "opacity 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >
              <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 0 }}>{userInitials}</span>
              <img key={avatarUrl || savedAvatarUrl} src={avatarUrl || savedAvatarUrl || ""} alt="Avatar"
                style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0, zIndex: 1, display: avatarUrl ? "block" : "none" }}
                onLoad={e => { e.currentTarget.style.display = "block"; }}
                onError={e => { e.currentTarget.style.display = "none"; }} />
              {avatarLoading && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}><i className="fa-solid fa-circle-notch fa-spin" style={{ color: "#fff", fontSize: 20 }} /></div>}
            </div>
            <div style={{ position: "absolute", bottom: 0, right: 0, width: 26, height: 26, borderRadius: "50%", background: "var(--theme-card-bg)", border: `1px solid var(--theme-border)`, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
              <i className="fa-solid fa-camera" style={{ color: T.text2, fontSize: 10 }} />
            </div>
            <input type="file" ref={fileInputRef} style={{ display: "none" }} accept="image/*" onChange={handleAvatarUpload} />
          </div>

          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.text1 }}>{userName}</div>
            <div style={{ fontSize: 12, color: "var(--sage)", fontWeight: 600, marginTop: 3 }}>{userEmail}</div>
          </div>

          <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 12px", borderRadius: 99, background: "var(--theme-chip-bg)", color: "var(--theme-chip-color)", textTransform: "capitalize" }}>
            {currentRole}
          </span>
        </Card>

        {/* General Information */}
        <Card style={{ padding: 22, flex: 1, minWidth: 260 }}>
          <SectionTitle icon="fa-solid fa-circle-info" onEdit={() => { setShowNameModal(true); setNewName(userName); setNameError(""); setNameSuccess(""); }}>
            General information
          </SectionTitle>
          <div style={{ marginTop: 10 }}>
            <InfoRow label="Display Name" value={userName} />
            <InfoRow label="Email" value={userEmail} />
            <InfoRow label="Role" value={currentRole.charAt(0).toUpperCase() + currentRole.slice(1)} />
            <InfoRow label="Registration Date" value={regDate} />
          </div>
        </Card>

        {/* Security / Anamnesis */}
        <Card style={{ padding: 22, flex: "0 0 260px", minWidth: 240 }}>
          <SectionTitle icon="fa-solid fa-shield-halved">Security</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 12 }}>
            {[
              { label: "Change Password", icon: "fa-solid fa-key", onClick: () => setShowPwModal(true) },
              { label: "Two-Factor Auth", icon: "fa-solid fa-mobile-screen-button", onClick: () => alert("2FA coming soon") },
              { label: "Sign Out Everywhere", icon: "fa-solid fa-right-from-bracket", danger: true, onClick: () => signOut({ callbackUrl: "/" }) },
            ].map(item => (
              <button key={item.label} onClick={item.onClick} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 13px",
                background: item.danger ? "var(--theme-danger-bg)" : "var(--theme-filter-bg)",
                border: `1px solid ${item.danger ? "var(--theme-danger-border)" : "var(--theme-border-soft)"}`,
                borderRadius: 9, cursor: "pointer", fontFamily: "inherit",
                fontSize: 12, fontWeight: 600,
                color: item.danger ? "var(--theme-danger-color)" : T.text2,
                transition: "all 0.15s", textAlign: "left",
              }}
                onMouseEnter={e => { if (!item.danger) (e.currentTarget as HTMLElement).style.background = "var(--theme-filter-active-bg)"; }}
                onMouseLeave={e => { if (!item.danger) (e.currentTarget as HTMLElement).style.background = "var(--theme-filter-bg)"; }}
              >
                <i className={item.icon} style={{ fontSize: 13, width: 14, color: item.danger ? "var(--theme-danger-color)" : T.text3 }} />
                {item.label}
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* ── BOTTOM ROW ───────────────────────────────────── */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>

        {/* Appointments / Treatments card — full width */}
        <Card style={{ flex: 1, minWidth: 320, padding: 22 }}>
          {/* Tab bar */}
          <div className="tab-scroll" style={{ display: "flex", borderBottom: `1px solid var(--theme-border-soft)`, marginBottom: 16 }}>
            <button style={apptTabStyle("future")} onClick={() => setApptTab("future")}>
              Future visits ({futureAppts.length})
            </button>
            <button style={apptTabStyle("past")} onClick={() => setApptTab("past")}>
              Past visits ({pastAppts.length})
            </button>
            <button style={apptTabStyle("treatments")} onClick={() => setApptTab("treatments")}>
              Treatments ({allPrescriptions.length})
            </button>
          </div>

          {/* ── Treatments tab → prescriptions ── */}
          {apptTab === "treatments" ? (
            rxLoading ? (
              <div style={{ textAlign: "center", color: T.text3, padding: "32px 0" }}>
                <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: 20, display: "block", marginBottom: 8, color: "var(--sage)" }} />
                Loading prescriptions…
              </div>
            ) : allPrescriptions.length === 0 ? (
              <div style={{ textAlign: "center", color: T.text3, padding: "32px 0", fontSize: 13 }}>
                <i className="fa-solid fa-pills" style={{ fontSize: 22, display: "block", marginBottom: 8 }} />
                No prescriptions found
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {allPrescriptions.map((p) => {
                  const isActive = p.status === "active";
                  const sc = isActive
                    ? { bg: "var(--theme-success-bg)", color: "var(--theme-success-color)", border: "var(--theme-success-border)" }
                    : { bg: "var(--theme-chip-bg)",    color: "var(--theme-chip-color)",    border: "var(--theme-border-soft)"    };
                  const prescribed = p.date ? new Date(p.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";
                  const endDate = p.dosageEndDate ? new Date(p.dosageEndDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";
                  return (
                    <div key={p.id} style={{
                      display: "flex", gap: 16, alignItems: "flex-start",
                      background: "var(--theme-filter-bg)", borderRadius: 12,
                      padding: "14px 16px",
                      borderLeft: `3px solid ${isActive ? "var(--sage)" : "var(--theme-border)"}`,
                    }}>
                      <div style={{ flexShrink: 0, width: 36, height: 36, borderRadius: 10, background: isActive ? "var(--theme-success-bg)" : "var(--theme-chip-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <i className="fa-solid fa-pills" style={{ fontSize: 16, color: isActive ? "var(--theme-success-color)" : "var(--theme-chip-color)" }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>{p.medication}</div>
                        <div style={{ fontSize: 12, color: T.text3, marginTop: 2 }}>Dosage: <span style={{ color: T.text2, fontWeight: 500 }}>{p.dosage}</span></div>
                        <div style={{ fontSize: 11, color: T.text3, marginTop: 3 }}>
                          Prescribed: {prescribed}
                          {p.dosageEndDate && <span style={{ marginLeft: 12 }}>Until: {endDate}</span>}
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                          {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                        </span>
                        <div style={{ fontSize: 11, color: T.text3 }}>{p.doctor}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )

          ) : (
            /* ── Appointments tabs ── */
            aptsLoading ? (
              <div style={{ textAlign: "center", color: T.text3, padding: "32px 0" }}>
                <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: 20, display: "block", marginBottom: 8, color: "var(--sage)" }} />
                Loading appointments…
              </div>
            ) : shownAppts.length === 0 ? (
              <div style={{ textAlign: "center", color: T.text3, padding: "32px 0", fontSize: 13 }}>
                <i className="fa-regular fa-calendar" style={{ fontSize: 22, display: "block", marginBottom: 8 }} />
                No {apptTab === "future" ? "upcoming" : "past"} appointments
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {shownAppts.map((a) => {
                  const sc = statusColor(a.status);
                  const apptDate = new Date(a.date + "T" + a.time);
                  const dateStr = apptDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
                  const timeStr = apptDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
                  return (
                    <div key={a.id} style={{
                      display: "flex", gap: 16, alignItems: "flex-start",
                      background: "var(--theme-filter-bg)", borderRadius: 12,
                      padding: "14px 16px", borderLeft: "3px solid var(--sage)",
                    }}>
                      <div style={{ minWidth: 90 }}>
                        <div style={{ fontSize: 10, color: T.text3, fontWeight: 600 }}>{timeStr}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.text1, marginTop: 2 }}>{dateStr}</div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, color: T.text3, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Service:</div>
                        <div style={{ fontSize: 13, color: T.text1, fontWeight: 500, marginTop: 1 }}>{a.type || "General"}</div>
                      </div>
                      <div style={{ minWidth: 90 }}>
                        <div style={{ fontSize: 10, color: T.text3, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Doctor:</div>
                        <div style={{ fontSize: 12, color: "var(--sage)", fontWeight: 600, marginTop: 1 }}>{a.doctor}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: T.text3, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Status:</div>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                          {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </Card>

      </div>

      {/* ── MODALS ───────────────────────────────────────── */}
      {showPwModal && (
        <Modal title="Update Password" icon="fa-solid fa-key" onClose={closePw}
          footer={<>
            <ActionButton onClick={closePw}>Cancel</ActionButton>
            <ActionButton variant="primary" onClick={handlePasswordChange} disabled={pwSaving}>
              {pwSaving ? <><i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: 11 }} /> Saving…</> : <><i className="fa-solid fa-floppy-disk" style={{ fontSize: 11 }} /> Update</>}
            </ActionButton>
          </>}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div><label style={labelSt}>New Password</label><input type="password" style={inputSt} placeholder="Min 6 characters" value={newPassword} onChange={e => { setNewPassword(e.target.value); setPwError(""); }} /></div>
            <div><label style={labelSt}>Confirm Password</label><input type="password" style={inputSt} placeholder="Re-enter password" value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setPwError(""); }} /></div>
          </div>
          {pwError && <div style={{ marginTop: 12, padding: "9px 13px", background: T.errorBg, border: `1px solid ${T.errorBorder}`, borderRadius: 8, color: T.errorColor, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 7 }}><i className="fa-solid fa-circle-exclamation" />{pwError}</div>}
          {pwSuccess && <div style={{ marginTop: 12, padding: "9px 13px", background: T.successBg, border: `1px solid ${T.successBorder}`, borderRadius: 8, color: T.successColor, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 7 }}><i className="fa-solid fa-circle-check" />{pwSuccess}</div>}
        </Modal>
      )}

      {showNameModal && (
        <Modal title="Change Display Name" icon="fa-solid fa-pen" onClose={closeName}
          footer={<>
            <ActionButton onClick={closeName}>Cancel</ActionButton>
            <ActionButton variant="primary" onClick={handleNameChange} disabled={nameSaving || newName.trim() === userName}>
              {nameSaving ? <><i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: 11 }} /> Saving…</> : <><i className="fa-solid fa-floppy-disk" style={{ fontSize: 11 }} /> Save</>}
            </ActionButton>
          </>}>
          <div><label style={labelSt}>Display Name</label><input autoFocus type="text" style={inputSt} placeholder="Your name" value={newName} onChange={e => { setNewName(e.target.value); setNameError(""); }} /></div>
          {nameError && <div style={{ marginTop: 12, padding: "9px 13px", background: T.errorBg, border: `1px solid ${T.errorBorder}`, borderRadius: 8, color: T.errorColor, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 7 }}><i className="fa-solid fa-circle-exclamation" />{nameError}</div>}
          {nameSuccess && <div style={{ marginTop: 12, padding: "9px 13px", background: T.successBg, border: `1px solid ${T.successBorder}`, borderRadius: 8, color: T.successColor, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 7 }}><i className="fa-solid fa-circle-check" />{nameSuccess}</div>}
        </Modal>
      )}
    </div>
  );
}
