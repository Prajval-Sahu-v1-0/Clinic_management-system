"use client";

import React, { useState } from "react";
import { Badge, ActionButton, MobileActionMenu, ErrorMessage } from "@/components/DashboardShared";
import { useInventory, useMedicines } from "@/hooks/useAdminData";
import { T } from "./themeTokens";

function invStatus(qty: number, reorder: number): { label: string; color: string; bg: string } {
  if (qty === 0)      return { label: "Out of Stock", color: "#f87171", bg: T.dangerBg };
  if (qty <= reorder) return { label: "Low Stock",    color: T.copper, bg: "rgba(192,138,90,0.15)" };
  return                     { label: "In Stock",     color: T.sage,   bg: T.successBg };
}

export default function InventorySection() {
  const { data: items, loading, error, add, updateQty, remove, upsert } = useInventory();
  const { data: medicines, refetch: refetchMedicines } = useMedicines();

  const [showAdd, setShowAdd]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [modalErr, setModalErr]   = useState("");
  const [editQty, setEditQty]     = useState<Record<string, string>>({});

  const [mode, setMode]           = useState<"existing" | "new">("existing");
  const [selectedMedId, setSelectedMedId] = useState<string | number>("");
  const [qty, setQty]             = useState("");
  const [reorderLevel, setReorderLevel] = useState("10");
  const [newName, setNewName]     = useState("");
  const [newCat, setNewCat]       = useState("");
  const [newMfr, setNewMfr]       = useState("");
  const [newExpiry, setNewExpiry] = useState("");

  const selectedMed = (medicines ?? []).find(m => String(m.medicine_id) === String(selectedMedId));

  const resetModal = () => {
    setMode("existing"); setSelectedMedId(""); setQty(""); setReorderLevel("10");
    setNewName(""); setNewCat(""); setNewMfr(""); setNewExpiry(""); setModalErr("");
  };

  const handleAdd = async () => {
    if (!qty || Number(qty) <= 0) { setModalErr("Enter a valid quantity."); return; }
    setSaving(true); setModalErr("");
    try {
      if (mode === "existing") {
        if (!selectedMedId) { setModalErr("Select a product."); setSaving(false); return; }
        await upsert(String(selectedMedId), Number(qty), Number(reorderLevel) || 10);
      } else {
        if (!newName.trim()) { setModalErr("Medicine name is required."); setSaving(false); return; }
        await add(newName.trim(), newCat.trim() || null, newMfr.trim() || null, newExpiry || null, Number(qty), Number(reorderLevel) || 10);
        refetchMedicines();
      }
      setShowAdd(false);
      resetModal();
    } catch (e: any) { setModalErr(e.message ?? "Failed to save."); }
    finally { setSaving(false); }
  };

  const handleUpdateQty = async (inventoryId: string) => {
    const val = Number(editQty[inventoryId]);
    if (isNaN(val) || val < 0) return;
    await updateQty(inventoryId, val);
    setEditQty(prev => { const n = { ...prev }; delete n[inventoryId]; return n; });
  };

  const handleRemove = async (inventoryId: string, medicineId?: string | null) => {
    if (!confirm("Remove this item from inventory?")) return;
    await remove(inventoryId, medicineId);
    refetchMedicines();
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", background: T.inputBg, border: `1px solid ${T.inputBorder}`,
    borderRadius: 9, padding: "10px 14px", fontSize: 13, outline: "none",
    fontFamily: "inherit", boxSizing: "border-box", color: T.text1,
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 600, color: T.textLabel, display: "block", marginBottom: 5,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <ActionButton variant="primary" onClick={() => { setShowAdd(true); resetModal(); }}>
          <i className="fa-solid fa-plus" style={{ fontSize: 11 }} /> Add / Restock
        </ActionButton>
      </div>

      {error && <ErrorMessage message={error} />}

      <div className="responsive-table-wrap" style={{ background: T.tableBg, border: `1px solid ${T.cardBorder}`, borderRadius: 12, overflow: "hidden", boxShadow: T.cardShadow, backdropFilter: "blur(8px)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.tableRowBorder}`, background: T.tableHeaderBg }}>
              {["Item", "Category", "Manufacturer", "Expiry", "Qty", "Reorder At", "Status", "Actions"].map(h => (
                <th key={h} style={{ padding: "11px 18px", textAlign: "left", fontSize: 11, fontWeight: 700, color: T.text2, textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [1,2,3].map(i => (
                <tr key={i}>{[1,2,3,4,5,6,7,8].map(j => (
                  <td key={j} style={{ padding: "14px 18px" }}>
                    <div style={{ height: 13, borderRadius: 6, background: "linear-gradient(90deg,rgba(169,216,200,0.06) 25%,rgba(169,216,200,0.12) 50%,rgba(169,216,200,0.06) 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite", width: j === 1 ? "60%" : "80%" }} />
                  </td>
                ))}</tr>
              ))
            ) : (items ?? []).length === 0 ? (
              <tr><td colSpan={8} style={{ padding: "32px 18px", textAlign: "center", color: T.text3, fontSize: 14 }}>No inventory items found</td></tr>
            ) : (
              (items ?? []).map((item, idx) => {
                const s = invStatus(item.quantity_available, item.reorder_level);
                const isEditing = editQty[item.inventory_id] !== undefined;
                return (
                  <tr
                    key={item.inventory_id}
                    style={{ borderBottom: idx < (items ?? []).length - 1 ? `1px solid ${T.tableRowBorder}` : "none", transition: "background 0.1s" }}
                    onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = T.tableHoverBg}
                    onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}
                  >
                    <td style={{ padding: "14px 18px", fontWeight: 600, fontSize: 14, color: T.text1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <i className="fa-solid fa-capsules" style={{ color: T.sage, fontSize: 13 }} />
                        {item.medicine?.medicine_name ?? "—"}
                      </div>
                    </td>
                    <td style={{ padding: "14px 18px", fontSize: 13, color: T.text2 }}>
                      <span style={{ background: T.chipBg, borderRadius: 5, padding: "3px 9px", fontWeight: 500, fontSize: 12 }}>{item.medicine?.category ?? "—"}</span>
                    </td>
                    <td style={{ padding: "14px 18px", fontSize: 13, color: T.text2 }}>{item.medicine?.manufacturer ?? "—"}</td>
                    <td style={{ padding: "14px 18px", fontSize: 13, color: T.text3 }}>
                      {item.medicine?.expiry_date ? new Date(item.medicine.expiry_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      {isEditing ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <input type="number" min={0} value={editQty[item.inventory_id]}
                            onChange={e => setEditQty(prev => ({ ...prev, [item.inventory_id]: e.target.value }))}
                            style={{ width: 70, background: T.inputBg, border: `1px solid ${T.sage}`, borderRadius: 7, padding: "5px 8px", fontSize: 13, outline: "none", fontFamily: "inherit", color: T.text1 }}
                          />
                          <button onClick={() => handleUpdateQty(item.inventory_id)} style={{ background: T.sage, border: "none", borderRadius: 6, padding: "5px 10px", color: T.text1, fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>Save</button>
                          <button onClick={() => setEditQty(prev => { const n = { ...prev }; delete n[item.inventory_id]; return n; })} style={{ background: "none", border: `1px solid ${T.inputBorder}`, borderRadius: 6, padding: "5px 8px", fontSize: 12, cursor: "pointer", color: T.text3, fontFamily: "inherit" }}>✕</button>
                        </div>
                      ) : (
                        <div
                          style={{ fontWeight: 700, fontSize: 15, color: T.text1, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}
                          onClick={() => setEditQty(prev => ({ ...prev, [item.inventory_id]: String(item.quantity_available) }))}
                          title="Click to edit"
                        >
                          {item.quantity_available}
                          <i className="fa-solid fa-pen" style={{ fontSize: 10, color: T.text3 }} />
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "14px 18px", fontSize: 13, color: T.text3 }}>{item.reorder_level}</td>
                    <td style={{ padding: "14px 18px" }}>
                      <Badge label={s.label} color={s.color} bg={s.bg} />
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      <div className="desktop-actions">
                        <ActionButton variant="danger" onClick={() => handleRemove(item.inventory_id, item.medicine?.medicine_id)}>
                          <i className="fa-solid fa-trash" style={{ fontSize: 11 }} /> Remove
                        </ActionButton>
                      </div>
                      <div className="mobile-actions" style={{ display: "none" }}>
                        <MobileActionMenu actions={[
                          { label: "Remove", icon: "fa-solid fa-trash", danger: true, onClick: () => handleRemove(item.inventory_id, item.medicine?.medicine_id) },
                        ]} />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Restock Modal */}
      {showAdd && (
        <div onClick={() => { setShowAdd(false); resetModal(); }} style={{ position: "fixed", inset: 0, background: T.modalOverlay, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(6px)" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: T.modalBg, border: `1px solid ${T.modalBorder}`, borderRadius: 16, width: 440, maxWidth: "92vw", boxShadow: T.modalShadow, overflow: "hidden", backdropFilter: "blur(20px)" }}>
            <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${T.modalHeaderBorder}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: T.text1, fontFamily: "'Inter', sans-serif" }}>Add / Restock Item</div>
              <button onClick={() => { setShowAdd(false); resetModal(); }} style={{ background: "none", border: "none", cursor: "pointer", width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = T.closeBtnHover}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "transparent"}
              >
                <i className="fa-solid fa-xmark" style={{ color: T.text3, fontSize: 16 }} />
              </button>
            </div>

            <div style={{ padding: "16px 24px 0" }}>
              <div style={{ display: "flex", gap: 4, background: T.filterBg, borderRadius: 10, padding: 4, border: `1px solid ${T.cardBorder}` }}>
                {(["existing", "new"] as const).map(m => (
                  <button key={m} onClick={() => { setMode(m); setModalErr(""); }}
                    style={{
                      flex: 1, border: "none", borderRadius: 7, padding: "7px 12px",
                      background: mode === m ? T.filterActiveBg : "transparent",
                      color: mode === m ? T.filterActiveColor : T.filterInactiveColor,
                      fontSize: 12, fontWeight: mode === m ? 700 : 500,
                      cursor: "pointer", fontFamily: "inherit",
                      boxShadow: mode === m ? "0 2px 8px rgba(58,143,122,0.15)" : "none",
                      transition: "all 0.15s",
                    }}>
                    {m === "existing" ? "Existing Product" : "New Product"}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
              {mode === "existing" ? (
                <>
                  <div>
                    <label style={labelStyle}>Select Product *</label>
                    <select value={selectedMedId}
                      onChange={e => setSelectedMedId(e.target.value)}
                      style={inputStyle}>
                      <option value="">— choose a product —</option>
                      {(medicines ?? []).map(m => (
                        <option key={m.medicine_id} value={m.medicine_id}>{m.medicine_name}{m.category ? ` (${m.category})` : ""}</option>
                      ))}
                    </select>
                  </div>
                  {selectedMed && (
                    <div style={{ background: T.infoBg, border: `1px solid ${T.infoBorder}`, borderRadius: 9, padding: "10px 14px", fontSize: 12, color: T.sage, display: "flex", flexDirection: "column", gap: 3 }}>
                      {selectedMed.manufacturer && <span><b>Manufacturer:</b> {selectedMed.manufacturer}</span>}
                      {selectedMed.category && <span><b>Category:</b> {selectedMed.category}</span>}
                      {selectedMed.expiry_date && <span><b>Expiry:</b> {new Date(selectedMed.expiry_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>}
                      <span style={{ color: T.sage, fontWeight: 700, marginTop: 2 }}>
                        <i className="fa-solid fa-circle-info" style={{ marginRight: 5 }} />
                        Quantity will be added to existing stock.
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <label style={labelStyle}>Medicine Name *</label>
                    <input placeholder="e.g. Paracetamol 500mg" value={newName} onChange={e => setNewName(e.target.value)} style={inputStyle} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <label style={labelStyle}>Category</label>
                      <input placeholder="e.g. Analgesic" value={newCat} onChange={e => setNewCat(e.target.value)} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Manufacturer</label>
                      <input placeholder="e.g. GSK" value={newMfr} onChange={e => setNewMfr(e.target.value)} style={inputStyle} />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Expiry Date</label>
                    <input type="date" value={newExpiry} onChange={e => setNewExpiry(e.target.value)} style={inputStyle} />
                  </div>
                </>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={labelStyle}>Quantity *</label>
                  <input type="number" min={1} placeholder="e.g. 100" value={qty} onChange={e => setQty(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Reorder Level</label>
                  <input type="number" min={0} placeholder="e.g. 20" value={reorderLevel} onChange={e => setReorderLevel(e.target.value)} style={inputStyle} />
                </div>
              </div>

              {modalErr && (
                <div style={{ padding: "10px 14px", background: T.errorBg, border: `1px solid ${T.errorBorder}`, borderRadius: 8, color: T.errorColor, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                  <i className="fa-solid fa-circle-exclamation" style={{ fontSize: 13 }} /> {modalErr}
                </div>
              )}
            </div>

            <div style={{ padding: "14px 24px", borderTop: `1px solid ${T.modalHeaderBorder}`, display: "flex", justifyContent: "flex-end", gap: 10, background: T.modalFooterBg }}>
              <ActionButton onClick={() => { setShowAdd(false); resetModal(); }}>Cancel</ActionButton>
              <ActionButton variant="primary" onClick={handleAdd} disabled={saving}>
                {saving ? <><i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: 11 }} /> Saving…</> : <><i className="fa-solid fa-check" style={{ fontSize: 11 }} /> {mode === "existing" ? "Restock" : "Add New"}</>}
              </ActionButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
