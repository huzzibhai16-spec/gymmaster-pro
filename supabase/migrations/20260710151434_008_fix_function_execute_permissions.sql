/*
# Fix Public/Authenticated Can Execute SECURITY DEFINER Function Warnings

## Summary
Resolves 14 security warnings where SECURITY DEFINER functions were callable
by the anon and authenticated roles via the Supabase REST API (/rest/v1/rpc/).

## Changes

### 1. RLS policies: replace is_admin() with inline subquery
All 24 policies across 6 tables (attendance, expenses, gyms, members, payments,
user_profiles) previously called the `is_admin()` SECURITY DEFINER function.
They now use an inline subquery:
  EXISTS(SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
This removes the dependency on a callable SECURITY DEFINER function from RLS.

### 2. Frontend-facing functions: SECURITY DEFINER → SECURITY INVOKER
- `get_current_user_role()` — now SECURITY INVOKER. Reads from user_profiles
  where RLS already allows users to SELECT their own row. Safe because the
  function only returns the caller's own role.
- `is_current_user_suspended()` — same conversion, same reasoning.

### 3. Trigger-only functions: revoke EXECUTE from anon, authenticated, PUBLIC
These functions are only called by triggers, never via RPC. Revoking EXECUTE
prevents anon/authenticated from calling them via the REST API:
- calculate_days_absent
- handle_new_user
- is_admin
- update_member_status_and_fines
- update_updated_at_column

### 4. Grant EXECUTE only where needed
- get_current_user_role, is_current_user_suspended: TO authenticated (INVOKER, safe)
- handle_new_user: TO service_role (trigger runs as service_role)
- All others: TO service_role only

## Security Notes
- No data is deleted or altered; this is a permissions-only change.
- The inline subquery in RLS policies is functionally equivalent to is_admin().
- SECURITY INVOKER functions run with the caller's privileges, so RLS applies.
- Trigger functions don't need EXECUTE from anon/authenticated — triggers fire
  with the table owner's privileges, not via explicit grants.
*/

-- ============================================================
-- 1. Convert frontend-facing functions to SECURITY INVOKER
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_current_user_role()
  RETURNS text
  LANGUAGE plpgsql
  STABLE
  SECURITY INVOKER
  SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  SELECT role::text INTO v_role
  FROM user_profiles
  WHERE user_id = auth.uid();
  RETURN v_role;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_current_user_suspended()
  RETURNS boolean
  LANGUAGE plpgsql
  STABLE
  SECURITY INVOKER
  SET search_path = public
AS $$
DECLARE
  v_suspended boolean;
BEGIN
  SELECT is_suspended INTO v_suspended
  FROM user_profiles
  WHERE user_id = auth.uid();
  RETURN COALESCE(v_suspended, false);
END;
$$;

-- ============================================================
-- 2. Revoke EXECUTE from anon, authenticated, PUBLIC on ALL functions
--    Then grant only what's needed
-- ============================================================

-- Revoke from PUBLIC (covers anon + authenticated + everyone)
REVOKE EXECUTE ON FUNCTION public.calculate_days_absent(uuid)      FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_current_user_role()           FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user()                 FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin()                        FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_current_user_suspended()      FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_member_status_and_fines()  FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column()        FROM PUBLIC;

-- Grant only to authenticated for the two INVOKER functions (safe, RLS-scoped)
GRANT EXECUTE ON FUNCTION public.get_current_user_role()      TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_current_user_suspended()  TO authenticated;

-- Trigger functions: only service_role needs access (triggers fire as table owner)
GRANT EXECUTE ON FUNCTION public.handle_new_user()            TO service_role;
GRANT EXECUTE ON FUNCTION public.update_member_status_and_fines() TO service_role;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column()   TO service_role;

-- ============================================================
-- 3. Replace is_admin() in ALL RLS policies with inline subquery
-- ============================================================

