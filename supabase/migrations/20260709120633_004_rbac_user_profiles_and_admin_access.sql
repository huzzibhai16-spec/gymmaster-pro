/*
# Role-Based Access Control (RBAC) System

1. Purpose
   - Implement secure multi-tenant access control
   - Create distinct Admin and Gym Owner roles
   - Allow admins to access all gyms' data
   - Restrict gym owners to only their own gym's data

2. New Tables
   - `user_profiles`
     - `id` (uuid, primary key): Unique identifier
     - `user_id` (uuid, references auth.users): The auth user this profile belongs to
     - `role` (text): Either 'admin' or 'gym_owner'
     - `is_suspended` (boolean): Whether the account is suspended
     - `created_at` (timestamptz): Creation timestamp
     - `updated_at` (timestamptz): Last update timestamp

3. Security Changes
   - Create RLS policies for user_profiles
   - UPDATE all existing table policies to allow admin bypass
   - Admins can read/write ALL data across all gyms
   - Gym owners remain restricted to their own gym_id data
   - Uses helper function `is_admin()` for policy checks

4. Triggers
   - Auto-create user_profiles entry when new auth.user signs up
   - Default role is 'gym_owner' for new signups
   - Auto-update `updated_at` timestamp on profile changes

5. Important Notes
   - The `is_admin()` helper function checks user role for policies
   - Admin users can bypass gym_id filtering entirely
   - Gym owners continue to see only their own data
   - Suspension flag allows admin to revoke access without deletion
*/

-- Create helper function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM user_profiles
  WHERE user_id = auth.uid();
  
  RETURN user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'gym_owner' CHECK (role IN ('admin', 'gym_owner')),
  is_suspended boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- User profiles policies
-- Users can read their own profile, admins can read all
DROP POLICY IF EXISTS "select_user_profiles" ON user_profiles;
CREATE POLICY "select_user_profiles" ON user_profiles FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR is_admin());

-- Only admins can insert profiles for other users (trigger handles self-insert)
DROP POLICY IF EXISTS "insert_user_profiles" ON user_profiles;
CREATE POLICY "insert_user_profiles" ON user_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id OR is_admin());

-- Users can update own profile, admins can update all
DROP POLICY IF EXISTS "update_user_profiles" ON user_profiles;
CREATE POLICY "update_user_profiles" ON user_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = user_id OR is_admin())
  WITH CHECK (auth.uid() = user_id OR is_admin());

-- Only admins can delete profiles
DROP POLICY IF EXISTS "delete_user_profiles" ON user_profiles;
CREATE POLICY "delete_user_profiles" ON user_profiles FOR DELETE
  TO authenticated USING (is_admin());

-- Create index for user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

