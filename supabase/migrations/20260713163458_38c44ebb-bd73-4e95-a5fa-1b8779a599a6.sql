
-- Remove duplicate trigger if present
DROP TRIGGER IF EXISTS trg_prevent_role_escalation ON public.user_profiles;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, role, must_change_password)
  VALUES (
    NEW.id,
    CASE
      WHEN lower(NEW.email) IN ('huzzibhai@gmail.com','huzaifasiddike@gmail.com')
        THEN 'admin'::public.app_role
      ELSE 'gym_owner'::public.app_role
    END,
    false
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp', 'auth'
AS $$
DECLARE
  target_email text;
BEGIN
  IF NEW.role = 'admin'::public.app_role THEN
    SELECT lower(email) INTO target_email FROM auth.users WHERE id = NEW.user_id;
    IF target_email NOT IN ('huzzibhai@gmail.com','huzaifasiddike@gmail.com') THEN
      RAISE EXCEPTION 'Only designated super-admin accounts may hold the admin role.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Re-create single trigger
CREATE TRIGGER trg_prevent_role_escalation
BEFORE INSERT OR UPDATE ON public.user_profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_role_escalation();

-- Demote any legacy admin that is no longer in the allowed list
UPDATE public.user_profiles up
SET role = 'gym_owner'::public.app_role
FROM auth.users u
WHERE up.user_id = u.id
  AND up.role = 'admin'::public.app_role
  AND lower(u.email) NOT IN ('huzzibhai@gmail.com','huzaifasiddike@gmail.com');
