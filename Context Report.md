# Project Context Report

## Project Overview
- **Project Name:** Clinic Management System (`clinic-app`)
- **Type:** Full-stack Web Application
- **Path:** `c:\Users\sahup\OneDrive\Documents\Clinic Management System`

## Core Technologies
- **Framework:** Next.js (v16.1.7) using the App Router (`src/app` directory).
- **Library:** React (v19.2.3) & React DOM (v19.2.3).
- **Language:** TypeScript (`@types/node`, `@types/react`, `@types/react-dom`, `typescript` v5).
- **Styling:** Tailwind CSS (v4) configured with PostCSS. Admin pages use inline styles.
- **Authentication:** NextAuth.js (`next-auth` v5.0.0-beta.30) with JWT strategy.
- **Database:** Supabase (PostgreSQL) via `@supabase/supabase-js` v2.100.0.
- **Icons:** Font Awesome 6.5.1 (CDN) + `react-icons` v5.6.0.

## Application Structure & Routing
The app is structured to serve three distinct user roles:
1. **/admin:** Administration panel (dashboard, patients, staff, appointments, prescriptions, access & roles).
2. **/admin/access-role:** Discord-like RBAC management page (role editor, permission toggles, user-role assignments).
3. **/staff:** Clinic staff interface with appointments calendar and dark mode toggle.
4. **/patient:** Patient portal.

## Database Schema (Supabase — UUID-based)
| Table | Key Columns |
|---|---|
| `user` | user_id, name, email, password_hash, provider, role_id (legacy FK), department_id, status |
| `role` | role_id, role_name, priority |
| `permission` | permission_id, name, description |
| `user_roles` | user_id, role_id (many-to-many) |
| `role_permissions` | role_id, permission_id (many-to-many) |
| `role_audit` | id, user_id, changed_by, role_id, action, created_at |
| `patient` | patient_id, user_id, patient_name, contact_number, status, email |
| `staff` | staff_id, user_id, designation, specialization |
| `appointment` | appointment_id, patient_id, staff_id, appointment_time, status, appointment_type |
| `department` | department_id, department_name |
| `medicine` | medicine_id, supplier_id, medicine_name, batch_number, expiry_date, manufacturer, category |
| `inventory` | inventory_id, medicine_id, quantity_available, reorder_level |
| `inventory_transaction` | transaction_id, inventory_id, transaction_type, quantity_changed, transaction_time |
| `supplier` | supplier_id, supplier_name, contact_number |
| `audit_log` | log_id, user_id, action, table_affected, timestamp |

## Authentication & Authorization
- NextAuth configurations: `auth.ts` (root) + `src/app/api/auth/`.
- Providers: Google OAuth + Credentials (email/password via Supabase + bcrypt).
- Middleware: `src/middleware.ts` — role-based route protection (`/admin` → admin, `/staff` → staff, `/patient` → patient).
- **RBAC system** (`src/lib/rbac/index.ts`):
  - `getUserRoles(userId)` — via `user_roles` junction table.
  - `getUserPermissions(userId)` — via `user_roles → role_permissions → permission`.
  - `hasPermission(userId, perm)` — RBAC check with legacy admin fallback.
  - `requirePermission(perm)` — API route guard.
- Legacy `user.role_id` auto-synced when roles change.

## RBAC API Routes (`src/app/api/admin/roles/`)
| Route | Method | Purpose |
|---|---|---|
| `/api/admin/roles` | GET | List roles with permissions |
| `/api/admin/roles` | POST | Create new role |
| `/api/admin/roles` | PATCH | Update role name |
| `/api/admin/roles/assign` | POST | Assign role to user |
| `/api/admin/roles/remove` | POST | Remove role from user |
| `/api/admin/roles/users` | GET | List users with roles |
| `/api/admin/roles/permissions` | POST | Toggle permission on role |
| `/api/admin/roles/priority` | POST | Update role priority |

## Development Setup
- Uses `eslint` for linting.
- Standard Next.js scripts: `npm run dev`, `npm run build`, `npm run start`.
- Demo staff account: `staff@demo.com` / `staffPassword123`.

## Active Files & Recent Development Focus
- **Current Active Files:**
  - `Context Report.md`
  - `src/app/globals.css`
  - `src/app/admin/page.tsx`
  - `src/app/admin/access-role/page.tsx`
  - `src/lib/supabase.ts`
- **Recent Focus:**
  - **Finished Work:**
    - **Dashboard Architecture Analysis**: Performed comprehensive structural analysis of the multi-dashboard system, mapped roles to corresponding dashboards, identified UI component redundancies, and defined a unified set of features to enable a more modular and scalable architecture.
    - **Dark Mode Theme Refinement**: Improved visual quality, consistency, color palette, and contrast of the dark theme across dashboards for a polished and accessible user experience.
    - **Access & Role System (RBAC)**: Defined a Discord-like role management backend/UI with permission toggles, user-role assignments, and Supabase integration.
    - **Admin Analytics Integration**: Connected Supabase backend for dynamic loading of stats, users, roles, appointments, and prescriptions.
  - **Next Steps:**
    - Begin refactoring based on the modular and scalable architecture defined during the structural analysis.
    - Continue end-to-end testing of the newly created RBAC system in the browser against live Supabase data.
