"use client";

import { useState, useEffect, Fragment } from "react";
import { Badge, ActionButton, ErrorMessage } from "@/components/DashboardShared";
import { useAuditLogs } from "@/hooks/useAdminData";
import { T } from "./themeTokens";

const ACTION_COLORS: Record<string, { color: string; bg: string }> = {
  create: { color: T.sage, bg: T.successBg },
  insert: { color: T.sage, bg: T.successBg },
  update: { color: "#60a5fa", bg: "rgba(96,165,250,0.12)" },
  delete: { color: "#f87171", bg: T.dangerBg },
  login:  { color: T.copper, bg: "rgba(192,138,90,0.12)" },
  assign: { color: T.copper, bg: "rgba(192,138,90,0.12)" },
  revoke: { color: "#f87171", bg: T.dangerBg },
};

function actionBadgeStyle(action: string) {
  const a = action?.toLowerCase();
  return ACTION_COLORS[a] ?? { color: T.text2, bg: T.chipBg };
}

const ALL_ACTIONS = ["all", "create", "update", "delete", "login", "assign", "revoke"];

function JsonDiffViewer({ before, after }: { before: any; after: any }) {
  const b = before || {};
  const a = after || {};
  const allKeys = Array.from(new Set([...Object.keys(b), ...Object.keys(a)]));

  if (allKeys.length === 0) {
    return <div style={{ color: T.text3, fontStyle: "italic", padding: 16 }}>No object changes recorded for this event.</div>;
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, fontSize: 13, fontFamily: "'JetBrains Mono', monospace", padding: "16px 24px", background: "rgba(20,78,66,0.3)", borderBottom: `1px solid ${T.tableRowBorder}` }}>
      <div style={{ background: T.dangerBg, border: `1px solid ${T.dangerBorder}`, borderRadius: 8, padding: 16 }}>
        <div style={{ color: "#f87171", fontWeight: 700, marginBottom: 12, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Before</div>
        {allKeys.map(k => {
          if (b[k] === undefined) return null;
          const v = JSON.stringify(b[k]);
          const changed = b[k] !== a[k] && a[k] !== undefined;
          return (
            <div key={k} style={{ display: "flex", gap: 8, marginBottom: 4, opacity: changed ? 1 : 0.6 }}>
              <span style={{ color: "#f87171", fontWeight: 600 }}>{k}:</span>
              <span style={{ color: changed ? "#f87171" : T.text2 }}>{v}</span>
            </div>
          );
        })}
      </div>
      <div style={{ background: T.successBg, border: `1px solid ${T.successBorder}`, borderRadius: 8, padding: 16 }}>
        <div style={{ color: T.sage, fontWeight: 700, marginBottom: 12, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>After</div>
        {allKeys.map(k => {
          if (a[k] === undefined) return null;
          const v = JSON.stringify(a[k]);
          const changed = b[k] !== a[k] && b[k] !== undefined;
          return (
            <div key={k} style={{ display: "flex", gap: 8, marginBottom: 4, opacity: changed ? 1 : 0.6 }}>
              <span style={{ color: T.sage, fontWeight: 600 }}>{k}:</span>
              <span style={{ color: changed ? T.sage : T.text2 }}>{v}</span>
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
        <div style={{ display: "flex", gap: 4, background: T.filterBg, borderRadius: 10, padding: 4, border: `1px solid ${T.cardBorder}` }}>
          {ALL_ACTIONS.map(a => (
            <button
              key={a} onClick={() => setActionFilter(a)}
              style={{
                border: "none", borderRadius: 7, padding: "6px 13px",
                background: actionFilter === a ? T.filterActiveBg : "transparent",
                color: actionFilter === a ? T.filterActiveColor : T.filterInactiveColor,
                fontSize: 12, fontWeight: actionFilter === a ? 700 : 500,
                cursor: "pointer", textTransform: "capitalize", fontFamily: "inherit",
                boxShadow: actionFilter === a ? "0 2px 8px rgba(58,143,122,0.15)" : "none",
                transition: "all 0.15s",
              }}
            >{a}</button>
          ))}
        </div>
        <div style={{ position: "relative", flex: "0 0 220px" }}>
          <i className="fa-solid fa-magnifying-glass" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: T.searchIcon, fontSize: 12 }} />
          <input
            placeholder="Filter by user…"
            value={userFilter}
            onChange={e => setUserFilter(e.target.value)}
            style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}`, borderRadius: 9, padding: "8px 12px 8px 32px", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box", fontFamily: "inherit", color: T.text1 }}
          />
        </div>
        <span style={{ fontSize: 13, color: T.text2, marginLeft: "auto", fontWeight: 500 }}>
          {loading ? "Loading…" : `${totalItems > 0 ? (page - 1) * 15 + 1 : 0}-${Math.min(page * 15, totalItems)} of ${totalItems} events`}
        </span>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Table */}
      <div style={{ background: T.tableBg, border: `1px solid ${T.cardBorder}`, borderRadius: 12, overflow: "hidden", boxShadow: T.cardShadow, backdropFilter: "blur(8px)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.tableRowBorder}`, background: T.tableHeaderBg }}>
              {["Timestamp", "User / Actor", "Action", "Entity Affected", "Source"].map(h => (
                <th key={h} style={{ padding: "11px 18px", textAlign: "left", fontSize: 11, fontWeight: 700, color: T.text2, textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && entries.length === 0 ? (
              [1,2,3,4,5].map(i => (
                <tr key={i}>{[1,2,3,4,5].map(j => (
                  <td key={j} style={{ padding: "14px 18px" }}>
                    <div style={{ height: 13, borderRadius: 6, background: "linear-gradient(90deg,rgba(169,216,200,0.06) 25%,rgba(169,216,200,0.12) 50%,rgba(169,216,200,0.06) 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite", width: j === 2 ? "40%" : "70%" }} />
                  </td>
                ))}</tr>
              ))
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: "32px 18px", textAlign: "center", color: T.text3, fontSize: 14 }}>
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
                      style={{ borderBottom: isExpanded ? "none" : (idx < entries.length - 1 ? `1px solid ${T.tableRowBorder}` : "none"), transition: "background 0.1s", cursor: "pointer" }}
                      onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = T.tableHoverBg}
                      onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}
                    >
                      <td style={{ padding: "13px 18px", fontSize: 12, color: T.text3, fontFamily: "'JetBrains Mono', monospace", whiteSpace: "nowrap" }}>
                        <div style={{ fontWeight: 600, color: T.text2, fontSize: 13 }}>
                          {new Date(entry.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </div>
                        <div style={{ marginTop: 2 }}>
                          {new Date(entry.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </div>
                      </td>
                      <td style={{ padding: "13px 18px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                          <div style={{ width: 30, height: 30, borderRadius: 8, background: T.avatarBg, border: `1px solid ${T.avatarBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: T.sage, flexShrink: 0 }}>
                            {entry.actor?.slice(0, 2).toUpperCase() || "??"}
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 600, color: T.text1 }}>{entry.actor || "—"}</span>
                        </div>
                      </td>
                      <td style={{ padding: "13px 18px" }}>
                        <span style={{ background: bg, color, borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", display: "inline-flex", alignItems: "center", gap: 5 }}>
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: color, display: "inline-block" }} />
                          {entry.action}
                        </span>
                      </td>
                      <td style={{ padding: "13px 18px" }}>
                        <span style={{ background: T.chipBg, borderRadius: 5, padding: "3px 10px", fontSize: 12, fontWeight: 500, color: T.text2, textTransform: "capitalize" }}>
                          {entry.entity || "—"} {entry.entity_id && <span style={{ color: T.text3, marginLeft: 4 }}>({entry.entity_id})</span>}
                        </span>
                      </td>
                      <td style={{ padding: "13px 18px", textAlign: "right" }}>
                        <i className={`fa-solid fa-chevron-${isExpanded ? "up" : "down"}`} style={{ color: T.text3, fontSize: 12 }} />
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
          <div style={{ padding: "12px 18px", borderTop: `1px solid ${T.cardBorder}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: T.modalFooterBg }}>
            <span style={{ fontSize: 13, color: T.text2, fontWeight: 500 }}>Page {page} of {totalPages}</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}
                style={{ padding: "6px 12px", border: `1px solid ${T.pagBorder}`, borderRadius: 6, background: page <= 1 ? T.pagDisabledBg : T.pagBg, color: page <= 1 ? T.pagDisabledColor : T.pagActiveColor, fontSize: 13, fontWeight: 600, cursor: page <= 1 ? "not-allowed" : "pointer", fontFamily: "inherit" }}
              ><i className="fa-solid fa-chevron-left" style={{ fontSize: 10, marginRight: 6 }} /> Prev</button>
              <button
                disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                style={{ padding: "6px 12px", border: `1px solid ${T.pagBorder}`, borderRadius: 6, background: page >= totalPages ? T.pagDisabledBg : T.pagBg, color: page >= totalPages ? T.pagDisabledColor : T.pagActiveColor, fontSize: 13, fontWeight: 600, cursor: page >= totalPages ? "not-allowed" : "pointer", fontFamily: "inherit" }}
              >Next <i className="fa-solid fa-chevron-right" style={{ fontSize: 10, marginLeft: 6 }} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
