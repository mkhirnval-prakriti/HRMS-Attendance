-- ═══════════════════════════════════════════════════════════
-- Supabase Row Level Security (RLS) Policies
-- Prakriti Herbs CRM — Phase 4 Security
-- Run in: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════

-- ── Enable RLS on all tables ──────────────────────────────
ALTER TABLE users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders       ENABLE ROW LEVEL SECURITY;
ALTER TABLE dealers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance   ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaves       ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll      ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups   ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices     ENABLE ROW LEVEL SECURITY;

-- ── Helper function: get current user role ─────────────────
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS text AS $$
  SELECT role FROM users
  WHERE supabase_id = auth.uid()::text
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── Helper function: get current user id (integer) ─────────
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS integer AS $$
  SELECT id FROM users
  WHERE supabase_id = auth.uid()::text
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ═══════════════════════════════════════════════════════════
-- USERS TABLE
-- ═══════════════════════════════════════════════════════════

-- Admin sees all; others see only themselves
CREATE POLICY "users_select" ON users FOR SELECT
  USING (
    current_user_role() = 'Admin'
    OR supabase_id = auth.uid()::text
  );

-- Only Admin can insert/update/delete users
CREATE POLICY "users_insert" ON users FOR INSERT
  WITH CHECK (current_user_role() = 'Admin');

CREATE POLICY "users_update" ON users FOR UPDATE
  USING (
    current_user_role() = 'Admin'
    OR supabase_id = auth.uid()::text
  );

CREATE POLICY "users_delete" ON users FOR DELETE
  USING (current_user_role() = 'Admin');

-- ═══════════════════════════════════════════════════════════
-- ORDERS TABLE
-- ═══════════════════════════════════════════════════════════

-- Admin/ZM see all; agents see their own; Field see none
CREATE POLICY "orders_select" ON orders FOR SELECT
  USING (
    current_user_role() IN ('Admin', 'ZM')
    OR (current_user_role() = 'User' AND agent_id = current_user_id())
  );

CREATE POLICY "orders_insert" ON orders FOR INSERT
  WITH CHECK (
    current_user_role() IN ('Admin', 'ZM', 'User')
  );

CREATE POLICY "orders_update" ON orders FOR UPDATE
  USING (
    current_user_role() IN ('Admin', 'ZM')
    OR (current_user_role() = 'User' AND agent_id = current_user_id())
  );

CREATE POLICY "orders_delete" ON orders FOR DELETE
  USING (current_user_role() IN ('Admin', 'ZM'));

-- ═══════════════════════════════════════════════════════════
-- ATTENDANCE TABLE
-- ═══════════════════════════════════════════════════════════

-- Admin sees all; others see their own
CREATE POLICY "attendance_select" ON attendance FOR SELECT
  USING (
    current_user_role() IN ('Admin', 'ZM')
    OR user_id = current_user_id()
  );

CREATE POLICY "attendance_insert" ON attendance FOR INSERT
  WITH CHECK (
    current_user_role() IN ('Admin', 'ZM')
    OR user_id = current_user_id()
  );

CREATE POLICY "attendance_update" ON attendance FOR UPDATE
  USING (
    current_user_role() IN ('Admin', 'ZM')
    OR user_id = current_user_id()
  );

-- Only Admin can delete attendance
CREATE POLICY "attendance_delete" ON attendance FOR DELETE
  USING (current_user_role() = 'Admin');

-- ═══════════════════════════════════════════════════════════
-- LEAVES TABLE
-- ═══════════════════════════════════════════════════════════

CREATE POLICY "leaves_select" ON leaves FOR SELECT
  USING (
    current_user_role() IN ('Admin', 'ZM')
    OR user_id = current_user_id()
  );

CREATE POLICY "leaves_insert" ON leaves FOR INSERT
  WITH CHECK (user_id = current_user_id() OR current_user_role() IN ('Admin', 'ZM'));

CREATE POLICY "leaves_update" ON leaves FOR UPDATE
  USING (
    current_user_role() IN ('Admin', 'ZM')
    OR (user_id = current_user_id() AND status = 'Pending')
  );

CREATE POLICY "leaves_delete" ON leaves FOR DELETE
  USING (current_user_role() = 'Admin');

-- ═══════════════════════════════════════════════════════════
-- PAYROLL TABLE — Admin only
-- ═══════════════════════════════════════════════════════════

CREATE POLICY "payroll_select" ON payroll FOR SELECT
  USING (
    current_user_role() = 'Admin'
    OR user_id = current_user_id()
  );

CREATE POLICY "payroll_insert" ON payroll FOR INSERT
  WITH CHECK (current_user_role() = 'Admin');

CREATE POLICY "payroll_update" ON payroll FOR UPDATE
  USING (current_user_role() = 'Admin');

CREATE POLICY "payroll_delete" ON payroll FOR DELETE
  USING (current_user_role() = 'Admin');

-- ═══════════════════════════════════════════════════════════
-- AUDIT LOGS — Admin only (read), system writes
-- ═══════════════════════════════════════════════════════════

CREATE POLICY "audit_select" ON audit_logs FOR SELECT
  USING (current_user_role() = 'Admin');

-- Service role (backend) inserts audit logs
-- No user-level insert/update/delete

-- ═══════════════════════════════════════════════════════════
-- DEALERS TABLE
-- ═══════════════════════════════════════════════════════════

CREATE POLICY "dealers_select" ON dealers FOR SELECT
  USING (current_user_role() IN ('Admin', 'ZM', 'User'));

CREATE POLICY "dealers_insert" ON dealers FOR INSERT
  WITH CHECK (current_user_role() IN ('Admin', 'ZM'));

CREATE POLICY "dealers_update" ON dealers FOR UPDATE
  USING (current_user_role() IN ('Admin', 'ZM'));

CREATE POLICY "dealers_delete" ON dealers FOR DELETE
  USING (current_user_role() = 'Admin');

-- ═══════════════════════════════════════════════════════════
-- VERIFY RLS is enabled
-- ═══════════════════════════════════════════════════════════
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
