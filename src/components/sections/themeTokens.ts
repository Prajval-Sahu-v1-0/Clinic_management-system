// ─── Shared Theme Tokens for Section Components ──────────────────────────────
// These constants standardize the nature palette across all section components
// so inline styles don't need to repeat hex values.

export const T = {
  // Surfaces
  cardBg: "var(--theme-card-bg)",
  cardBorder: "var(--theme-card-border)",
  cardShadow: "var(--theme-card-shadow)",
  
  // Table
  tableBg: "var(--theme-table-bg)",
  tableHeaderBg: "var(--theme-table-header-bg)",
  tableRowBorder: "var(--theme-table-row-border)",
  tableHoverBg: "var(--theme-table-hover-bg)",
  
  // Modal
  modalOverlay: "var(--theme-modal-overlay)",
  modalBg: "var(--theme-modal-bg)",
  modalBorder: "var(--theme-modal-border)",
  modalShadow: "var(--theme-modal-shadow)",
  modalHeaderBorder: "var(--theme-modal-header-border)",
  modalFooterBg: "var(--theme-modal-footer-bg)",
  
  // Text
  text1: "var(--theme-text1)",       
  text2: "var(--theme-text2)",       
  text3: "var(--theme-text3)",  
  textLabel: "var(--theme-text-label)",   
  
  // Accent colors (mostly consistent across themes)
  sage: "var(--sage)",
  mint: "var(--mint)",
  copper: "var(--copper)",
  forest: "var(--forest)",
  
  // Input
  inputBg: "var(--theme-input-bg)",
  inputBorder: "var(--theme-input-border)",
  
  // Filter tabs
  filterBg: "var(--theme-filter-bg)",
  filterActiveBg: "var(--theme-filter-active-bg)",
  filterActiveColor: "var(--theme-filter-active-color)",
  filterInactiveColor: "var(--theme-filter-inactive-color)",
  
  // Chip / badge bg
  chipBg: "var(--theme-chip-bg)",
  chipColor: "var(--theme-chip-color)",
  
  // Error
  errorBg: "var(--theme-danger-bg)",
  errorBorder: "var(--theme-danger-border)",
  errorColor: "var(--theme-danger-color)",
  
  // Success
  successBg: "var(--theme-success-bg)",
  successBorder: "var(--theme-success-border)",
  successColor: "var(--theme-success-color)",
  
  // Info callout
  infoBg: "var(--theme-info-bg)",
  infoBorder: "var(--theme-info-border)",
  infoColor: "var(--theme-info-color)",
  
  // Danger surfaces
  dangerBg: "var(--theme-danger-bg)",
  dangerBorder: "var(--theme-danger-border)",
  dangerColor: "var(--theme-danger-color)",
  
  // Avatar
  avatarBg: "var(--theme-avatar-bg)",
  avatarBorder: "var(--theme-avatar-border)",
  avatarColor: "var(--theme-avatar-color)",
  
  // Pill icon bg — now uses CSS variable so it adapts between light and dark
  iconBg: "var(--theme-icon-bg)",
  iconColor: "var(--theme-icon-color)",
  
  // Close button hover
  closeBtnHover: "var(--theme-close-btn-hover)",
  
  // Search icon
  searchIcon: "var(--theme-search-icon)",

  // Pagination
  pagBg: "var(--theme-pag-bg)",
  pagBorder: "var(--theme-pag-border)",
  pagDisabledBg: "var(--theme-pag-disabled-bg)",
  pagDisabledColor: "var(--theme-pag-disabled-color)",
  pagActiveColor: "var(--theme-pag-active-color)",
} as const;
