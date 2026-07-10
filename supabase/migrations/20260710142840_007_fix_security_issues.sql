/*
# Fix 17 Security Issues for Production Publishing

## Summary
Resolves all security warnings detected by the security scanner:

1. **Function Search Path Mutable** — All SECURITY DEFINER functions now have
   `SET search_path = public` to prevent search_path injection attacks.
   Affected: calculate_days_absent, handle_new_user, is_admin,
   update_member_status_and_fines, update_updated_at_column.

2. **Duplicate / conflicting RLS policies on user_profiles** — Previous
   migrations created overlapping INSERT, SELECT, and UPDATE policies.
   All old policies are dropped and replaced with a clean, deduplicated set
   of 4 policies (one per CRUD verb) that cover both self-access and admin
   access in a single policy per operation.

## Security Notes
- No data is deleted or altered; this is a permissions-only change.
- All functions remain SECURITY DEFINER — the search_path pin removes the
  attack vector without changing any functional behaviour.
- The consolidated user_profiles policies are logically equivalent to the
  previous set, just deduplicated.
*/

-- ============================================================
-- 1. Fix all SECURITY DEFINER functions: pin search_path
-- ============================================================

CREATE OR REPLACE FUNCTION public.calculate_days_absent(member_id uuid)
  RETURNS integer
  LANGUAGE plpgsql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  last_visit_date date;
  days_absent integer;
BEGIN
  SELECT last_visit INTO last_visit_date
  FROM members WHERE id = member_id;

  IF last_visit_date IS NULL THEN
    days_absent := 9999;
  ELSE
    days_absent := CURRENT_DATE - last_visit_date;
  END IF;

  RETURN days_absent;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  user_count integer;
BEGIN
  SELECT COUNT(*) INTO user_count FROM user_profiles;

  IF user_count = 0 THEN
    INSERT INTO public.user_profiles (user_id, role)
    VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_profiles (user_id, role)
    VALUES (NEW.id, 'gym_owner');
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
  RETURNS boolean
  LANGUAGE plpgsql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM user_profiles
  WHERE user_id = auth.uid();

  RETURN user_role = 'admin';
END;
$$;

CREATE OR REPLACE FUNCTION public.update_member_status_and_fines()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  gym_fine_enabled boolean;
  gym_fine_amount integer;
  gym_grace_days integer;
  days_since_expiry integer;
  days_since_visit integer;
  should_apply_fine boolean;
BEGIN
  SELECT fine_enabled, fine_amount, fine_grace_days
  INTO gym_fine_enabled, gym_fine_amount, gym_grace_days
  FROM gyms WHERE id = NEW.gym_id;

  days_since_expiry := CURRENT_DATE - NEW.expiry_date;

  IF NEW.last_visit IS NULL THEN
    days_since_visit := 9999;
  ELSE
    days_since_visit := CURRENT_DATE - NEW.last_visit;
  END IF;

  IF days_since_expiry > 30 OR (days_since_visit > 30 AND days_since_expiry > 0) THEN
    NEW.status := 'Inactive';

    IF gym_fine_enabled AND days_since_expiry > gym_grace_days THEN
      IF NEW.fine_amount = 0 OR NEW.fine_amount < gym_fine_amount THEN
        NEW.fine_amount := gym_fine_amount;
        NEW.pending_dues := NEW.pending_dues + gym_fine_amount;
      END IF;
    END IF;

  ELSIF days_since_expiry >= 0 OR days_since_expiry >= -7 THEN
    IF days_since_expiry >= 0 THEN
      NEW.status := 'Expiring';
    END IF;

    IF gym_fine_enabled AND days_since_expiry >= 15 AND NEW.fine_amount = 0 THEN
      NEW.fine_amount := gym_fine_amount;
      NEW.pending_dues := NEW.pending_dues + gym_fine_amount;
    END IF;

  ELSE
    NEW.status := 'Active';
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.last_visit IS DISTINCT FROM NEW.last_visit THEN
    IF NEW.last_visit IS NOT NULL AND days_since_expiry < 0 THEN
      NEW.status := 'Active';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Also re-pin the two functions added in migration 006
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

-- ============================================================
-- 2. Consolidate duplicate user_profiles RLS policies
--    Drop ALL existing policies and recreate a clean set
-- ============================================================

-- Drop every existing policy on user_profiles
DROP POLICY IF EXISTS "select_own_profile"         ON user_profiles;
DROP POLICY IF EXISTS "select_user_profiles"       ON user_profiles;
DROP POLICY IF EXISTS "admin_select_all_profiles"  ON user_profiles;
DROP POLICY IF EXISTS "insert_own_profile"         ON user_profiles;
DROP POLICY IF EXISTS "insert_user_profiles"       ON user_profiles;
DROP POLICY IF EXISTS "update_own_profile"         ON user_profiles;
DROP POLICY IF EXISTS "update_user_profiles"       ON user_profiles;
DROP POLICY IF EXISTS "admin_update_any_profile"   ON user_profiles;
DROP POLICY IF EXISTS "delete_user_profiles"       ON user_profiles;

-- SELECT: own row OR admin sees all
CREATE POLICY "user_profiles_select"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_admin());

-- INSERT: own row OR admin creates on behalf (trigger also needs this)
CREATE POLICY "user_profiles_insert"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR is_admin());

-- UPDATE: own row OR admin can update any
CREATE POLICY "user_profiles_update"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING  (auth.uid() = user_id OR is_admin())
  WITH CHECK (auth.uid() = user_id OR is_admin());

-- DELETE: admin only
CREATE POLICY "user_profiles_delete"
  ON user_profiles FOR DELETE
  TO authenticated
  USING (is_admin());

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_current_user_role()      TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_current_user_suspended()  TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_role()      TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user()            TO service_role;
