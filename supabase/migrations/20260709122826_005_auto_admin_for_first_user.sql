/*
# Auto-Admin: First User Becomes Admin

1. Purpose
   - Automatically make the first user who signs up an admin
   - All subsequent users become gym_owners
   - This ensures there's always an admin account without manual setup

2. Changes
   - Update the `handle_new_user` trigger function to check user count
   - If no users exist, set role to 'admin'
   - Otherwise, set role to 'gym_owner' (default)

3. Important Notes
   - The first signup will be the admin
   - Admin does NOT get a gym (they manage all gyms)
   - Gym owners get a gym created during signup
*/

-- Update the trigger function to make first user admin
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_count integer;
BEGIN
  -- Count existing users
  SELECT COUNT(*) INTO user_count FROM user_profiles;
  
  -- If no users exist, make this user an admin
  IF user_count = 0 THEN
    INSERT INTO public.user_profiles (user_id, role)
    VALUES (NEW.id, 'admin');
  ELSE
    -- Otherwise, make them a gym_owner
    INSERT INTO public.user_profiles (user_id, role)
    VALUES (NEW.id, 'gym_owner');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION handle_new_user() IS 'Automatically creates user profile. First user becomes admin, subsequent users become gym_owners.';
