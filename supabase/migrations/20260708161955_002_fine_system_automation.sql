/*
# Fine System Automation

1. Purpose
   - Automatically update member statuses based on expiry and activity
   - Apply fines for expired memberships and inactive members
   - Calculate days absent for tracking member engagement

2. New Functions
   - `update_member_status_and_fines()`: Trigger function that runs on member updates
   - Logic:
     * If membership expired 30+ days ago AND last_visit 30+ days ago → set status to 'Inactive'
     * If membership expired 7-30 days ago → set status to 'Expiring'
     * If membership expired 15+ days ago AND no fine applied yet → apply fine from gym settings

3. Database Columns Used
   - members.expiry_date: membership expiration date
   - members.last_visit: most recent attendance date
   - members.fine_amount: accumulated fines
   - members.status: Active/Expiring/Inactive
   - gyms.fine_enabled: whether gym has fines enabled
   - gyms.fine_amount: default fine amount
   - gyms.fine_grace_days: days before fine applies

4. Trigger
   - Fires AFTER INSERT OR UPDATE on members table
   - Checks expiry_date and last_visit to determine status transitions
*/

-- Create function to calculate days since last visit
CREATE OR REPLACE FUNCTION calculate_days_absent(member_id uuid)
RETURNS integer AS $$
DECLARE
  last_visit_date date;
  days_absent integer;
BEGIN
  SELECT last_visit INTO last_visit_date
  FROM members WHERE id = member_id;
  
  IF last_visit_date IS NULL THEN
    days_absent := 9999; -- Never visited, treat as very long absence
  ELSE
    days_absent := CURRENT_DATE - last_visit_date;
  END IF;
  
  RETURN days_absent;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update member status and apply fines
CREATE OR REPLACE FUNCTION update_member_status_and_fines()
RETURNS TRIGGER AS $$
DECLARE
  gym_fine_enabled boolean;
  gym_fine_amount integer;
  gym_grace_days integer;
  days_since_expiry integer;
  days_since_visit integer;
  should_apply_fine boolean;
BEGIN
  -- Get gym fine settings
  SELECT fine_enabled, fine_amount, fine_grace_days 
  INTO gym_fine_enabled, gym_fine_amount, gym_grace_days
  FROM gyms WHERE id = NEW.gym_id;
  
  -- Calculate days since expiry (negative = not expired yet)
  days_since_expiry := CURRENT_DATE - NEW.expiry_date;
  
  -- Calculate days since last visit
  IF NEW.last_visit IS NULL THEN
    days_since_visit := 9999;
  ELSE
    days_since_visit := CURRENT_DATE - NEW.last_visit;
  END IF;
  
  -- Determine status based on expiry and activity
  IF days_since_expiry > 30 OR (days_since_visit > 30 AND days_since_expiry > 0) THEN
    -- Member is inactive: expired 30+ days OR absent 30+ days and membership expired
    NEW.status := 'Inactive';
    
    -- Apply fine if not already applied and gym has fines enabled
    IF gym_fine_enabled AND days_since_expiry > gym_grace_days THEN
      -- Only apply fine once (check if fine_amount is still 0 or hasn't been updated for this period)
      -- We apply the fine if the member has been expired beyond grace period
      IF NEW.fine_amount = 0 OR NEW.fine_amount < gym_fine_amount THEN
        NEW.fine_amount := gym_fine_amount;
        -- Add fine to pending dues
        NEW.pending_dues := NEW.pending_dues + gym_fine_amount;
      END IF;
    END IF;
    
  ELSIF days_since_expiry >= 0 OR days_since_expiry >= -7 THEN
    -- Member is expiring: expired or expiring within 7 days
    IF days_since_expiry >= 0 THEN
      NEW.status := 'Expiring';
    END IF;
    
    -- Apply fine after 15 days of being expired
    IF gym_fine_enabled AND days_since_expiry >= 15 AND NEW.fine_amount = 0 THEN
      NEW.fine_amount := gym_fine_amount;
      NEW.pending_dues := NEW.pending_dues + gym_fine_amount;
    END IF;
    
  ELSE
    -- Member is active
    NEW.status := 'Active';
  END IF;
  
  -- Handle case where member visits after being marked inactive - reactivate if membership not expired
  IF TG_OP = 'UPDATE' AND OLD.last_visit IS DISTINCT FROM NEW.last_visit THEN
    -- Member just checked in
    IF NEW.last_visit IS NOT NULL AND days_since_expiry < 0 THEN
      -- Membership still valid, mark as active
      NEW.status := 'Active';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS member_status_trigger ON members;
CREATE TRIGGER member_status_trigger
  AFTER INSERT OR UPDATE ON members
  FOR EACH ROW
  EXECUTE FUNCTION update_member_status_and_fines();

-- Add a column to track days absent (computed on read)
COMMENT ON COLUMN members.last_visit IS 'Date of most recent attendance. Used to calculate days absent.';
COMMENT ON COLUMN members.fine_amount IS 'Amount of fine applied for late payment or absence.';
