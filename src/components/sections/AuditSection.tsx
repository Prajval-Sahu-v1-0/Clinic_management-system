"use client";

import { useState, useEffect, Fragment } from "react";
import { Badge, ActionButton, ErrorMessage } from "@/components/DashboardShared";
import { useAuditLogs } from "@/hooks/useAdminData";

const ACTION_COLORS: Record<string, { color: string; bg: string }> = {
  create: { color: "#0d9488", bg: "#f0fdfa" },
  insert: { color: "#0d9488", bg: "#f0fdfa" },
  update: { color: "#2563eb", bg: "#eff6ff" },
  delete: { color: "#dc2626", bg: "#fef2f2" },
  login:  { color: "#7c3aed", bg: "#f5f3ff" },
  assign: { color: "#d97706", bg: "#fffbeb" },
  revoke: { color: "#dc2626", bg: "#fef2f2" },
};

function actionBadgeStyle(action: string) {
  const a = action?.toLowerCase();
  return ACTION_COLORS[a] ?? { color: "#6b7280", bg: "#f3f4f6" };
}

const ALL_ACTIONS = ["all", "create", "update", "delete", "login", "assign", "revoke"];

function JsonDiffViewer({ before, after }: { before: any; after: any }) {
  const b = before || {};
  const a = after || {};
  const allKeys = Array.from(new Set([...Object.keys(b), ...Object.keys(a)]));

  if (allKeys.length === 0) {
    return <div style={{ color: "#9ca3af", fontStyle: "italic", padding: 16 }}>No object changes recorded for this event.</div>;
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, fontSize: 13, fontFamily: "'JetBrains Mono', monospace", padding: "16px 24px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
      <div style={{ background: "#fef2f2", border: "1px solid #fee2e2", borderRadius: 8, padding: 16 }}>
        <div style={{ color: "#dc2626", fontWeight: 700, marginBottom: 12, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Before</div>
        {allKeys.map(k => {
          if (b[k] === undefined) return null;
          const v = JSON.stringify(b[k]);
          const changed = b[k] !== a[k] && a[k] !== undefined;
          return (
            <div key={k} style={{ display: "flex", gap: 8, marginBottom: 4, opacity: changed ? 1 : 0.6 }}>
              <span style={{ color: "#991b1b", fontWeight: 600 }}>{k}:</span>
              <span style={{ color: changed ? "#dc2626" : "#4b5563" }}>{v}</span>
            </div>
          );
        })}
      </div>
      <div style={{ background: "#f0fdfa", border: "1px solid #ccfbf1", borderRadius: 8, padding: 16 }}>
        <div style={{ color: "#0d9488", fontWeight: 700, marginBottom: 12, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>After</div>
        {allKeys.map(k => {
          if (a[k] === undefined) return null;
          const v = JSON.stringify(a[k]);
          const changed = b[k] !== a[k] && b[k] !== undefined;
          return (
            <div key={k} style={{ display: "flex", gap: 8, marginBottom: 4, opacity: changed ? 1 : 0.6 }}>
              <span style={{ color: "#0f766e", fontWeight: 600 }}>{k}:</span>
              <span style={{ color: changed ? "#0d9488" : "#4b5563" }}>{v}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AuditSection() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("all");
  const [userFilter, setUserFilter]     = useState("");
  const [expandedId, setExpandedId]     = useState<string | null>(null);

  useEffect(() => { setPage(1); }, [actionFilter, userFilter]);

  const { response, loading, error } = useAuditLogs(page, 15, actionFilter, userFilter);
  const entries = response?.data ?? [];
  const totalItems = response?.total ?? 0;
  const totalPages = response?.totalPages ?? 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Filters */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 4, background: "#f3f4f6", borderRadius: 10, padding: 4 }}>
          {ALL_ACTIONS.map(a => (
            <button
              key={a} onClick={() => setActionFilter(a)}
              style={{
                border: "none", borderRadius: 7, padding: "6px 13px",
                background: actionFilter === a ? "#fff" : "transparent",
                color: actionFilter === a ? "#111827" : "#6b7280",
                fontSize: 12, fontWeight: actionFilter === a ? 700 : 500,
                cursor: "pointer", textTransform: "capitalize", fontFamily: "inherit",
                boxShadow: actionFilter === a ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                transition: "all 0.15s",
              }}
            >{a}</button>
          ))}
        </div>
        <div style={{ position: "relative", flex: "0 0 220px" }}>
          <i className="fa-solid fa-magnifying-glass" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: 12 }} />
          <input
            placeholder="Filter by user…"
            value={userFilter}
            onChange={e => setUserFilter(e.target.value)}
            style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 9, padding: "8px 12px 8px 32px", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box", fontFamily: "inherit", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
          />
        </div>
        <span style={{ fontSize: 13, color: "#6b7280", marginLeft: "auto", fontWeight: 500 }}>
          {loading ? "Loading…" : `${totalItems > 0 ? (page - 1) * 15 + 1 : 0}-${Math.min(page * 15, totalItems)} of ${totalItems} events`}
        </span>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Table */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #f3f4f6", background: "#f9fafb" }}>
              {["Timestamp", "User / Actor", "Action", "Entity Affected", "Source"].map(h => (
                <th key={h} style={{ padding: "11px 18px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && entries.length === 0 ? (
              [1,2,3,4,5].map(i => (
                <tr key={i}>{[1,2,3,4,5].map(j => (
                  <td key={j} style={{ padding: "14px 18px" }}>
                    <div style={{ height: 13, borderRadius: 6, background: "linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite", width: j === 2 ? "40%" : "70%" }} />
                  </td>
                ))}</tr>
              ))
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: "32px 18px", textAlign: "center", color: "#9ca3af", fontSize: 14 }}>
                  <i className="fa-solid fa-magnifying-glass" style={{ marginRight: 8, fontSize: 16 }} />
                  No audit events found
                </td>
              </tr>
            ) : (
              entries.map((entry, idx) => {
                const { color, bg } = actionBadgeStyle(entry.action);
                const isExpanded = expandedId === entry.id;
                return (
                  <Fragment key={entry.id}>
                    <tr
                      onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                      style={{ borderBottom: isExpanded ? "none" : (idx < entries.length - 1 ? "1px solid #f3f4f6" : "none"), transition: "background 0.1s", cursor: "pointer" }}
                      onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = "#f9fafb"}
                      onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}
                    >
                      <td style={{ padding: "13px 18px", fontSize: 12, color: "#9ca3af", fontFamily: "'JetBrains Mono', monospace", whiteSpace: "nowrap" }}>
                        <div style={{ fontWeight: 600, color: "#374151", fontSize: 13 }}>
                          {new Date(entry.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </div>
                        <div style={{ marginTop: 2 }}>
                          {new Date(entry.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </div>
                      </td>
                      <td style={{ padding: "13px 18px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                          <div style={{ width: 30, height: 30, borderRadius: 8, background: "#f0fdfa", border: "1px solid #ccfbf1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#0d9488", flexShrink: 0 }}>
                            {entry.actor?.slice(0, 2).toUpperCase() || "??"}
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{entry.actor || "—"}</span>
                        </div>
                      </td>
                      <td style={{ padding: "13px 18px" }}>
                        <span style={{ background: bg, color, borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 700, textTransform: "capitalize", letterSpacing: "0.02em", display: "inline-flex", alignItems: "center", gap: 5 }}>
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: color, display: "inline-block" }} />
                          {entry.action}
                        </span>
                      </td>
                      <td style={{ padding: "13px 18px" }}>
                        <span style={{ background: "#f3f4f6", borderRadius: 5, padding: "3px 10px", fontSize: 12, fontWeight: 500, color: "#374151", textTransform: "capitalize" }}>
                          {entry.entity || "—"} {entry.entity_id && <span style={{ color: "#9ca3af", marginLeft: 4 }}>({entry.entity_id})</span>}
                        </span>
                      </td>
                      <td style={{ padding: "13px 18px", textAlign: "right" }}>
                        <i className={`fa-solid fa-chevron-${isExpanded ? "up" : "down"}`} style={{ color: "#9ca3af", fontSize: 12 }} />
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={5} style={{ padding: 0 }}>
                          <JsonDiffViewer before={entry.before_data} after={entry.after_data} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div style={{ padding: "12px 18px", borderTop: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f9fafb" }}>
            <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>Page {page} of {totalPages}</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}
                style={{ padding: "6px 12px", border: "1px solid #e5e7eb", borderRadius: 6, background: page <= 1 ? "#f3f4f6" : "#fff", color: page <= 1 ? "#9ca3af" : "#374151", fontSize: 13, fontWeight: 600, cursor: page <= 1 ? "not-allowed" : "pointer" }}
              ><i className="fa-solid fa-chevron-left" style={{ fontSize: 10, marginRight: 6 }} /> Prev</button>
              <button
                disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                style={{ padding: "6px 12px", border: "1px solid #e5e7eb", borderRadius: 6, background: page >= totalPages ? "#f3f4f6" : "#fff", color: page >= totalPages ? "#9ca3af" : "#374151", fontSize: 13, fontWeight: 600, cursor: page >= totalPages ? "not-allowed" : "pointer" }}
              >Next <i className="fa-solid fa-chevron-right" style={{ fontSize: 10, marginLeft: 6 }} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
