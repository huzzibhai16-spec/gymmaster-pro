
-- Track whether owner must change password on next login (admin-provisioned temp password)
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false;

-- Harden new-user trigger: only the designated super-admin email may be admin.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public','pg_temp'
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, role, must_change_password)
  VALUES (
    NEW.id,
    CASE WHEN NEW.email = 'adminofos@gmail.com' THEN 'admin'::public.app_role
         ELSE 'gym_owner'::public.app_role END,
    false
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Prevent privilege escalation: no one may set role='admin' via the Data API
-- except when the target user is the designated super-admin email.
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public','pg_temp','auth'
AS $$
DECLARE
  target_email text;
BEGIN
  IF NEW.role = 'admin'::public.app_role THEN
    SELECT email INTO target_email FROM auth.users WHERE id = NEW.user_id;
    IF target_email IS DISTINCT FROM 'adminofos@gmail.com' THEN
      RAISE EXCEPTION 'Only the designated super-admin account may hold the admin role.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_role_escalation ON public.user_profiles;
CREATE TRIGGER trg_prevent_role_escalation
BEFORE INSERT OR UPDATE OF role ON public.user_profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_role_escalation();
