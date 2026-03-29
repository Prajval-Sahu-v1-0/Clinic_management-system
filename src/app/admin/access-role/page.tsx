"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/hooks/useTheme";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Permission { permission_id: string; name: string; description: string; }
interface Role {
  role_id: string; role_name: string; priority: number;
  permissions: Permission[]; members: number;
}
interface UserRole { role_id: string; role_name: string; priority: number; }
interface UserWithRoles {
  user_id: string; name: string; email: string; status: string; roles: UserRole[];
}

const COLORS = ["#0d9488","#0d9488","#2563eb","#7c3aed","#d97706","#dc2626","#059669","#0891b2","#6366f1","#ec4899"];
const rc = (i: number) => COLORS[i % COLORS.length];
const initials = (n: string) => n.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function groupPerms(perms: Permission[]) {
  const groups: Record<string, Permission[]> = {};
  for (const p of perms) {
    const parts = p.name.split(" ");
    const cat = parts.length > 1 ? parts.slice(1).join(" ") : "General";
    (groups[cat] ??= []).push(p);
  }
  return groups;
}

// ─── Small Components ─────────────────────────────────────────────────────────

function Btn({ children, variant = "secondary", onClick, disabled, style }: {
  children: React.ReactNode; variant?: "primary" | "secondary" | "danger";
  onClick?: () => void; disabled?: boolean; style?: React.CSSProperties;
}) {
  const s: Record<string, React.CSSProperties> = {
    primary: { background: "linear-gradient(135deg,#0d9488,#14b8a6)", color: "#fff", border: "none", boxShadow: "0 2px 8px rgba(22,163,74,0.3)" },
    secondary: { background: "#fff", color: "#374151", border: "1px solid #e5e7eb" },
    danger: { background: "#fff", color: "#dc2626", border: "1px solid #fee2e2" },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 600,
      cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
      display: "inline-flex", alignItems: "center", gap: 6, transition: "all 0.15s",
      fontFamily: "inherit", ...s[variant], ...style,
    }}>{children}</button>
  );
}

