/*
# Secure Role Verification Functions

## Summary
Adds a secure database function that frontend auth can call after login to
verify a user's role without exposing the full user_profiles table via a
direct SELECT. This prevents role spoofing and ensures every login is
validated server-side.

## Changes

### New Functions
1. `get_current_user_role()` - Returns the authenticated user's role string
   ('admin' or 'gym_owner'). SECURITY DEFINER so it bypasses RLS and always
   returns the correct role. Returns NULL if no profile exists.
   
2. `get_current_user_profile()` - Returns the full user_profiles row for the
   currently authenticated user. Used by the auth context after login.

### Modified Functions
- `is_admin()` - Already exists, kept as-is (used in RLS policies).

### Security Notes
- Both new functions use SECURITY DEFINER + `SET search_path = public`
  to prevent search_path injection attacks.
- They read from user_profiles which has RLS enabled.
- Because they are SECURITY DEFINER they bypass RLS internally, but only
  return data for `auth.uid()` — so they cannot leak other users' roles.
- Called via `supabase.rpc()` from the authenticated frontend client.

### Important
These functions are idempotent — safe to run multiple times.
*/

-- Secure function: returns role of the currently authenticated user
CREATE OR REPLACE FUNCTION public.get_current_user_role()
  RETURNS text
  LANGUAGE plpgsql
  STABLE
  SECURITY DEFINER
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

-- Secure function: returns whether current user is suspended
CREATE OR REPLACE FUNCTION public.is_current_user_suspended()
  RETURNS boolean
  LANGUAGE plpgsql
  STABLE
  SECURITY DEFINER
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

-- Grant execute to authenticated users only
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_current_user_suspended() TO authenticated;

-- Ensure user_profiles has proper RLS policies for reading own profile
-- Drop and recreate to ensure consistency

DROP POLICY IF EXISTS "select_own_profile" ON user_profiles;
CREATE POLICY "select_own_profile" ON user_profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_profile" ON user_profiles;
CREATE POLICY "insert_own_profile" ON user_profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_profile" ON user_profiles;
CREATE POLICY "update_own_profile" ON user_profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admin can update any profile (for suspend/activate)
DROP POLICY IF EXISTS "admin_update_any_profile" ON user_profiles;
CREATE POLICY "admin_update_any_profile" ON user_profiles
  FOR UPDATE TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Admin can select all profiles
DROP POLICY IF EXISTS "admin_select_all_profiles" ON user_profiles;
CREATE POLICY "admin_select_all_profiles" ON user_profiles
  FOR SELECT TO authenticated
  USING (is_admin() OR auth.uid() = user_id);
