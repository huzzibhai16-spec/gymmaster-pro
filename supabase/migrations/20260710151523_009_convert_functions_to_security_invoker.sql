/*
# Convert All Functions to SECURITY INVOKER

## Summary
Supabase automatically grants EXECUTE to anon and authenticated on all
functions, and REVOKE FROM PUBLIC does not persist. The security scanner
only flags SECURITY DEFINER functions callable by anon/authenticated.
Converting all functions to SECURITY INVOKER resolves all 14 warnings.

## Why SECURITY INVOKER is safe here

- **Trigger functions** (handle_new_user, update_member_status_and_fines,
  update_updated_at_column): In Supabase, triggers on auth.users fire from
  the GoTrue auth server which runs as a privileged role that bypasses RLS.
  Triggers on gym data tables fire from authenticated users who already have
  RLS permission to modify their own gym's data.

- **get_current_user_role, is_current_user_suspended**: Read from user_profiles
  where RLS already allows users to SELECT their own row. As INVOKER, RLS
  applies, so users can only read their own data — exactly the intended behavior.

- **is_admin**: No longer called from RLS policies (replaced with inline
  subquery in migration 008). Not called from frontend. Harmless as INVOKER.

- **calculate_days_absent**: Not called from frontend. As INVOKER, RLS applies
  to the members table read inside the function.

## Changes
All 7 functions recreated as SECURITY INVOKER with SET search_path = public.
*/

CREATE OR REPLACE FUNCTION public.calculate_days_absent(member_id uuid)
  RETURNS integer
  LANGUAGE plpgsql
  STABLE
  SECURITY INVOKER
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
  SECURITY INVOKER
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
  SECURITY INVOKER
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
  SECURITY INVOKER
  SET search_path = public
AS $$
DECLARE
  gym_fine_enabled boolean;
  gym_fine_amount integer;
  gym_grace_days integer;
  days_since_expiry integer;
  days_since_visit integer;
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
  SECURITY INVOKER
  SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

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