function Toggle({ on, color, onClick }: { on: boolean; color: string; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{
      width: 40, height: 22, borderRadius: 11, background: on ? color : "#e5e7eb",
      position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0,
    }}>
      <div style={{
        width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute",
        top: 3, left: on ? 21 : 3, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      }} />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AccessRolePage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    if (sessionStatus === "unauthenticated") router.push("/");
    if (sessionStatus === "authenticated" && session?.user?.role !== "admin") router.push("/");
  }, [sessionStatus, session, router]);

  const [tab, setTab] = useState<"roles" | "members">("roles");
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPerms, setAllPerms] = useState<Permission[]>([]);
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [selRoleId, setSelRoleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPri, setEditPri] = useState(0);
  const [search, setSearch] = useState("");
  const [manageId, setManageId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [rr, ur] = await Promise.all([
        fetch("/api/admin/roles"), fetch("/api/admin/roles/users"),
      ]);
      if (!rr.ok) throw new Error((await rr.json()).error || "Failed to load roles");
      if (!ur.ok) throw new Error((await ur.json()).error || "Failed to load users");
      const rd = await rr.json();
      const ud = await ur.json();
      setRoles(rd.roles); setAllPerms(rd.permissions); setUsers(ud); setError(null);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const selRole = roles.find(r => r.role_id === selRoleId) ?? roles[0] ?? null;
  useEffect(() => {
    if (selRole) { setEditName(selRole.role_name); setEditPri(selRole.priority); }
  }, [selRole?.role_id]);

  const api = async (url: string, body?: any, method = "POST") => {
    setSaving(true);
    try {
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Request failed"); }
      await fetchData();
    } catch (e: any) { setError(e.message); } finally { setSaving(false); }
  };

  const saveName = () => selRole && api("/api/admin/roles", { role_id: selRole.role_id, role_name: editName }, "PATCH");
  const savePri = () => selRole && api("/api/admin/roles/priority", { role_id: selRole.role_id, priority: editPri });
  const togglePerm = (pid: string) => {
    if (!selRole) return;
    const has = selRole.permissions.some(p => p.permission_id === pid);
    api("/api/admin/roles/permissions", { role_id: selRole.role_id, permission_id: pid, action: has ? "remove" : "add" });
  };
  const createRole = () => {
    if (!newName.trim()) return;
    api("/api/admin/roles", { role_name: newName.trim(), priority: roles.length + 1 });
    setNewName(""); setCreating(false);
  };
  const assignRole = (uid: string, rid: string) => api("/api/admin/roles/assign", { user_id: uid, role_id: rid });
  const removeRole = (uid: string, rid: string) => api("/api/admin/roles/remove", { user_id: uid, role_id: rid });

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const manageUser = users.find(u => u.user_id === manageId);
  const color = selRole ? rc(roles.indexOf(selRole)) : "#0d9488";
  const grouped = groupPerms(allPerms);

  // ── Loading / Error States ──
  if (loading || sessionStatus === "loading") return (
    <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "#f3f4f6", fontFamily: "'Lato',sans-serif" }}>
      <div style={{ textAlign: "center", color: "#9ca3af" }}>
        <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: 28, marginBottom: 12, display: "block", color: "#0d9488" }} />
        Loading Access & Roles…
      </div>
    </div>
  );

  if (error && roles.length === 0) return (
    <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "#f3f4f6", fontFamily: "'Lato',sans-serif" }}>
      <div style={{ background: "#fef2f2", border: "1px solid #fee2e2", borderRadius: 12, padding: "24px 32px", color: "#dc2626", fontSize: 14, fontWeight: 600, maxWidth: 400, textAlign: "center" }}>
        <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: 24, display: "block", marginBottom: 10 }} />
        {error}
        <div style={{ marginTop: 16 }}><Btn variant="primary" onClick={fetchData}>Retry</Btn></div>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Lato:wght@400;700&display=swap');
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 99px; }
        input:focus { border-color: #0d9488 !important; box-shadow: 0 0 0 3px rgba(22,163,74,0.1) !important; }
        /* ═══ COMPREHENSIVE DARK MODE ═══ */
        [data-theme="dark"] { color-scheme: dark; }
        [data-theme="dark"] ::-webkit-scrollbar-thumb { background: #475569; }

        /* Cards / panels */
        [data-theme="dark"] div[style*="background: rgb(255, 255, 255)"],
        [data-theme="dark"] div[style*="background:#fff"],
        [data-theme="dark"] div[style*="background: #fff"] {
          background: #1e293b !important; border-color: #334155 !important;
        }
        [data-theme="dark"] div[style*="background: rgb(249, 250, 251)"],
        [data-theme="dark"] div[style*="background:#f9fafb"],
        [data-theme="dark"] div[style*="background: #f9fafb"],
        [data-theme="dark"] div[style*="background: rgb(243, 244, 246)"],
        [data-theme="dark"] div[style*="background:#f3f4f6"],
        [data-theme="dark"] div[style*="background: #f3f4f6"] {
          background: #162032 !important; border-color: #334155 !important;
        }

        /* Main text */
        [data-theme="dark"] div[style*="color: rgb(17, 24, 39)"],
        [data-theme="dark"] div[style*="color:#111827"],
        [data-theme="dark"] div[style*="color: #111827"],
        [data-theme="dark"] span[style*="color: rgb(17, 24, 39)"],
        [data-theme="dark"] span[style*="color:#111827"],
        [data-theme="dark"] span[style*="color: #111827"] {
          color: #e2e8f0 !important;
        }
        /* Muted text */
        [data-theme="dark"] div[style*="color: rgb(107, 114, 128)"],
        [data-theme="dark"] div[style*="color:#6b7280"],
        [data-theme="dark"] div[style*="color: #6b7280"],
        [data-theme="dark"] span[style*="color: rgb(107, 114, 128)"],
        [data-theme="dark"] span[style*="color:#6b7280"],
        [data-theme="dark"] span[style*="color: #6b7280"] {
          color: #94a3b8 !important;
        }
        /* Subtle text */
        [data-theme="dark"] div[style*="color: rgb(156, 163, 175)"],
        [data-theme="dark"] div[style*="color:#9ca3af"],
        [data-theme="dark"] div[style*="color: #9ca3af"],
        [data-theme="dark"] span[style*="color: rgb(156, 163, 175)"],
        [data-theme="dark"] span[style*="color:#9ca3af"],
        [data-theme="dark"] span[style*="color: #9ca3af"] {
          color: #64748b !important;
        }

        /* Borders */
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

        /* Tables */
        [data-theme="dark"] thead tr { background: #162032 !important; border-color: #1e293b !important; }
        [data-theme="dark"] thead th { color: #64748b !important; }
        [data-theme="dark"] tbody tr { border-color: #1e293b !important; }
        [data-theme="dark"] tbody tr:hover { background: #1a2740 !important; }
        [data-theme="dark"] td { border-color: #1e293b !important; }
        [data-theme="dark"] td[style*="color: rgb(17, 24, 39)"],
        [data-theme="dark"] td[style*="color:#111827"],
        [data-theme="dark"] td[style*="color: #111827"] { color: #e2e8f0 !important; }
        [data-theme="dark"] td[style*="color: rgb(107, 114, 128)"],
        [data-theme="dark"] td[style*="color:#6b7280"],
        [data-theme="dark"] td[style*="color: #6b7280"] { color: #94a3b8 !important; }

        /* Inputs */
        [data-theme="dark"] input, [data-theme="dark"] select {
          background: #1e293b !important; border-color: #334155 !important; color: #e2e8f0 !important;
        }
        [data-theme="dark"] input::placeholder { color: #64748b !important; }

        /* Buttons */
        [data-theme="dark"] button[style*="background: rgb(255, 255, 255)"],
        [data-theme="dark"] button[style*="background:#fff"],
        [data-theme="dark"] button[style*="background: #fff"] {
          background: #1e293b !important; border-color: #334155 !important; color: #cbd5e1 !important;
        }

        /* Modals */
        [data-theme="dark"] div[style*="background: rgba(0, 0, 0"] {
          background: rgba(0,0,0,0.6) !important;
        }

        /* Permission items (light teal bg) */
        [data-theme="dark"] div[style*="background: rgb(240, 253, 250)"],
        [data-theme="dark"] div[style*="background:#f0fdfa"],
        [data-theme="dark"] div[style*="background: #f0fdfa"] {
          background: #0c2a22 !important; border-color: #134e3a !important;
        }

        /* Error alert */
        [data-theme="dark"] div[style*="background: rgb(254, 242, 242)"],
        [data-theme="dark"] div[style*="background:#fef2f2"],
        [data-theme="dark"] div[style*="background: #fef2f2"] {
          background: #350a0a !important; border-color: #7f1d1d !important;
        }

        /* Toggle button */
        .ar-theme-btn {
          background: none; border: 1px solid #e5e7eb; border-radius: 8px;
          width: 34px; height: 34px; display: inline-flex; align-items: center;
          justify-content: center; cursor: pointer; transition: all 0.2s; flex-shrink: 0;
        }
        [data-theme="dark"] .ar-theme-btn { border-color: #334155; background: #1e293b; }
        .ar-theme-btn:hover { transform: scale(1.1); }

      `}</style>

      <div data-theme={isDark ? "dark" : "light"} style={{ display: "flex", flexDirection: "column", height: "100vh", background: isDark ? "#0f172a" : "#f3f4f6", fontFamily: "'Lato',sans-serif", color: isDark ? "#e2e8f0" : "#111827", transition: "background 0.2s, color 0.2s" }}>

        {/* ═══ Header ═══ */}
        <header style={{ height: 60, padding: "0 28px", background: isDark ? "#1e293b" : "#fff", borderBottom: `1px solid ${isDark ? "#334155" : "#e5e7eb"}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, transition: "background 0.2s" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <a href="/admin" style={{ color: "#9ca3af", fontSize: 13, textDecoration: "none", display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
              <i className="fa-solid fa-arrow-left" style={{ fontSize: 11 }} /> Admin
            </a>
            <span style={{ color: isDark ? "#475569" : "#d1d5db" }}>/</span>
            <h1 style={{ fontSize: 17, fontWeight: 700, fontFamily: "'Outfit',sans-serif", color: isDark ? "#e2e8f0" : "#111827" }}>Access &amp; Roles</h1>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {(["roles", "members"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                background: tab === t ? (isDark ? "#0c2a22" : "#f0fdfa") : "transparent",
                border: tab === t ? `1px solid ${isDark ? "#134e3a" : "#ccfbf1"}` : "1px solid transparent",
                borderRadius: 8, padding: "6px 16px", fontSize: 13, fontWeight: tab === t ? 700 : 500,
                color: tab === t ? (isDark ? "#2dd4bf" : "#0f766e") : (isDark ? "#94a3b8" : "#6b7280"),
                cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
              }}>
                <i className={t === "roles" ? "fa-solid fa-shield-halved" : "fa-solid fa-users"} style={{ marginRight: 6, fontSize: 12 }} />
                {t === "roles" ? "Roles & Permissions" : "Members"}
              </button>
            ))}
            {/* Dark mode toggle */}
            <button
              onClick={toggleTheme}
              className="ar-theme-btn"
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? (
                <i className="fa-solid fa-sun" style={{ color: "#f59e0b", fontSize: 14 }} />
              ) : (
                <i className="fa-solid fa-moon" style={{ color: "#6b7280", fontSize: 14 }} />
              )}
            </button>
          </div>
        </header>

        {error && (
          <div style={{ margin: "12px 28px 0", padding: "10px 16px", background: "#fef2f2", border: "1px solid #fee2e2", borderRadius: 8, color: "#dc2626", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
            <i className="fa-solid fa-circle-exclamation" /> {error}
            <button onClick={() => setError(null)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#dc2626" }}><i className="fa-solid fa-xmark" /></button>
          </div>
        )}

        {/* ═══ ROLES TAB ═══ */}
        {tab === "roles" && (
          <div style={{ flex: 1, display: "flex", gap: 18, padding: "20px 28px", overflow: "hidden" }}>

            {/* Role List Sidebar */}
            <div style={{ width: 240, flexShrink: 0, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid #f3f4f6" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em" }}>Roles — {roles.length}</div>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: 6 }}>
                {roles.map((r, i) => (
                  <button key={r.role_id} onClick={() => setSelRoleId(r.role_id)} style={{
                    width: "100%", background: selRole?.role_id === r.role_id ? rc(i) + "10" : "transparent",
                    border: selRole?.role_id === r.role_id ? `1px solid ${rc(i)}30` : "1px solid transparent",
                    borderRadius: 9, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10,
                    cursor: "pointer", textAlign: "left", marginBottom: 2, fontFamily: "inherit", transition: "all 0.15s",
                  }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: rc(i), flexShrink: 0 }} />
                    <div style={{ flex: 1, overflow: "hidden" }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.role_name}</div>
                      <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                        {r.members} member{r.members !== 1 ? "s" : ""} · P{r.priority}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <div style={{ padding: 8, borderTop: "1px solid #f3f4f6" }}>
                {creating ? (
                  <div style={{ display: "flex", gap: 6 }}>
                    <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Role name…"
                      onKeyDown={e => e.key === "Enter" && createRole()}
                      style={{ flex: 1, border: "1px solid #e5e7eb", borderRadius: 7, padding: "7px 10px", fontSize: 12, outline: "none", fontFamily: "inherit" }} autoFocus />
                    <Btn variant="primary" onClick={createRole} disabled={saving}><i className="fa-solid fa-check" style={{ fontSize: 10 }} /></Btn>
                    <Btn onClick={() => { setCreating(false); setNewName(""); }}><i className="fa-solid fa-xmark" style={{ fontSize: 10 }} /></Btn>
                  </div>
                ) : (
                  <Btn variant="primary" onClick={() => setCreating(true)} style={{ width: "100%", justifyContent: "center" }}>
                    <i className="fa-solid fa-plus" style={{ fontSize: 11 }} /> Create Role
                  </Btn>
                )}
              </div>
            </div>

            {/* Role Editor */}
            {selRole && (
              <div style={{ flex: 1, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                {/* Editor Header */}
                <div style={{ padding: "16px 24px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", gap: 14, background: "#f9fafb" }}>
                  <span style={{ width: 14, height: 14, borderRadius: "50%", background: color, boxShadow: `0 0 0 3px ${color}30` }} />
                  <input value={editName} onChange={e => setEditName(e.target.value)}
                    style={{ background: "transparent", border: "none", outline: "none", fontSize: 18, fontWeight: 700, color: "#111827", fontFamily: "'Outfit',sans-serif", flex: 1 }} />
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <label style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>Priority</label>
                    <input type="number" value={editPri} onChange={e => setEditPri(Number(e.target.value))}
                      style={{ width: 56, border: "1px solid #e5e7eb", borderRadius: 7, padding: "5px 8px", fontSize: 13, textAlign: "center", outline: "none", fontFamily: "inherit" }} />
                    <Btn variant="primary" onClick={() => { saveName(); savePri(); }} disabled={saving}>
                      {saving ? <><i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: 11 }} /> Saving</> : <><i className="fa-solid fa-floppy-disk" style={{ fontSize: 11 }} /> Save</>}
                    </Btn>
                  </div>
                </div>

                {/* Permissions */}
                <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>
                    Permissions — {selRole.permissions.length} / {allPerms.length} enabled
                  </div>
                  {Object.entries(grouped).map(([cat, perms]) => (
                    <div key={cat} style={{ marginBottom: 22 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, display: "flex", alignItems: "center", gap: 7 }}>
                        <i className="fa-solid fa-layer-group" style={{ color: "#0d9488", fontSize: 11 }} /> {cat}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        {perms.map(p => {
                          const on = selRole.permissions.some(rp => rp.permission_id === p.permission_id);
                          return (
                            <div key={p.permission_id} onClick={() => togglePerm(p.permission_id)} style={{
                              display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px",
                              background: on ? color + "08" : "#f9fafb", border: `1px solid ${on ? color + "40" : "#f3f4f6"}`,
                              borderRadius: 9, cursor: "pointer", transition: "all 0.15s",
                            }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <i className={on ? "fa-solid fa-circle-check" : "fa-regular fa-circle"} style={{ color: on ? color : "#d1d5db", fontSize: 15 }} />
                                <div>
                                  <span style={{ fontSize: 13, fontWeight: 500, color: on ? "#111827" : "#6b7280" }}>{p.name}</span>
                                  {p.description && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{p.description}</div>}
                                </div>
                              </div>
                              <Toggle on={on} color={color} onClick={() => {}} />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  {allPerms.length === 0 && (
                    <div style={{ textAlign: "center", color: "#9ca3af", padding: 40, fontSize: 14 }}>
                      <i className="fa-solid fa-lock" style={{ fontSize: 24, display: "block", marginBottom: 10 }} />
                      No permissions defined in the database yet.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ MEMBERS TAB ═══ */}
        {tab === "members" && (
          <div style={{ flex: 1, padding: "20px 28px", overflowY: "auto" }}>
            <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
              <div style={{ position: "relative", flex: 1, maxWidth: 380 }}>
                <i className="fa-solid fa-magnifying-glass" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: 13 }} />
                <input placeholder="Search users…" value={search} onChange={e => setSearch(e.target.value)}
                  style={{ width: "100%", border: "1px solid #e5e7eb", borderRadius: 9, padding: "9px 14px 9px 36px", fontSize: 13, outline: "none", fontFamily: "inherit", background: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }} />
              </div>
              <div style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600 }}>{filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""}</div>
            </div>

            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #f3f4f6", background: "#f9fafb" }}>
                    {["User", "Email", "Roles", "Actions"].map(h => (
                      <th key={h} style={{ padding: "11px 18px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr><td colSpan={4} style={{ padding: 32, textAlign: "center", color: "#9ca3af", fontSize: 14 }}>No users found</td></tr>
                  ) : filteredUsers.map((u, idx) => (
                    <tr key={u.user_id} style={{ borderBottom: idx < filteredUsers.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                      <td style={{ padding: "12px 18px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: 9, background: "#0d948818", color: "#0d9488", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, border: "1px solid #0d948833" }}>{initials(u.name)}</div>
                          <span style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>{u.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 18px", fontSize: 13, color: "#6b7280" }}>{u.email}</td>
                      <td style={{ padding: "12px 18px" }}>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {u.roles.length === 0 && <span style={{ fontSize: 11, color: "#9ca3af", fontStyle: "italic" }}>No roles</span>}
                          {u.roles.map((r, ri) => (
                            <span key={r.role_id} style={{
                              background: rc(roles.findIndex(x => x.role_id === r.role_id)) + "18",
                              color: rc(roles.findIndex(x => x.role_id === r.role_id)),
                              border: `1px solid ${rc(roles.findIndex(x => x.role_id === r.role_id))}33`,
                              borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700,
                            }}>{r.role_name}</span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: "12px 18px" }}>
                        <Btn onClick={() => setManageId(u.user_id)}>
                          <i className="fa-solid fa-pen-to-square" style={{ fontSize: 11 }} /> Manage
                        </Btn>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ═══ Manage Roles Modal ═══ */}
      {manageUser && (
        <div onClick={() => setManageId(null)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex",
          alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(3px)",
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "#fff", borderRadius: 16, width: 440, maxWidth: "92vw",
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)", overflow: "hidden",
          }}>
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "#0d948818", color: "#0d9488", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, border: "1px solid #0d948833" }}>{initials(manageUser.name)}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, fontFamily: "'Outfit',sans-serif", color: "#111827" }}>{manageUser.name}</div>
                  <div style={{ fontSize: 12, color: "#9ca3af" }}>{manageUser.email}</div>
                </div>
              </div>
              <button onClick={() => setManageId(null)} style={{ background: "none", border: "none", cursor: "pointer", width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <i className="fa-solid fa-xmark" style={{ color: "#9ca3af", fontSize: 16 }} />
              </button>
            </div>
            <div style={{ padding: "16px 24px", maxHeight: 400, overflowY: "auto" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Assign Roles</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {roles.map((r, i) => {
                  const has = manageUser.roles.some(ur => ur.role_id === r.role_id);
                  return (
                    <div key={r.role_id} onClick={() => has ? removeRole(manageUser.user_id, r.role_id) : assignRole(manageUser.user_id, r.role_id)}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px",
                        background: has ? rc(i) + "08" : "#f9fafb", border: `1px solid ${has ? rc(i) + "40" : "#f3f4f6"}`,
                        borderRadius: 9, cursor: "pointer", transition: "all 0.15s",
                      }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ width: 10, height: 10, borderRadius: "50%", background: rc(i) }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: has ? "#111827" : "#6b7280" }}>{r.role_name}</span>
                        <span style={{ fontSize: 11, color: "#9ca3af" }}>P{r.priority}</span>
                      </div>
                      <Toggle on={has} color={rc(i)} onClick={() => {}} />
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{ padding: "14px 24px", borderTop: "1px solid #f3f4f6", background: "#f9fafb", display: "flex", justifyContent: "flex-end" }}>
              <Btn onClick={() => setManageId(null)}>Done</Btn>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
