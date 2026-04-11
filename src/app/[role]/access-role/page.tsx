"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useTheme } from "@/hooks/useTheme";
import { getPermissions } from "@/components/DashboardShared";

// Types

interface Permission { permission_id: string; name: string; description: string; }
interface Role {
  role_id: string; role_name: string; priority: number;
  permissions: Permission[]; members: number;
}
interface UserRole { role_id: string; role_name: string; priority: number; }
interface UserWithRoles {
  user_id: string; name: string; email: string; status: string; roles: UserRole[];
}

// Role accent colours — mono-friendly but distinct for differentiation
const COLORS = ["#1a1a1a","#444444","#2563eb","#7c3aed","#d97706","#dc2626","#059669","#0891b2","#6366f1","#ec4899"];
const rc = (i: number) => COLORS[i % COLORS.length];
const initials = (n: string) => n.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

// Helpers

const SS_KEY = "ar_pending_edits";

interface PendingEdits {
  roleId: string;
  name?: string;
  priority?: number;
  addPerms: string[];
  removePerms: string[];
}

function readPending(): PendingEdits | null {
  try { const v = sessionStorage.getItem(SS_KEY); return v ? JSON.parse(v) : null; } catch { return null; }
}
function writePending(p: PendingEdits) {
  try { sessionStorage.setItem(SS_KEY, JSON.stringify(p)); } catch {}
}
function clearPending() {
  try { sessionStorage.removeItem(SS_KEY); } catch {}
}

function groupPerms(perms: Permission[]) {
  const groups: Record<string, Permission[]> = {};
  for (const p of perms) {
    const formattedName = p.name.replace(/_/g, " ");
    const parts = formattedName.split(" ");
    const cat = parts.length > 1
      ? parts.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
      : "General";
    const displayPerm = { ...p, displayName: parts.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") };
    (groups[cat] ??= []).push(displayPerm as any);
  }
  return groups;
}

// Small Components

function Btn({ children, variant = "secondary", onClick, disabled, style }: {
  children: React.ReactNode; variant?: "primary" | "secondary" | "danger";
  onClick?: () => void; disabled?: boolean; style?: React.CSSProperties;
}) {
  const s: Record<string, React.CSSProperties> = {
    primary:   { background: "#1a1a1a", color: "#fff", border: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" },
    secondary: { background: "#fff", color: "#333333", border: "1px solid #e0e0e0" },
    danger:    { background: "#fff", color: "#dc2626", border: "1px solid #fee2e2" },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      borderRadius: 10, padding: "7px 16px", fontSize: 12, fontWeight: 600,
      cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
      display: "inline-flex", alignItems: "center", gap: 6, transition: "all 0.15s",
      fontFamily: "inherit", ...s[variant], ...style,
    }}>{children}</button>
  );
}

function Toggle({ on, color, onClick }: { on: boolean; color: string; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{
      width: 38, height: 21, borderRadius: 11,
      background: on ? color : "#d0d0d0",
      position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0,
    }}>
      <div style={{
        width: 15, height: 15, borderRadius: "50%", background: "#fff", position: "absolute",
        top: 3, left: on ? 20 : 3, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      }} />
    </div>
  );
}

// Main Page

