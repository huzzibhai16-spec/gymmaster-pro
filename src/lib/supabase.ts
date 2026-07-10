// Single source of truth for the Supabase client.
// All application code imports from here.
export { supabase } from "@/integrations/supabase/client";

// User role type
export type UserRole = "admin" | "gym_owner";

// User profile type
export type UserProfile = {
  id: string;
  user_id: string;
  role: UserRole;
  is_suspended: boolean;
  created_at: string;
  updated_at: string;
};

// Database types
export type Gym = {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  address: string | null;
  currency: string;
  logo_url: string | null;
  fine_enabled: boolean;
  fine_amount: number;
  fine_grace_days: number;
  monthly_price: number;
  quarterly_price: number;
  half_yearly_price: number;
  yearly_price: number;
  created_at: string;
};

export type Member = {
  id: string;
  gym_id: string;
  full_name: string;
  phone: string;
  age: number | null;
  gender: "Male" | "Female" | null;
  address: string | null;
  emergency_contact: string | null;
  membership_plan: "Monthly" | "Quarterly" | "Half-Yearly" | "Yearly";
  joining_date: string;
  expiry_date: string;
  monthly_fee: number;
  amount_paid: number;
  pending_dues: number;
  fine_amount: number;
  status: "Active" | "Inactive" | "Expiring";
  last_visit: string | null;
  attendance_count: number;
  notes: string | null;
  created_at: string;
};

export type Attendance = {
  id: string;
  gym_id: string;
  member_id: string;
  attendance_date: string;
  check_in_time: string;
  status: string;
  created_at: string;
};

export type Payment = {
  id: string;
  gym_id: string;
  member_id: string;
  amount: number;
  payment_date: string;
  payment_method: "Cash" | "Online";
  notes: string | null;
  created_at: string;
};

export type Expense = {
  id: string;
  gym_id: string;
  title: string;
  amount: number;
  expense_date: string;
  notes: string | null;
  created_at: string;
};

// Plan price mapping
export const PLAN_PRICES = {
  Monthly: 3500,
  Quarterly: 9500,
  "Half-Yearly": 17000,
  Yearly: 30000,
} as const;
