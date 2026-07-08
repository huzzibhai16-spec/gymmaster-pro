/*
# GymOS Database Schema

This migration creates the complete database schema for GymOS - a gym management system.

## New Tables

1. **gyms**
   - `id` (uuid, primary key): Unique identifier for each gym
   - `user_id` (uuid, references auth.users): Owner of the gym, defaults to authenticated user
   - `name` (text): Gym name
   - `phone` (text): Contact phone number
   - `address` (text): Physical address
   - `currency` (text, default 'PKR'): Currency for payments
   - `fine_enabled` (boolean, default true): Whether automatic fines are enabled
   - `fine_amount` (integer, default 200): Fine amount for inactive members
   - `fine_grace_days` (integer, default 30): Days before fine is applied
   - `monthly_price` (integer, default 3500): Monthly membership price
   - `quarterly_price` (integer, default 9500): Quarterly membership price
   - `half_yearly_price` (integer, default 17000): Half-yearly membership price
   - `yearly_price` (integer, default 30000): Yearly membership price
   - `created_at` (timestamptz): Record creation timestamp

2. **members**
   - `id` (uuid, primary key): Unique identifier for each member
   - `gym_id` (uuid, references gyms): Gym the member belongs to
   - `full_name` (text): Member's full name
   - `phone` (text): Contact phone number
   - `age` (integer): Member's age
   - `gender` (text): Male or Female
   - `address` (text): Member's address
   - `emergency_contact` (text): Emergency contact number
   - `membership_plan` (text): Monthly, Quarterly, Half-Yearly, or Yearly
   - `joining_date` (date): Date member joined
   - `expiry_date` (date): Membership expiry date
   - `monthly_fee` (integer): Fee for the membership plan
   - `amount_paid` (integer, default 0): Total amount paid
   - `pending_dues` (integer, default 0): Outstanding balance
   - `fine_amount` (integer, default 0): Accumulated fines
   - `status` (text): Active, Inactive, or Expiring
   - `last_visit` (date): Last check-in date
   - `attendance_count` (integer, default 0): Total visits
   - `notes` (text): Additional notes
   - `created_at` (timestamptz): Record creation timestamp

3. **attendance**
   - `id` (uuid, primary key): Unique identifier for each attendance record
   - `gym_id` (uuid, references gyms): Gym the attendance belongs to
   - `member_id` (uuid, references members): Member who checked in
   - `attendance_date` (date): Date of attendance
   - `check_in_time` (time): Time of check-in
   - `status` (text, default 'present'): Attendance status
   - `created_at` (timestamptz): Record creation timestamp

4. **payments**
   - `id` (uuid, primary key): Unique identifier for each payment
   - `gym_id` (uuid, references gyms): Gym receiving payment
   - `member_id` (uuid, references members): Member who made payment
   - `amount` (integer): Payment amount
   - `payment_date` (date): Date of payment
   - `payment_method` (text): Cash or Online
   - `notes` (text): Additional notes
   - `created_at` (timestamptz): Record creation timestamp

5. **expenses**
   - `id` (uuid, primary key): Unique identifier for each expense
   - `gym_id` (uuid, references gyms): Gym the expense belongs to
   - `title` (text): Expense description
   - `amount` (integer): Expense amount
   - `expense_date` (date): Date of expense
   - `notes` (text): Additional notes
   - `created_at` (timestamptz): Record creation timestamp

## Security

- Row Level Security (RLS) enabled on all tables
- All tables scoped by `gym_id` which is owned by `user_id` via the `gyms` table
- Each gym owner can only access their own gym's data
- Policies ensure authenticated users can only CRUD their own gym's records

## Important Notes

1. The `gyms` table has `user_id` defaulting to `auth.uid()` so new gyms are automatically owned by the creating user
2. All child tables (members, attendance, payments, expenses) use `gym_id` for scoping
3. Policies on child tables check gym ownership via EXISTS subquery
*/

-- Create gyms table (one per gym owner)
CREATE TABLE IF NOT EXISTS gyms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'My Gym',
  phone text,
  address text,
  currency text NOT NULL DEFAULT 'PKR',
  fine_enabled boolean NOT NULL DEFAULT true,
  fine_amount integer NOT NULL DEFAULT 200,
  fine_grace_days integer NOT NULL DEFAULT 30,
  monthly_price integer NOT NULL DEFAULT 3500,
  quarterly_price integer NOT NULL DEFAULT 9500,
  half_yearly_price integer NOT NULL DEFAULT 17000,
  yearly_price integer NOT NULL DEFAULT 30000,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create members table