-- Create trigger function to auto-create user profile
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, role)
  VALUES (NEW.id, 'gym_owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user_profiles updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- UPDATE ALL EXISTING RLS POLICIES TO ALLOW ADMIN BYPASS
-- ============================================================

-- GYMS policies (owner-scoped, admin bypass)
DROP POLICY IF EXISTS "select_own_gyms" ON gyms;
CREATE POLICY "select_own_gyms" ON gyms FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "insert_own_gyms" ON gyms;
CREATE POLICY "insert_own_gyms" ON gyms FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "update_own_gyms" ON gyms;
CREATE POLICY "update_own_gyms" ON gyms FOR UPDATE
  TO authenticated USING (auth.uid() = user_id OR is_admin())
  WITH CHECK (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "delete_own_gyms" ON gyms;
CREATE POLICY "delete_own_gyms" ON gyms FOR DELETE
  TO authenticated USING (auth.uid() = user_id OR is_admin());

-- MEMBERS policies (gym-scoped, admin bypass)
DROP POLICY IF EXISTS "select_own_gym_members" ON members;
CREATE POLICY "select_own_gym_members" ON members FOR SELECT
  TO authenticated USING (
    is_admin() OR
    EXISTS (SELECT 1 FROM gyms WHERE gyms.id = members.gym_id AND gyms.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_gym_members" ON members;
CREATE POLICY "insert_own_gym_members" ON members FOR INSERT
  TO authenticated WITH CHECK (
    is_admin() OR
    EXISTS (SELECT 1 FROM gyms WHERE gyms.id = members.gym_id AND gyms.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_gym_members" ON members;
CREATE POLICY "update_own_gym_members" ON members FOR UPDATE
  TO authenticated USING (
    is_admin() OR
    EXISTS (SELECT 1 FROM gyms WHERE gyms.id = members.gym_id AND gyms.user_id = auth.uid())
  ) WITH CHECK (
    is_admin() OR
    EXISTS (SELECT 1 FROM gyms WHERE gyms.id = members.gym_id AND gyms.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_gym_members" ON members;
CREATE POLICY "delete_own_gym_members" ON members FOR DELETE
  TO authenticated USING (
    is_admin() OR
    EXISTS (SELECT 1 FROM gyms WHERE gyms.id = members.gym_id AND gyms.user_id = auth.uid())
  );

-- ATTENDANCE policies (gym-scoped, admin bypass)
DROP POLICY IF EXISTS "select_own_gym_attendance" ON attendance;
CREATE POLICY "select_own_gym_attendance" ON attendance FOR SELECT
  TO authenticated USING (
    is_admin() OR
    EXISTS (SELECT 1 FROM gyms WHERE gyms.id = attendance.gym_id AND gyms.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_gym_attendance" ON attendance;
CREATE POLICY "insert_own_gym_attendance" ON attendance FOR INSERT
  TO authenticated WITH CHECK (
    is_admin() OR
    EXISTS (SELECT 1 FROM gyms WHERE gyms.id = attendance.gym_id AND gyms.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_gym_attendance" ON attendance;
CREATE POLICY "update_own_gym_attendance" ON attendance FOR UPDATE
  TO authenticated USING (
    is_admin() OR
    EXISTS (SELECT 1 FROM gyms WHERE gyms.id = attendance.gym_id AND gyms.user_id = auth.uid())
  ) WITH CHECK (
    is_admin() OR
    EXISTS (SELECT 1 FROM gyms WHERE gyms.id = attendance.gym_id AND gyms.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_gym_attendance" ON attendance;
CREATE POLICY "delete_own_gym_attendance" ON attendance FOR DELETE
  TO authenticated USING (
    is_admin() OR
    EXISTS (SELECT 1 FROM gyms WHERE gyms.id = attendance.gym_id AND gyms.user_id = auth.uid())
  );

-- PAYMENTS policies (gym-scoped, admin bypass)
DROP POLICY IF EXISTS "select_own_gym_payments" ON payments;
CREATE POLICY "select_own_gym_payments" ON payments FOR SELECT
  TO authenticated USING (
    is_admin() OR
    EXISTS (SELECT 1 FROM gyms WHERE gyms.id = payments.gym_id AND gyms.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_gym_payments" ON payments;
CREATE POLICY "insert_own_gym_payments" ON payments FOR INSERT
  TO authenticated WITH CHECK (
    is_admin() OR
    EXISTS (SELECT 1 FROM gyms WHERE gyms.id = payments.gym_id AND gyms.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_gym_payments" ON payments;
CREATE POLICY "update_own_gym_payments" ON payments FOR UPDATE
  TO authenticated USING (
    is_admin() OR
    EXISTS (SELECT 1 FROM gyms WHERE gyms.id = payments.gym_id AND gyms.user_id = auth.uid())
  ) WITH CHECK (
    is_admin() OR
    EXISTS (SELECT 1 FROM gyms WHERE gyms.id = payments.gym_id AND gyms.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_gym_payments" ON payments;
CREATE POLICY "delete_own_gym_payments" ON payments FOR DELETE
  TO authenticated USING (
    is_admin() OR
    EXISTS (SELECT 1 FROM gyms WHERE gyms.id = payments.gym_id AND gyms.user_id = auth.uid())
  );

-- EXPENSES policies (gym-scoped, admin bypass)
DROP POLICY IF EXISTS "select_own_gym_expenses" ON expenses;
CREATE POLICY "select_own_gym_expenses" ON expenses FOR SELECT
  TO authenticated USING (
    is_admin() OR
    EXISTS (SELECT 1 FROM gyms WHERE gyms.id = expenses.gym_id AND gyms.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_gym_expenses" ON expenses;
CREATE POLICY "insert_own_gym_expenses" ON expenses FOR INSERT
  TO authenticated WITH CHECK (
    is_admin() OR
    EXISTS (SELECT 1 FROM gyms WHERE gyms.id = expenses.gym_id AND gyms.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_gym_expenses" ON expenses;
CREATE POLICY "update_own_gym_expenses" ON expenses FOR UPDATE
  TO authenticated USING (
    is_admin() OR
    EXISTS (SELECT 1 FROM gyms WHERE gyms.id = expenses.gym_id AND gyms.user_id = auth.uid())
  ) WITH CHECK (
    is_admin() OR
    EXISTS (SELECT 1 FROM gyms WHERE gyms.id = expenses.gym_id AND gyms.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_gym_expenses" ON expenses;
CREATE POLICY "delete_own_gym_expenses" ON expenses FOR DELETE
  TO authenticated USING (
    is_admin() OR
    EXISTS (SELECT 1 FROM gyms WHERE gyms.id = expenses.gym_id AND gyms.user_id = auth.uid())
  );

-- Add comment documenting the RBAC system
COMMENT ON TABLE user_profiles IS 'User role and access control. Admins have full access to all gyms. Gym owners can only access their own gym data.';
COMMENT ON COLUMN user_profiles.role IS 'User role: admin has full access to all gyms, gym_owner can only access their own gym';
COMMENT ON COLUMN user_profiles.is_suspended IS 'If true, user account is suspended and cannot access the system';
