
-- Move has_role() to a private schema so it's not callable via the exposed Data API,
-- while remaining usable inside RLS policies.
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = _user_id AND role = _role
  )
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO postgres, service_role;

-- Recreate policies to use private.has_role
DROP POLICY IF EXISTS "own profile update" ON public.user_profiles;
DROP POLICY IF EXISTS "own profile read" ON public.user_profiles;
CREATE POLICY "own profile read" ON public.user_profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'));
CREATE POLICY "own profile update" ON public.user_profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "owner or admin gyms" ON public.gyms;
CREATE POLICY "owner or admin gyms" ON public.gyms
  FOR ALL TO authenticated
  USING (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "gym scoped members" ON public.members;
CREATE POLICY "gym scoped members" ON public.members
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.gyms g WHERE g.id = members.gym_id AND (g.user_id = auth.uid() OR private.has_role(auth.uid(), 'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.gyms g WHERE g.id = members.gym_id AND (g.user_id = auth.uid() OR private.has_role(auth.uid(), 'admin'))));

DROP POLICY IF EXISTS "gym scoped attendance" ON public.attendance;
CREATE POLICY "gym scoped attendance" ON public.attendance
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.gyms g WHERE g.id = attendance.gym_id AND (g.user_id = auth.uid() OR private.has_role(auth.uid(), 'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.gyms g WHERE g.id = attendance.gym_id AND (g.user_id = auth.uid() OR private.has_role(auth.uid(), 'admin'))));

DROP POLICY IF EXISTS "gym scoped payments" ON public.payments;
CREATE POLICY "gym scoped payments" ON public.payments
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.gyms g WHERE g.id = payments.gym_id AND (g.user_id = auth.uid() OR private.has_role(auth.uid(), 'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.gyms g WHERE g.id = payments.gym_id AND (g.user_id = auth.uid() OR private.has_role(auth.uid(), 'admin'))));

DROP POLICY IF EXISTS "gym scoped expenses" ON public.expenses;
CREATE POLICY "gym scoped expenses" ON public.expenses
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.gyms g WHERE g.id = expenses.gym_id AND (g.user_id = auth.uid() OR private.has_role(auth.uid(), 'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.gyms g WHERE g.id = expenses.gym_id AND (g.user_id = auth.uid() OR private.has_role(auth.uid(), 'admin'))));

-- Drop the public has_role (no longer referenced by any policy)
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);

-- Harden remaining SECURITY DEFINER function: handle_new_user is a trigger,
-- not callable via API, but ensure search_path is locked.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, role)
  VALUES (
    NEW.id,
    CASE WHEN NEW.email = 'adminofos@gmail.com' THEN 'admin'::public.app_role
         ELSE 'gym_owner'::public.app_role END
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END; $$;

-- set_updated_at is SECURITY INVOKER already; lock its search_path too.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