CREATE TABLE IF NOT EXISTS members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text NOT NULL,
  age integer,
  gender text CHECK (gender IN ('Male', 'Female')),
  address text,
  emergency_contact text,
  membership_plan text NOT NULL CHECK (membership_plan IN ('Monthly', 'Quarterly', 'Half-Yearly', 'Yearly')),
  joining_date date NOT NULL DEFAULT CURRENT_DATE,
  expiry_date date NOT NULL,
  monthly_fee integer NOT NULL DEFAULT 0,
  amount_paid integer NOT NULL DEFAULT 0,
  pending_dues integer NOT NULL DEFAULT 0,
  fine_amount integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Expiring')),
  last_visit date,
  attendance_count integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  attendance_date date NOT NULL DEFAULT CURRENT_DATE,
  check_in_time time NOT NULL DEFAULT CURRENT_TIME,
  status text NOT NULL DEFAULT 'present',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(member_id, attendance_date)
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_method text NOT NULL DEFAULT 'Cash' CHECK (payment_method IN ('Cash', 'Online')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  title text NOT NULL,
  amount integer NOT NULL,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- GYMS policies (owner-scoped)
DROP POLICY IF EXISTS "select_own_gyms" ON gyms;
CREATE POLICY "select_own_gyms" ON gyms FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_gyms" ON gyms;
CREATE POLICY "insert_own_gyms" ON gyms FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_gyms" ON gyms;
CREATE POLICY "update_own_gyms" ON gyms FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_gyms" ON gyms;
CREATE POLICY "delete_own_gyms" ON gyms FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- MEMBERS policies (gym-scoped through gyms table)
DROP POLICY IF EXISTS "select_own_gym_members" ON members;
CREATE POLICY "select_own_gym_members" ON members FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM gyms WHERE gyms.id = members.gym_id AND gyms.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_gym_members" ON members;
CREATE POLICY "insert_own_gym_members" ON members FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM gyms WHERE gyms.id = members.gym_id AND gyms.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_gym_members" ON members;
CREATE POLICY "update_own_gym_members" ON members FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM gyms WHERE gyms.id = members.gym_id AND gyms.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM gyms WHERE gyms.id = members.gym_id AND gyms.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_gym_members" ON members;
CREATE POLICY "delete_own_gym_members" ON members FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM gyms WHERE gyms.id = members.gym_id AND gyms.user_id = auth.uid())
  );

-- ATTENDANCE policies (gym-scoped)
DROP POLICY IF EXISTS "select_own_gym_attendance" ON attendance;
CREATE POLICY "select_own_gym_attendance" ON attendance FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM gyms WHERE gyms.id = attendance.gym_id AND gyms.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_gym_attendance" ON attendance;
CREATE POLICY "insert_own_gym_attendance" ON attendance FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM gyms WHERE gyms.id = attendance.gym_id AND gyms.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_gym_attendance" ON attendance;
CREATE POLICY "update_own_gym_attendance" ON attendance FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM gyms WHERE gyms.id = attendance.gym_id AND gyms.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM gyms WHERE gyms.id = attendance.gym_id AND gyms.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_gym_attendance" ON attendance;
CREATE POLICY "delete_own_gym_attendance" ON attendance FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM gyms WHERE gyms.id = attendance.gym_id AND gyms.user_id = auth.uid())
  );

-- PAYMENTS policies (gym-scoped)
DROP POLICY IF EXISTS "select_own_gym_payments" ON payments;
CREATE POLICY "select_own_gym_payments" ON payments FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM gyms WHERE gyms.id = payments.gym_id AND gyms.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_gym_payments" ON payments;
CREATE POLICY "insert_own_gym_payments" ON payments FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM gyms WHERE gyms.id = payments.gym_id AND gyms.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_gym_payments" ON payments;
CREATE POLICY "update_own_gym_payments" ON payments FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM gyms WHERE gyms.id = payments.gym_id AND gyms.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM gyms WHERE gyms.id = payments.gym_id AND gyms.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_gym_payments" ON payments;
CREATE POLICY "delete_own_gym_payments" ON payments FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM gyms WHERE gyms.id = payments.gym_id AND gyms.user_id = auth.uid())
  );

-- EXPENSES policies (gym-scoped)
DROP POLICY IF EXISTS "select_own_gym_expenses" ON expenses;
CREATE POLICY "select_own_gym_expenses" ON expenses FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM gyms WHERE gyms.id = expenses.gym_id AND gyms.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_gym_expenses" ON expenses;
CREATE POLICY "insert_own_gym_expenses" ON expenses FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM gyms WHERE gyms.id = expenses.gym_id AND gyms.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_gym_expenses" ON expenses;
CREATE POLICY "update_own_gym_expenses" ON expenses FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM gyms WHERE gyms.id = expenses.gym_id AND gyms.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM gyms WHERE gyms.id = expenses.gym_id AND gyms.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_gym_expenses" ON expenses;
CREATE POLICY "delete_own_gym_expenses" ON expenses FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM gyms WHERE gyms.id = expenses.gym_id AND gyms.user_id = auth.uid())
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_members_gym_id ON members(gym_id);
CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);
CREATE INDEX IF NOT EXISTS idx_members_expiry_date ON members(expiry_date);
CREATE INDEX IF NOT EXISTS idx_attendance_gym_id ON attendance(gym_id);
CREATE INDEX IF NOT EXISTS idx_attendance_member_id ON attendance(member_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_payments_gym_id ON payments(gym_id);
CREATE INDEX IF NOT EXISTS idx_payments_member_id ON payments(member_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_expenses_gym_id ON expenses(gym_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_gyms_user_id ON gyms(user_id);
