"use client";

import React, { useState } from "react";
import { Badge, ActionButton, ErrorMessage } from "@/components/DashboardShared";
import { useInventory, useMedicines } from "@/hooks/useAdminData";

function invStatus(qty: number, reorder: number): { label: string; color: string; bg: string } {
  if (qty === 0)      return { label: "Out of Stock", color: "#dc2626", bg: "#fef2f2" };
  if (qty <= reorder) return { label: "Low Stock",    color: "#d97706", bg: "#fffbeb" };
  return                     { label: "In Stock",     color: "#0d9488", bg: "#f0fdfa" };
}

export default function InventorySection() {
  const { data: items, loading, error, add, updateQty, remove, upsert } = useInventory();
  const { data: medicines } = useMedicines();

  const [showAdd, setShowAdd]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [modalErr, setModalErr]   = useState("");
  const [editQty, setEditQty]     = useState<Record<number, string>>({});

  const [mode, setMode]           = useState<"existing" | "new">("existing");
  const [selectedMedId, setSelectedMedId] = useState<number | "">(  "");
  const [qty, setQty]             = useState("");
  const [reorderLevel, setReorderLevel] = useState("10");
  const [newName, setNewName]     = useState("");
  const [newCat, setNewCat]       = useState("");
  const [newMfr, setNewMfr]       = useState("");
  const [newExpiry, setNewExpiry] = useState("");

  const selectedMed = (medicines ?? []).find(m => m.medicine_id === selectedMedId);

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
        await upsert(Number(selectedMedId), Number(qty), Number(reorderLevel) || 10);
      } else {
        if (!newName.trim()) { setModalErr("Medicine name is required."); setSaving(false); return; }
        await add(newName.trim(), newCat.trim() || null, newMfr.trim() || null, newExpiry || null, Number(qty), Number(reorderLevel) || 10);
      }
      setShowAdd(false);
      resetModal();
    } catch (e: any) { setModalErr(e.message ?? "Failed to save."); }
    finally { setSaving(false); }
  };

  const handleUpdateQty = async (inventoryId: number) => {
    const val = Number(editQty[inventoryId]);
    if (isNaN(val) || val < 0) return;
    await updateQty(inventoryId, val);
    setEditQty(prev => { const n = { ...prev }; delete n[inventoryId]; return n; });
  };

  const handleRemove = async (inventoryId: number, medicineId: number) => {
    if (!confirm("Remove this item from inventory?")) return;
    await remove(inventoryId, medicineId);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "#fff", border: "1px solid #e5e7eb",
    borderRadius: 9, padding: "10px 14px", fontSize: 13, outline: "none",
    fontFamily: "inherit", boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <ActionButton variant="primary" onClick={() => { setShowAdd(true); resetModal(); }}>
          <i className="fa-solid fa-plus" style={{ fontSize: 11 }} /> Add / Restock
        </ActionButton>
      </div>

      {error && <ErrorMessage message={error} />}

      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #f3f4f6", background: "#f9fafb" }}>
              {["Item", "Category", "Manufacturer", "Expiry", "Qty", "Reorder At", "Status", "Actions"].map(h => (
                <th key={h} style={{ padding: "11px 18px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [1,2,3].map(i => (
                <tr key={i}>{[1,2,3,4,5,6,7,8].map(j => (
                  <td key={j} style={{ padding: "14px 18px" }}>
                    <div style={{ height: 13, borderRadius: 6, background: "linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite", width: j === 1 ? "60%" : "80%" }} />
                  </td>
                ))}</tr>
              ))
            ) : (items ?? []).length === 0 ? (
              <tr><td colSpan={8} style={{ padding: "32px 18px", textAlign: "center", color: "#9ca3af", fontSize: 14 }}>No inventory items found</td></tr>
            ) : (
              (items ?? []).map((item, idx) => {
                const s = invStatus(item.quantity_available, item.reorder_level);
                const isEditing = editQty[item.inventory_id] !== undefined;
                return (
                  <tr
                    key={item.inventory_id}
                    style={{ borderBottom: idx < (items ?? []).length - 1 ? "1px solid #f3f4f6" : "none", transition: "background 0.1s" }}
                    onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = "#f9fafb"}
                    onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}
                  >
                    <td style={{ padding: "14px 18px", fontWeight: 600, fontSize: 14, color: "#111827" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <i className="fa-solid fa-capsules" style={{ color: "#0d9488", fontSize: 13 }} />
                        {item.medicine?.medicine_name ?? "—"}
                      </div>
                    </td>
                    <td style={{ padding: "14px 18px", fontSize: 13, color: "#6b7280" }}>
                      <span style={{ background: "#f3f4f6", borderRadius: 5, padding: "3px 9px", fontWeight: 500, fontSize: 12 }}>{item.medicine?.category ?? "—"}</span>
                    </td>
                    <td style={{ padding: "14px 18px", fontSize: 13, color: "#6b7280" }}>{item.medicine?.manufacturer ?? "—"}</td>
                    <td style={{ padding: "14px 18px", fontSize: 13, color: "#9ca3af" }}>
                      {item.medicine?.expiry_date ? new Date(item.medicine.expiry_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      {isEditing ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <input type="number" min={0} value={editQty[item.inventory_id]}
                            onChange={e => setEditQty(prev => ({ ...prev, [item.inventory_id]: e.target.value }))}
                            style={{ width: 70, background: "#fff", border: "1px solid #0d9488", borderRadius: 7, padding: "5px 8px", fontSize: 13, outline: "none", fontFamily: "inherit" }}
                          />
                          <button onClick={() => handleUpdateQty(item.inventory_id)} style={{ background: "#0d9488", border: "none", borderRadius: 6, padding: "5px 10px", color: "#fff", fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>Save</button>
                          <button onClick={() => setEditQty(prev => { const n = { ...prev }; delete n[item.inventory_id]; return n; })} style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: 6, padding: "5px 8px", fontSize: 12, cursor: "pointer", color: "#9ca3af", fontFamily: "inherit" }}>✕</button>
                        </div>
                      ) : (
                        <div
                          style={{ fontWeight: 700, fontSize: 15, color: "#111827", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}
                          onClick={() => setEditQty(prev => ({ ...prev, [item.inventory_id]: String(item.quantity_available) }))}
                          title="Click to edit"
                        >
                          {item.quantity_available}
                          <i className="fa-solid fa-pen" style={{ fontSize: 10, color: "#9ca3af" }} />
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "14px 18px", fontSize: 13, color: "#9ca3af" }}>{item.reorder_level}</td>
                    <td style={{ padding: "14px 18px" }}>
                      <Badge label={s.label} color={s.color} bg={s.bg} />
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      <ActionButton variant="danger" onClick={() => handleRemove(item.inventory_id, item.medicine?.medicine_id)}>
                        <i className="fa-solid fa-trash" style={{ fontSize: 11 }} /> Remove
                      </ActionButton>
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
        <div onClick={() => { setShowAdd(false); resetModal(); }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(3px)" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, width: 440, maxWidth: "92vw", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", overflow: "hidden" }}>
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#111827", fontFamily: "'Outfit', sans-serif" }}>Add / Restock Item</div>
              <button onClick={() => { setShowAdd(false); resetModal(); }} style={{ background: "none", border: "none", cursor: "pointer", width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "#f3f4f6"}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "transparent"}
              >
                <i className="fa-solid fa-xmark" style={{ color: "#9ca3af", fontSize: 16 }} />
              </button>
            </div>

            <div style={{ padding: "16px 24px 0" }}>
              <div style={{ display: "flex", gap: 4, background: "#f3f4f6", borderRadius: 10, padding: 4 }}>
                {(["existing", "new"] as const).map(m => (
                  <button key={m} onClick={() => { setMode(m); setModalErr(""); }}
                    style={{
                      flex: 1, border: "none", borderRadius: 7, padding: "7px 12px",
                      background: mode === m ? "#fff" : "transparent",
                      color: mode === m ? "#111827" : "#6b7280",
                      fontSize: 12, fontWeight: mode === m ? 700 : 500,
                      cursor: "pointer", fontFamily: "inherit",
                      boxShadow: mode === m ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
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
                      onChange={e => setSelectedMedId(e.target.value === "" ? "" : Number(e.target.value))}
                      style={inputStyle}>
                      <option value="">— choose a product —</option>
                      {(medicines ?? []).map(m => (
                        <option key={m.medicine_id} value={m.medicine_id}>{m.medicine_name}{m.category ? ` (${m.category})` : ""}</option>
                      ))}
                    </select>
                  </div>
                  {selectedMed && (
                    <div style={{ background: "#f0fdfa", border: "1px solid #ccfbf1", borderRadius: 9, padding: "10px 14px", fontSize: 12, color: "#0f766e", display: "flex", flexDirection: "column", gap: 3 }}>
                      {selectedMed.manufacturer && <span><b>Manufacturer:</b> {selectedMed.manufacturer}</span>}
                      {selectedMed.category && <span><b>Category:</b> {selectedMed.category}</span>}
                      {selectedMed.expiry_date && <span><b>Expiry:</b> {new Date(selectedMed.expiry_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>}
                      <span style={{ color: "#0d9488", fontWeight: 700, marginTop: 2 }}>
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
                <div style={{ padding: "10px 14px", background: "#fef2f2", border: "1px solid #fee2e2", borderRadius: 8, color: "#dc2626", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                  <i className="fa-solid fa-circle-exclamation" style={{ fontSize: 13 }} /> {modalErr}
                </div>
              )}
            </div>

            <div style={{ padding: "14px 24px", borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "flex-end", gap: 10, background: "#f9fafb" }}>
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