export default function AccessRolePage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const params = useParams();
  const currentRole = (params?.role as string) ?? "admin";
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    if (sessionStatus === "unauthenticated") router.push("/");
    if (sessionStatus === "authenticated") {
      const perms = getPermissions(session);
      if (!perms.includes("manage_roles")) router.push(`/${currentRole}`);
    }
  }, [sessionStatus, session, router, currentRole]);

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
  const [pendingPerms, setPendingPerms] = useState<{ add: string[]; remove: string[] }>({ add: [], remove: [] });

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

  useEffect(() => {
    const p = readPending();
    if (p) {
      setSelRoleId(p.roleId);
      if (p.name != null) setEditName(p.name);
      if (p.priority != null) setEditPri(p.priority);
      setPendingPerms({ add: p.addPerms, remove: p.removePerms });
    }
  }, []);

  const selRole = roles.find(r => r.role_id === selRoleId) ?? roles[0] ?? null;
  useEffect(() => {
    if (selRole) {
      const p = readPending();
      if (p && p.roleId === selRole.role_id) {
        if (p.name != null) setEditName(p.name); else setEditName(selRole.role_name);
        if (p.priority != null) setEditPri(p.priority); else setEditPri(selRole.priority);
        setPendingPerms({ add: p.addPerms, remove: p.removePerms });
      } else {
        setEditName(selRole.role_name);
        setEditPri(selRole.priority);
        setPendingPerms({ add: [], remove: [] });
      }
    }
  }, [selRole?.role_id]);

  useEffect(() => {
    if (!selRole) return;
    writePending({ roleId: selRole.role_id, name: editName, priority: editPri, addPerms: pendingPerms.add, removePerms: pendingPerms.remove });
  }, [selRole?.role_id, editName, editPri, pendingPerms]);

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

  const togglePerm = (pid: string) => {
    if (!selRole) return;
    const currentlyOn = selRole.permissions.some(p => p.permission_id === pid);
    const effectiveOn = pendingPerms.add.includes(pid) ? true : pendingPerms.remove.includes(pid) ? false : currentlyOn;
    setPendingPerms(prev => {
      const add = prev.add.filter(id => id !== pid);
      const remove = prev.remove.filter(id => id !== pid);
      if (effectiveOn) { if (currentlyOn) remove.push(pid); }
      else { if (!currentlyOn) add.push(pid); }
      return { add, remove };
    });
  };

  const saveAll = async () => {
    if (!selRole) return;
    setSaving(true);
    try {
      const promises: Promise<any>[] = [];
      if (editName !== selRole.role_name) {
        promises.push(fetch("/api/admin/roles", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role_id: selRole.role_id, role_name: editName }) }).then(r => { if (!r.ok) throw new Error("Failed to save name"); }));
      }
      if (editPri !== selRole.priority) {
        promises.push(fetch("/api/admin/roles/priority", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role_id: selRole.role_id, priority: editPri }) }).then(r => { if (!r.ok) throw new Error("Failed to save priority"); }));
      }
      for (const pid of pendingPerms.add) {
        promises.push(fetch("/api/admin/roles/permissions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role_id: selRole.role_id, permission_id: pid, action: "add" }) }).then(r => { if (!r.ok) throw new Error("Failed to add permission"); }));
      }
      for (const pid of pendingPerms.remove) {
        promises.push(fetch("/api/admin/roles/permissions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role_id: selRole.role_id, permission_id: pid, action: "remove" }) }).then(r => { if (!r.ok) throw new Error("Failed to remove permission"); }));
      }
      await Promise.all(promises);
      clearPending();
      setPendingPerms({ add: [], remove: [] });
      await fetchData();
      setError(null);
    } catch (e: any) { setError(e.message); } finally { setSaving(false); }
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
  const color = selRole ? rc(roles.indexOf(selRole)) : "#1a1a1a";
  const grouped = groupPerms(allPerms);

  // Theme-aware colours
  const C = {
    pageBg:    isDark ? "#0a0a0a" : "#f0f0f0",
    cardBg:    isDark ? "#1c1c1c" : "#ffffff",
    headerBg:  isDark ? "#1c1c1c" : "#ffffff",
    sidebarBg: isDark ? "#141414" : "#f8f8f8",
    border:    isDark ? "#2a2a2a" : "#e8e8e8",
    borderSoft:isDark ? "#1f1f1f" : "#efefef",
    text1:     isDark ? "#ebebeb" : "#111111",
    text2:     isDark ? "#aaaaaa" : "#555555",
    text3:     isDark ? "#666666" : "#888888",
    inputBg:   isDark ? "#1c1c1c" : "#ffffff",
    rowHover:  isDark ? "#1f1f1f" : "#f8f8f8",
    theadBg:   isDark ? "#111111" : "#f8f8f8",
  };

  // Loading state
  if (loading || sessionStatus === "loading") return (
    <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: C.pageBg, fontFamily: "'Inter',sans-serif" }}>
      <div style={{ textAlign: "center", color: C.text3 }}>
        <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: 28, marginBottom: 12, display: "block", color: "#1a1a1a" }} />
        Loading Access &amp; Roles…
      </div>
    </div>
  );

  if (error && roles.length === 0) return (
    <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: C.pageBg, fontFamily: "'Inter',sans-serif" }}>
      <div style={{ background: "#fef2f2", border: "1px solid #fee2e2", borderRadius: 16, padding: "24px 32px", color: "#dc2626", fontSize: 14, fontWeight: 600, maxWidth: 400, textAlign: "center" }}>
        <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: 24, display: "block", marginBottom: 10 }} />
        {error}
        <div style={{ marginTop: 16 }}><Btn variant="primary" onClick={fetchData}>Retry</Btn></div>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', system-ui, sans-serif; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #cccccc; border-radius: 99px; }
        [data-theme="dark"] ::-webkit-scrollbar-thumb { background: #333333; }
        input:focus { border-color: #1a1a1a !important; box-shadow: 0 0 0 3px rgba(26,26,26,0.08) !important; }

        /* Dark mode overrides */
        [data-theme="dark"] { color-scheme: dark; }

        /* Cards */
        [data-theme="dark"] div[style*="background: rgb(255, 255, 255)"],
        [data-theme="dark"] div[style*="background:#fff"],
        [data-theme="dark"] div[style*="background: #fff"] { background: #1c1c1c !important; border-color: #2a2a2a !important; }

        [data-theme="dark"] div[style*="background: rgb(248, 248, 248)"],
        [data-theme="dark"] div[style*="background:#f8f8f8"],
        [data-theme="dark"] div[style*="background: #f8f8f8"],
        [data-theme="dark"] div[style*="background: rgb(249, 250, 251)"],
        [data-theme="dark"] div[style*="background:#f9fafb"],
        [data-theme="dark"] div[style*="background: #f9fafb"],
        [data-theme="dark"] div[style*="background: rgb(243, 244, 246)"],
        [data-theme="dark"] div[style*="background:#f3f4f6"],
        [data-theme="dark"] div[style*="background: #f3f4f6"] { background: #111111 !important; border-color: #1f1f1f !important; }

        /* Text primary */
        [data-theme="dark"] div[style*="color: rgb(17, 17, 17)"],
        [data-theme="dark"] div[style*="color:#111111"],
        [data-theme="dark"] div[style*="color: #111111"],
        [data-theme="dark"] span[style*="color:#111111"],
        [data-theme="dark"] span[style*="color: rgb(17, 17, 17)"] { color: #ebebeb !important; }

        /* Text secondary */
        [data-theme="dark"] div[style*="color: rgb(85, 85, 85)"],
        [data-theme="dark"] div[style*="color:#555555"],
        [data-theme="dark"] div[style*="color: #555555"],
        [data-theme="dark"] span[style*="color:#555555"],
        [data-theme="dark"] span[style*="color: rgb(55, 65, 81)"],
        [data-theme="dark"] span[style*="color:#374151"],
        [data-theme="dark"] span[style*="color: #374151"] { color: #cccccc !important; }

        /* Text muted */
        [data-theme="dark"] div[style*="color: rgb(136, 136, 136)"],
        [data-theme="dark"] div[style*="color:#888888"],
        [data-theme="dark"] div[style*="color: #888888"],
        [data-theme="dark"] span[style*="color:#888888"],
        [data-theme="dark"] div[style*="color: rgb(156, 163, 175)"],
        [data-theme="dark"] div[style*="color:#9ca3af"],
        [data-theme="dark"] div[style*="color: #9ca3af"],
        [data-theme="dark"] span[style*="color:#9ca3af"] { color: #666666 !important; }

        /* Borders */
        [data-theme="dark"] div[style*="border: 1px solid rgb(232, 232, 232)"],
        [data-theme="dark"] div[style*="border: 1px solid #e8e8e8"],
        [data-theme="dark"] div[style*="border: 1px solid rgb(224, 224, 224)"],
        [data-theme="dark"] div[style*="border: 1px solid #e0e0e0"] { border-color: #2a2a2a !important; }
        [data-theme="dark"] [style*="border-bottom: 1px solid rgb(239, 239, 239)"],
        [data-theme="dark"] [style*="border-bottom: 1px solid #efefef"] { border-color: #1f1f1f !important; }
        [data-theme="dark"] [style*="border-top: 1px solid rgb(239, 239, 239)"],
        [data-theme="dark"] [style*="border-top: 1px solid #efefef"] { border-color: #1f1f1f !important; }

        /* Tables */
        [data-theme="dark"] thead tr { background: #111111 !important; border-color: #1f1f1f !important; }
        [data-theme="dark"] thead th { color: #555555 !important; }
        [data-theme="dark"] tbody tr { border-color: #1f1f1f !important; }
        [data-theme="dark"] tbody tr:hover { background: #1a1a1a !important; }
        [data-theme="dark"] td { border-color: #1f1f1f !important; }
        [data-theme="dark"] td[style*="color: rgb(17, 17, 17)"],
        [data-theme="dark"] td[style*="color:#111111"] { color: #ebebeb !important; }
        [data-theme="dark"] td[style*="color: rgb(136, 136, 136)"],
        [data-theme="dark"] td[style*="color:#888888"] { color: #666666 !important; }

        /* Inputs */
        [data-theme="dark"] input, [data-theme="dark"] select {
          background: #1c1c1c !important; border-color: #2a2a2a !important; color: #ebebeb !important;
        }
        [data-theme="dark"] input::placeholder { color: #555555 !important; }

        /* Buttons */
        [data-theme="dark"] button[style*="background: rgb(255, 255, 255)"],
        [data-theme="dark"] button[style*="background:#fff"],
        [data-theme="dark"] button[style*="background: #fff"] { background: #1c1c1c !important; border-color: #2a2a2a !important; color: #cccccc !important; }

        /* Modals */
        [data-theme="dark"] div[style*="background: rgba(0, 0, 0"] { background: rgba(0,0,0,0.7) !important; }

        /* Error */
        [data-theme="dark"] div[style*="background: rgb(254, 242, 242)"],
        [data-theme="dark"] div[style*="background:#fef2f2"] { background: #2a0a0a !important; border-color: #5a1a1a !important; }

        /* Theme toggle button */
        .ar-theme-btn {
          background: none; border: 1px solid #e0e0e0; border-radius: 10px;
          width: 36px; height: 36px; display: inline-flex; align-items: center;
          justify-content: center; cursor: pointer; transition: all 0.2s; flex-shrink: 0;
        }
        [data-theme="dark"] .ar-theme-btn { border-color: #2a2a2a; background: #1c1c1c; }
        .ar-theme-btn:hover { transform: scale(1.06); background: #f0f0f0; }
        [data-theme="dark"] .ar-theme-btn:hover { background: #222222; }
      `}</style>

      <div data-theme={isDark ? "dark" : "light"} style={{
        display: "flex", flexDirection: "column", height: "100vh",
        background: C.pageBg, fontFamily: "'Inter',sans-serif",
        color: C.text1, transition: "background 0.2s, color 0.2s",
      }}>

        {/* Header */}
        <header style={{
          height: 60, padding: "0 28px",
          background: C.headerBg,
          borderBottom: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0, transition: "background 0.2s",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}>
          {/* Left: back + title */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <a href={`/${currentRole}`} style={{
              color: C.text3, fontSize: 13, textDecoration: "none",
              display: "flex", alignItems: "center", gap: 6, fontWeight: 600,
              padding: "6px 10px", borderRadius: 8, border: `1px solid ${C.border}`,
              transition: "all 0.15s",
            }}>
              <i className="fa-solid fa-arrow-left" style={{ fontSize: 11 }} />
              {currentRole.charAt(0).toUpperCase() + currentRole.slice(1)}
            </a>
            <span style={{ color: C.text3 }}>/</span>
            <h1 style={{
              fontSize: 16, fontWeight: 700, fontFamily: "'Inter',sans-serif",
              color: C.text1, margin: 0,
            }}>
              Access &amp; Roles
            </h1>
          </div>

          {/* Right: tabs + theme toggle */}
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {(["roles", "members"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                background: tab === t ? (isDark ? "#2a2a2a" : "#ffffff") : "transparent",
                border: tab === t
                  ? `1px solid ${isDark ? "#333333" : "#e0e0e0"}`
                  : "1px solid transparent",
                borderRadius: 10, padding: "6px 16px", fontSize: 13,
                fontWeight: tab === t ? 700 : 500,
                color: tab === t ? C.text1 : C.text3,
                cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.07)" : "none",
              }}>
                <i className={t === "roles" ? "fa-solid fa-shield-halved" : "fa-solid fa-users"} style={{ marginRight: 6, fontSize: 12 }} />
                {t === "roles" ? "Roles & Permissions" : "Members"}
              </button>
            ))}

            {/* Dark mode toggle */}
            <button onClick={toggleTheme} className="ar-theme-btn" title={isDark ? "Light mode" : "Dark mode"}>
              {isDark
                ? <i className="fa-solid fa-sun" style={{ color: "#f59e0b", fontSize: 14 }} />
                : <i className="fa-solid fa-moon" style={{ color: "#888888", fontSize: 14 }} />}
            </button>
          </div>
        </header>

        {/* Inline error banner */}
        {error && (
          <div style={{
            margin: "12px 28px 0", padding: "10px 16px",
            background: "#fef2f2", border: "1px solid #fee2e2",
            borderRadius: 10, color: "#dc2626", fontSize: 12, fontWeight: 600,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <i className="fa-solid fa-circle-exclamation" /> {error}
            <button onClick={() => setError(null)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#dc2626" }}>
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
        )}

        {/* ROLES TAB */}
        {tab === "roles" && (
          <div style={{ flex: 1, display: "flex", gap: 16, padding: "20px 28px", overflow: "hidden" }}>

            {/* Role List */}
            <div style={{
              width: 240, flexShrink: 0,
              background: C.cardBg,
              border: `1px solid ${C.border}`,
              borderRadius: 16,
              display: "flex", flexDirection: "column", overflow: "hidden",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}>
              <div style={{ padding: "14px 16px 10px", borderBottom: `1px solid ${C.borderSoft}` }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.text3, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  Roles — {roles.length}
                </div>
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: 6 }}>
                {roles.map((r, i) => (
                  <button key={r.role_id} onClick={() => setSelRoleId(r.role_id)} style={{
                    width: "100%",
                    background: selRole?.role_id === r.role_id
                      ? (isDark ? "#2a2a2a" : "#ffffff")
                      : "transparent",
                    border: selRole?.role_id === r.role_id
                      ? `1px solid ${isDark ? "#333333" : "#e0e0e0"}`
                      : "1px solid transparent",
                    borderRadius: 10, padding: "10px 12px",
                    display: "flex", alignItems: "center", gap: 10,
                    cursor: "pointer", textAlign: "left", marginBottom: 2,
                    fontFamily: "inherit", transition: "all 0.15s",
                    boxShadow: selRole?.role_id === r.role_id ? "0 1px 4px rgba(0,0,0,0.07)" : "none",
                  }}>
                    <span style={{ width: 9, height: 9, borderRadius: "50%", background: rc(i), flexShrink: 0 }} />
                    <div style={{ flex: 1, overflow: "hidden" }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: C.text1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {r.role_name}
                      </div>
                      <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>
                        {r.members} member{r.members !== 1 ? "s" : ""} · P{r.priority}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div style={{ padding: 8, borderTop: `1px solid ${C.borderSoft}` }}>
                {creating ? (
                  <div style={{ display: "flex", gap: 6 }}>
                    <input
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      placeholder="Role name…"
                      onKeyDown={e => e.key === "Enter" && createRole()}
                      style={{
                        flex: 1, border: `1px solid ${C.border}`, borderRadius: 8,
                        padding: "7px 10px", fontSize: 12, outline: "none",
                        fontFamily: "inherit", background: C.inputBg, color: C.text1,
                      }}
                      autoFocus
                    />
                    <Btn variant="primary" onClick={createRole} disabled={saving}>
                      <i className="fa-solid fa-check" style={{ fontSize: 10 }} />
                    </Btn>
                    <Btn onClick={() => { setCreating(false); setNewName(""); }}>
                      <i className="fa-solid fa-xmark" style={{ fontSize: 10 }} />
                    </Btn>
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
              <div style={{
                flex: 1,
                background: C.cardBg,
                border: `1px solid ${C.border}`,
                borderRadius: 16,
                display: "flex", flexDirection: "column", overflow: "hidden",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}>
                {/* Editor Header */}
                <div style={{
                  padding: "16px 24px",
                  borderBottom: `1px solid ${C.borderSoft}`,
                  display: "flex", alignItems: "center", gap: 14,
                  background: isDark ? "#111111" : "#f8f8f8",
                }}>
                  <span style={{
                    width: 13, height: 13, borderRadius: "50%",
                    background: color, boxShadow: `0 0 0 3px ${color}30`,
                  }} />
                  <input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    style={{
                      background: "transparent", border: "none", outline: "none",
                      fontSize: 18, fontWeight: 700, color: C.text1,
                      fontFamily: "'Inter',sans-serif", flex: 1,
                    }}
                  />
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <label style={{ fontSize: 11, color: C.text3, fontWeight: 600 }}>Priority</label>
                    <input
                      type="number" value={editPri}
                      onChange={e => setEditPri(Number(e.target.value))}
                      style={{
                        width: 56, border: `1px solid ${C.border}`, borderRadius: 8,
                        padding: "5px 8px", fontSize: 13, textAlign: "center",
                        outline: "none", fontFamily: "inherit",
                        background: C.inputBg, color: C.text1,
                      }}
                    />
                    <Btn variant="primary" onClick={saveAll} disabled={saving}>
                      {saving
                        ? <><i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: 11 }} /> Saving</>
                        : <><i className="fa-solid fa-floppy-disk" style={{ fontSize: 11 }} /> Save</>}
                    </Btn>
                  </div>
                </div>

                {/* Permissions */}
                <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.text3, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>
                    Permissions — {selRole.permissions.length} / {allPerms.length} enabled
                  </div>

                  {Object.entries(grouped).map(([cat, perms]) => (
                    <div key={cat} style={{ marginBottom: 22 }}>
                      <div style={{
                        fontSize: 11, fontWeight: 700, color: C.text2,
                        textTransform: "uppercase", letterSpacing: "0.08em",
                        marginBottom: 8, display: "flex", alignItems: "center", gap: 7,
                      }}>
                        <div style={{
                          width: 20, height: 20, borderRadius: 5,
                          background: "#1a1a1a",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <i className="fa-solid fa-layer-group" style={{ color: "#fff", fontSize: 9 }} />
                        </div>
                        {cat}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        {perms.map(p => {
                          const baseOn = selRole.permissions.some(rp => rp.permission_id === p.permission_id);
                          const on = pendingPerms.add.includes(p.permission_id) ? true : pendingPerms.remove.includes(p.permission_id) ? false : baseOn;
                          return (
                            <div
                              key={p.permission_id}
                              onClick={() => togglePerm(p.permission_id)}
                              style={{
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                padding: "11px 14px",
                                background: on
                                  ? (isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)")
                                  : (isDark ? "#111111" : "#f8f8f8"),
                                border: `1px solid ${on
                                  ? (isDark ? "#2a2a2a" : "#d0d0d0")
                                  : (isDark ? "#1f1f1f" : "#efefef")}`,
                                borderRadius: 10, cursor: "pointer", transition: "all 0.15s",
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <i
                                  className={on ? "fa-solid fa-circle-check" : "fa-regular fa-circle"}
                                  style={{ color: on ? "#1a1a1a" : (isDark ? "#444444" : "#cccccc"), fontSize: 15 }}
                                />
                                <div>
                                  <span style={{ fontSize: 13, fontWeight: 500, color: on ? C.text1 : C.text3 }}>
                                    {(p as any).displayName || p.name}
                                  </span>
                                  {p.description && (
                                    <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>{p.description}</div>
                                  )}
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
                    <div style={{ textAlign: "center", color: C.text3, padding: 40, fontSize: 14 }}>
                      <i className="fa-solid fa-lock" style={{ fontSize: 24, display: "block", marginBottom: 10 }} />
                      No permissions defined in the database yet.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* MEMBERS TAB */}
        {tab === "members" && (
          <div style={{ flex: 1, padding: "20px 28px", overflowY: "auto" }}>
            {/* Search bar */}
            <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
              <div style={{ position: "relative", flex: 1, maxWidth: 380 }}>
                <i className="fa-solid fa-magnifying-glass" style={{
                  position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                  color: C.text3, fontSize: 13,
                }} />
                <input
                  placeholder="Search users…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{
                    width: "100%", border: `1px solid ${C.border}`, borderRadius: 10,
                    padding: "9px 14px 9px 36px", fontSize: 13, outline: "none",
                    fontFamily: "inherit", background: C.inputBg, color: C.text1,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                  }}
                />
              </div>
              <div style={{ fontSize: 12, color: C.text3, fontWeight: 600 }}>
                {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""}
              </div>
            </div>

            {/* Users table */}
            <div style={{
              background: C.cardBg,
              border: `1px solid ${C.border}`,
              borderRadius: 16, overflow: "hidden",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.borderSoft}`, background: C.theadBg }}>
                    {["User", "Email", "Roles", "Actions"].map(h => (
                      <th key={h} style={{
                        padding: "11px 18px", textAlign: "left",
                        fontSize: 11, fontWeight: 700, color: C.text3,
                        textTransform: "uppercase", letterSpacing: "0.08em",
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr><td colSpan={4} style={{ padding: 32, textAlign: "center", color: C.text3, fontSize: 14 }}>No users found</td></tr>
                  ) : filteredUsers.map((u, idx) => (
                    <tr
                      key={u.user_id}
                      style={{ borderBottom: idx < filteredUsers.length - 1 ? `1px solid ${C.borderSoft}` : "none" }}
                      onMouseEnter={(e) => (e.currentTarget as HTMLTableRowElement).style.background = C.rowHover}
                      onMouseLeave={(e) => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}
                    >
                      <td style={{ padding: "12px 18px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{
                            width: 34, height: 34, borderRadius: 9,
                            background: "#1a1a1a",
                            color: "#fff",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 12, fontWeight: 700,
                          }}>
                            {initials(u.name)}
                          </div>
                          <span style={{ fontWeight: 600, fontSize: 14, color: C.text1 }}>{u.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 18px", fontSize: 13, color: C.text2 }}>{u.email}</td>
                      <td style={{ padding: "12px 18px" }}>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {u.roles.length === 0 && (
                            <span style={{ fontSize: 11, color: C.text3, fontStyle: "italic" }}>No roles</span>
                          )}
                          {u.roles.map((r) => {
                            const roleIdx = roles.findIndex(x => x.role_id === r.role_id);
                            const roleColor = rc(roleIdx);
                            return (
                              <span key={r.role_id} style={{
                                background: roleColor + "18",
                                color: roleColor,
                                border: `1px solid ${roleColor}33`,
                                borderRadius: 6, padding: "2px 8px",
                                fontSize: 11, fontWeight: 700,
                              }}>
                                {r.role_name}
                              </span>
                            );
                          })}
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

      {/* Manage Roles Modal */}
      {manageUser && (
        <div
          onClick={() => setManageId(null)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1000, backdropFilter: "blur(4px)",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: C.cardBg, borderRadius: 20, width: 440, maxWidth: "92vw",
              boxShadow: "0 24px 64px rgba(0,0,0,0.18)", overflow: "hidden",
              border: `1px solid ${C.border}`,
            }}
          >
            {/* Modal header */}
            <div style={{
              padding: "20px 24px 16px",
              borderBottom: `1px solid ${C.borderSoft}`,
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: "#1a1a1a",
                  color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, fontWeight: 700,
                }}>
                  {initials(manageUser.name)}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, fontFamily: "'Inter',sans-serif", color: C.text1 }}>
                    {manageUser.name}
                  </div>
                  <div style={{ fontSize: 12, color: C.text3 }}>{manageUser.email}</div>
                </div>
              </div>
              <button
                onClick={() => setManageId(null)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  width: 30, height: 30, borderRadius: 8,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <i className="fa-solid fa-xmark" style={{ color: C.text3, fontSize: 16 }} />
              </button>
            </div>

            {/* Role list */}
            <div style={{ padding: "16px 24px", maxHeight: 400, overflowY: "auto" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.text3, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
                Assign Roles
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {roles.map((r, i) => {
                  const has = manageUser.roles.some(ur => ur.role_id === r.role_id);
                  return (
                    <div
                      key={r.role_id}
                      onClick={() => has ? removeRole(manageUser.user_id, r.role_id) : assignRole(manageUser.user_id, r.role_id)}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "11px 14px",
                        background: has
                          ? (isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)")
                          : (isDark ? "#111111" : "#f8f8f8"),
                        border: `1px solid ${has
                          ? (isDark ? "#2a2a2a" : "#d0d0d0")
                          : (isDark ? "#1f1f1f" : "#efefef")}`,
                        borderRadius: 10, cursor: "pointer", transition: "all 0.15s",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ width: 9, height: 9, borderRadius: "50%", background: rc(i) }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: has ? C.text1 : C.text3 }}>{r.role_name}</span>
                        <span style={{ fontSize: 11, color: C.text3 }}>P{r.priority}</span>
                      </div>
                      <Toggle on={has} color={rc(i)} onClick={() => {}} />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal footer */}
            <div style={{
              padding: "14px 24px",
              borderTop: `1px solid ${C.borderSoft}`,
              background: isDark ? "#111111" : "#f8f8f8",
              display: "flex", justifyContent: "flex-end",
            }}>
              <Btn onClick={() => setManageId(null)}>Done</Btn>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