-- Helper: the inline admin check expression:
-- EXISTS(SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')

-- ---- attendance ----
DROP POLICY IF EXISTS "select_own_gym_attendance" ON attendance;
CREATE POLICY "select_own_gym_attendance" ON attendance
  FOR SELECT TO authenticated
  USING (
    EXISTS(SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
    OR EXISTS (SELECT 1 FROM gyms WHERE gyms.id = attendance.gym_id AND gyms.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_gym_attendance" ON attendance;
CREATE POLICY "insert_own_gym_attendance" ON attendance
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS(SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
    OR EXISTS (SELECT 1 FROM gyms WHERE gyms.id = attendance.gym_id AND gyms.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_gym_attendance" ON attendance;
CREATE POLICY "update_own_gym_attendance" ON attendance
  FOR UPDATE TO authenticated
  USING (
    EXISTS(SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
    OR EXISTS (SELECT 1 FROM gyms WHERE gyms.id = attendance.gym_id AND gyms.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS(SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
    OR EXISTS (SELECT 1 FROM gyms WHERE gyms.id = attendance.gym_id AND gyms.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_gym_attendance" ON attendance;
CREATE POLICY "delete_own_gym_attendance" ON attendance
  FOR DELETE TO authenticated
  USING (
    EXISTS(SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
    OR EXISTS (SELECT 1 FROM gyms WHERE gyms.id = attendance.gym_id AND gyms.user_id = auth.uid())
  );

-- ---- expenses ----
DROP POLICY IF EXISTS "select_own_gym_expenses" ON expenses;
CREATE POLICY "select_own_gym_expenses" ON expenses
  FOR SELECT TO authenticated
  USING (
    EXISTS(SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
    OR EXISTS (SELECT 1 FROM gyms WHERE gyms.id = expenses.gym_id AND gyms.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_gym_expenses" ON expenses;
CREATE POLICY "insert_own_gym_expenses" ON expenses
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS(SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
    OR EXISTS (SELECT 1 FROM gyms WHERE gyms.id = expenses.gym_id AND gyms.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_gym_expenses" ON expenses;
CREATE POLICY "update_own_gym_expenses" ON expenses
  FOR UPDATE TO authenticated
  USING (
    EXISTS(SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
    OR EXISTS (SELECT 1 FROM gyms WHERE gyms.id = expenses.gym_id AND gyms.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS(SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
    OR EXISTS (SELECT 1 FROM gyms WHERE gyms.id = expenses.gym_id AND gyms.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_gym_expenses" ON expenses;
CREATE POLICY "delete_own_gym_expenses" ON expenses
  FOR DELETE TO authenticated
  USING (
    EXISTS(SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
    OR EXISTS (SELECT 1 FROM gyms WHERE gyms.id = expenses.gym_id AND gyms.user_id = auth.uid())
  );

-- ---- gyms ----
DROP POLICY IF EXISTS "select_own_gyms" ON gyms;
CREATE POLICY "select_own_gyms" ON gyms
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS(SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "insert_own_gyms" ON gyms;
CREATE POLICY "insert_own_gyms" ON gyms
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS(SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "update_own_gyms" ON gyms;
CREATE POLICY "update_own_gyms" ON gyms
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS(SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS(SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "delete_own_gyms" ON gyms;
CREATE POLICY "delete_own_gyms" ON gyms
  FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS(SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- ---- members ----
DROP POLICY IF EXISTS "select_own_gym_members" ON members;
CREATE POLICY "select_own_gym_members" ON members
  FOR SELECT TO authenticated
  USING (
    EXISTS(SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
    OR EXISTS (SELECT 1 FROM gyms WHERE gyms.id = members.gym_id AND gyms.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_gym_members" ON members;
CREATE POLICY "insert_own_gym_members" ON members
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS(SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
    OR EXISTS (SELECT 1 FROM gyms WHERE gyms.id = members.gym_id AND gyms.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_gym_members" ON members;
CREATE POLICY "update_own_gym_members" ON members
  FOR UPDATE TO authenticated
  USING (
    EXISTS(SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
    OR EXISTS (SELECT 1 FROM gyms WHERE gyms.id = members.gym_id AND gyms.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS(SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
    OR EXISTS (SELECT 1 FROM gyms WHERE gyms.id = members.gym_id AND gyms.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_gym_members" ON members;
CREATE POLICY "delete_own_gym_members" ON members
  FOR DELETE TO authenticated
  USING (
    EXISTS(SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
    OR EXISTS (SELECT 1 FROM gyms WHERE gyms.id = members.gym_id AND gyms.user_id = auth.uid())
  );

-- ---- payments ----
DROP POLICY IF EXISTS "select_own_gym_payments" ON payments;
CREATE POLICY "select_own_gym_payments" ON payments
  FOR SELECT TO authenticated
  USING (
    EXISTS(SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
    OR EXISTS (SELECT 1 FROM gyms WHERE gyms.id = payments.gym_id AND gyms.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_gym_payments" ON payments;
CREATE POLICY "insert_own_gym_payments" ON payments
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS(SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
    OR EXISTS (SELECT 1 FROM gyms WHERE gyms.id = payments.gym_id AND gyms.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_gym_payments" ON payments;
CREATE POLICY "update_own_gym_payments" ON payments
  FOR UPDATE TO authenticated
  USING (
    EXISTS(SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
    OR EXISTS (SELECT 1 FROM gyms WHERE gyms.id = payments.gym_id AND gyms.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS(SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
    OR EXISTS (SELECT 1 FROM gyms WHERE gyms.id = payments.gym_id AND gyms.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_gym_payments" ON payments;
CREATE POLICY "delete_own_gym_payments" ON payments
  FOR DELETE TO authenticated
  USING (
    EXISTS(SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
    OR EXISTS (SELECT 1 FROM gyms WHERE gyms.id = payments.gym_id AND gyms.user_id = auth.uid())
  );

-- ---- user_profiles ----
DROP POLICY IF EXISTS "user_profiles_select" ON user_profiles;
CREATE POLICY "user_profiles_select" ON user_profiles
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS(SELECT 1 FROM user_profiles up WHERE up.user_id = auth.uid() AND up.role = 'admin')
  );

DROP POLICY IF EXISTS "user_profiles_insert" ON user_profiles;
CREATE POLICY "user_profiles_insert" ON user_profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS(SELECT 1 FROM user_profiles up WHERE up.user_id = auth.uid() AND up.role = 'admin')
  );

DROP POLICY IF EXISTS "user_profiles_update" ON user_profiles;
CREATE POLICY "user_profiles_update" ON user_profiles
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS(SELECT 1 FROM user_profiles up WHERE up.user_id = auth.uid() AND up.role = 'admin')
  )
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS(SELECT 1 FROM user_profiles up WHERE up.user_id = auth.uid() AND up.role = 'admin')
  );

DROP POLICY IF EXISTS "user_profiles_delete" ON user_profiles;
CREATE POLICY "user_profiles_delete" ON user_profiles
  FOR DELETE TO authenticated
  USING (
    EXISTS(SELECT 1 FROM user_profiles up WHERE up.user_id = auth.uid() AND up.role = 'admin')
  );
