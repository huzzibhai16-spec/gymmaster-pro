import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Member, type Attendance, type Payment, type Expense, type Gym, type UserProfile, PLAN_PRICES } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

export { PLAN_PRICES };

// Helper to format PKR currency
export function formatPKR(n: number) {
  return `PKR ${n.toLocaleString("en-PK")}`;
}

// Helper to format date
export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Helper to get initials from name
export function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// Gym hooks
export function useGym() {
  const { gym, loading } = useAuth();
  return { gym, loading };
}

// Admin: Get all gyms
export function useAllGyms() {
  const { isAdmin, profile } = useAuth();

  return useQuery({
    queryKey: ["all-gyms", profile?.user_id],
    queryFn: async () => {
      if (!isAdmin) return [];

      const { data, error } = await supabase
        .from("gyms")
        .select("*, user_profiles!gyms_user_id_fkey(id, user_id, role, is_suspended)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!isAdmin && !!profile,
  });
}

// Admin: Get all gym owners (user profiles)
export function useAllGymOwners() {
  const { isAdmin, profile } = useAuth();

  return useQuery({
    queryKey: ["all-gym-owners", profile?.user_id],
    queryFn: async () => {
      if (!isAdmin) return [];

      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("role", "gym_owner")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!isAdmin && !!profile,
  });
}

// Admin: Update user profile (suspend/unsuspend)
export function useUpdateUserProfile() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: Partial<UserProfile> }) => {
      if (!isAdmin) throw new Error("Unauthorized");

      const { data, error } = await supabase
        .from("user_profiles")
        .update(updates)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-gym-owners"] });
      queryClient.invalidateQueries({ queryKey: ["all-gyms"] });
    },
  });
}

// Admin: Get gym details with stats
export function useGymWithStats(gymId: string | null) {
  const { isAdmin } = useAuth();

  return useQuery({
    queryKey: ["gym-stats", gymId],
    queryFn: async () => {
      if (!isAdmin || !gymId) return null;

      const { data: gym, error: gymError } = await supabase
        .from("gyms")
        .select("*, user_profiles!gyms_user_id_fkey(id, user_id, role, is_suspended)")
        .eq("id", gymId)
        .single();

      if (gymError) throw gymError;

      // Get member count
      const { count: memberCount } = await supabase
        .from("members")
        .select("*", { count: "exact", head: true })
        .eq("gym_id", gymId);

      // Get monthly revenue
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];
      const { data: monthPayments } = await supabase
        .from("payments")
        .select("amount")
        .eq("gym_id", gymId)
        .gte("payment_date", monthStart);
      const monthlyRevenue = monthPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;

      return {
        ...gym,
        memberCount: memberCount || 0,
        monthlyRevenue,
      };
    },
    enabled: !!isAdmin && !!gymId,
  });
}

// Admin: Get all members across all gyms (optionally filter by gym)
export function useAllMembers(gymId?: string) {
  const { isAdmin, profile } = useAuth();

  return useQuery({
    queryKey: ["all-members", gymId, profile?.user_id],
    queryFn: async () => {
      if (!isAdmin) return [];

      let query = supabase
        .from("members")
        .select("*, gyms(id, name)")
        .order("created_at", { ascending: false });

      if (gymId) {
        query = query.eq("gym_id", gymId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!isAdmin && !!profile,
  });
}

// Admin: Get dashboard stats for all gyms
export function useAdminDashboardStats() {
  const { isAdmin, profile } = useAuth();

  return useQuery({
    queryKey: ["admin-dashboard-stats", profile?.user_id],
    queryFn: async () => {
      if (!isAdmin) return null;

      // Total gyms
      const { count: totalGyms } = await supabase
        .from("gyms")
        .select("*", { count: "exact", head: true });

      // Total members across all gyms
      const { count: totalMembers } = await supabase
        .from("members")
        .select("*", { count: "exact", head: true });

      // Total revenue this month
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];
      const { data: monthPayments } = await supabase
        .from("payments")
        .select("amount")
        .gte("payment_date", monthStart);
      const monthlyRevenue = monthPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;

      // Active gym owners (not suspended)
      const { count: activeOwners } = await supabase
        .from("user_profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "gym_owner")
        .eq("is_suspended", false);

      // Suspended owners
      const { count: suspendedOwners } = await supabase
        .from("user_profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "gym_owner")
        .eq("is_suspended", true);

      return {
        totalGyms: totalGyms || 0,
        totalMembers: totalMembers || 0,
        monthlyRevenue,
        activeOwners: activeOwners || 0,
        suspendedOwners: suspendedOwners || 0,
      };
    },
    enabled: !!isAdmin && !!profile,
  });
}

export function useUpdateGym() {
  const { gym } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<Gym>) => {
      if (!gym) throw new Error("No gym found");
      const { data, error } = await supabase
        .from("gyms")
        .update(updates)
        .eq("id", gym.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gym"] });
    },
  });
}

// Members hooks
export function useMembers(filters?: { plan?: string; search?: string }) {
  const { gym } = useAuth();

  return useQuery({
    queryKey: ["members", gym?.id, filters],
    queryFn: async () => {
      if (!gym) return [];

      let query = supabase
        .from("members")
        .select("*")
        .eq("gym_id", gym.id)
        .order("created_at", { ascending: false });

      if (filters?.plan && filters.plan !== "all") {
        query = query.eq("membership_plan", filters.plan);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Apply search filter in memory (for simplicity)
      if (filters?.search) {
        const search = filters.search.toLowerCase();
        return (data || []).filter(
          (m) =>
            m.full_name.toLowerCase().includes(search) ||
            m.phone.includes(search) ||
            m.id.toLowerCase().includes(search)
        );
      }

      return data || [];
    },
    enabled: !!gym,
  });
}

export function useMember(id: string) {
  const { gym } = useAuth();

  return useQuery({
    queryKey: ["member", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!gym && !!id,
  });
}

export function useCreateMember() {
  const { gym } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (member: Omit<Member, "id" | "gym_id" | "created_at">) => {
      if (!gym) throw new Error("No gym found");

      const { data, error } = await supabase
        .from("members")
        .insert({
          ...member,
          gym_id: gym.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });
}

export function useUpdateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Member> }) => {
      const { data, error } = await supabase
        .from("members")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["member"] });
    },
  });
}

export function useDeleteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });
}

// Attendance hooks
export function useAttendance(date?: string) {
  const { gym } = useAuth();
  const targetDate = date || new Date().toISOString().split("T")[0];

  return useQuery({
    queryKey: ["attendance", gym?.id, targetDate],
    queryFn: async () => {
      if (!gym) return [];

      const { data, error } = await supabase
        .from("attendance")
        .select("*, members(id, full_name, phone, membership_plan)")
        .eq("gym_id", gym.id)
        .eq("attendance_date", targetDate)
        .order("check_in_time", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!gym,
  });
}

export function useMarkAttendance() {
  const { gym } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ memberId, date }: { memberId: string; date?: string }) => {
      if (!gym) throw new Error("No gym found");

      const attendanceDate = date || new Date().toISOString().split("T")[0];
      const checkInTime = new Date().toTimeString().split(" ")[0];

      // Insert attendance record
      const { data, error } = await supabase
        .from("attendance")
        .insert({
          gym_id: gym.id,
          member_id: memberId,
          attendance_date: attendanceDate,
          check_in_time: checkInTime,
        })
        .select()
        .single();

      if (error) throw error;

      // Update member's last_visit and attendance_count
      const { data: member, error: memberError } = await supabase
        .from("members")
        .select("last_visit, attendance_count")
        .eq("id", memberId)
        .single();

      if (memberError) throw memberError;

      await supabase
        .from("members")
        .update({
          last_visit: attendanceDate,
          attendance_count: (member?.attendance_count || 0) + 1,
          status: "Active",
        })
        .eq("id", memberId);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });
}

// Payments hooks
export function usePayments(filters?: { memberId?: string; limit?: number }) {
  const { gym } = useAuth();

  return useQuery({
    queryKey: ["payments", gym?.id, filters],
    queryFn: async () => {
      if (!gym) return [];

      let query = supabase
        .from("payments")
        .select("*, members(id, full_name, phone, membership_plan)")
        .eq("gym_id", gym.id)
        .order("payment_date", { ascending: false });

      if (filters?.memberId) {
        query = query.eq("member_id", filters.memberId);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!gym,
  });
}

export function useCreatePayment() {
  const { gym } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      memberId,
      amount,
      method,
      notes,
    }: {
      memberId: string;
      amount: number;
      method: "Cash" | "Online";
      notes?: string;
    }) => {
      if (!gym) throw new Error("No gym found");

      // Create payment
      const { data, error } = await supabase
        .from("payments")
        .insert({
          gym_id: gym.id,
          member_id: memberId,
          amount,
          payment_method: method,
          notes,
        })
        .select()
        .single();

      if (error) throw error;

      // Update member's amount_paid and pending_dues
      const { data: member, error: memberError } = await supabase
        .from("members")
        .select("amount_paid, pending_dues")
        .eq("id", memberId)
        .single();

      if (memberError) throw memberError;

      const newAmountPaid = (member?.amount_paid || 0) + amount;
      const newPendingDues = Math.max(0, (member?.pending_dues || 0) - amount);

      await supabase
        .from("members")
        .update({
          amount_paid: newAmountPaid,
          pending_dues: newPendingDues,
        })
        .eq("id", memberId);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });
}

// Expenses hooks
export function useExpenses(limit?: number) {
  const { gym } = useAuth();

  return useQuery({
    queryKey: ["expenses", gym?.id, limit],
    queryFn: async () => {
      if (!gym) return [];

      let query = supabase
        .from("expenses")
        .select("*")
        .eq("gym_id", gym.id)
        .order("expense_date", { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!gym,
  });
}

export function useCreateExpense() {
  const { gym } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      title,
      amount,
      notes,
    }: {
      title: string;
      amount: number;
      notes?: string;
    }) => {
      if (!gym) throw new Error("No gym found");

      const { data, error } = await supabase
        .from("expenses")
        .insert({
          gym_id: gym.id,
          title,
          amount,
          notes,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });
}

// Dashboard stats hook
export function useDashboardStats() {
  const { gym } = useAuth();
  const today = new Date().toISOString().split("T")[0];
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split("T")[0];

  return useQuery({
    queryKey: ["dashboard-stats", gym?.id],
    queryFn: async () => {
      if (!gym) return null;

      // Total members
      const { count: totalMembers } = await supabase
        .from("members")
        .select("*", { count: "exact", head: true })
        .eq("gym_id", gym.id);

      // Active members
      const { count: activeMembers } = await supabase
        .from("members")
        .select("*", { count: "exact", head: true })
        .eq("gym_id", gym.id)
        .eq("status", "Active");

      // Inactive members
      const { count: inactiveMembers } = await supabase
        .from("members")
        .select("*", { count: "exact", head: true })
        .eq("gym_id", gym.id)
        .eq("status", "Inactive");

      // Expiring soon (within 7 days)
      const sevenDaysLater = new Date();
      sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
      const { data: expiringMembers } = await supabase
        .from("members")
        .select("id")
        .eq("gym_id", gym.id)
        .gte("expiry_date", today)
        .lte("expiry_date", sevenDaysLater.toISOString().split("T")[0]);
      const expiringSoon = expiringMembers?.length || 0;

      // Today's attendance
      const { count: todayAttendance } = await supabase
        .from("attendance")
        .select("*", { count: "exact", head: true })
        .eq("gym_id", gym.id)
        .eq("attendance_date", today);

      // Today's revenue
      const { data: todayPayments } = await supabase
        .from("payments")
        .select("amount")
        .eq("gym_id", gym.id)
        .eq("payment_date", today);
      const todayRevenue = todayPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;

      // Monthly revenue
      const { data: monthPayments } = await supabase
        .from("payments")
        .select("amount")
        .eq("gym_id", gym.id)
        .gte("payment_date", monthStart);
      const monthlyRevenue = monthPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;

      // Pending dues
      const { data: pendingData } = await supabase
        .from("members")
        .select("pending_dues")
        .eq("gym_id", gym.id)
        .gt("pending_dues", 0);
      const pendingDuesTotal = pendingData?.reduce((sum, m) => sum + m.pending_dues, 0) || 0;
      const pendingDuesCount = pendingData?.length || 0;

      // Monthly expenses
      const { data: monthExpenses } = await supabase
        .from("expenses")
        .select("amount")
        .eq("gym_id", gym.id)
        .gte("expense_date", monthStart);
      const monthlyExpenses = monthExpenses?.reduce((sum, e) => sum + e.amount, 0) || 0;

      // Net profit
      const netProfit = monthlyRevenue - monthlyExpenses;

      return {
        totalMembers: totalMembers || 0,
        activeMembers: activeMembers || 0,
        inactiveMembers: inactiveMembers || 0,
        expiringSoon,
        todayAttendance: todayAttendance || 0,
        todayRevenue,
        monthlyRevenue,
        pendingDuesTotal,
        pendingDuesCount,
        monthlyExpenses,
        netProfit,
      };
    },
    enabled: !!gym,
  });
}

// Revenue data hook
export function useRevenueData() {
  const { gym } = useAuth();

  return useQuery({
    queryKey: ["revenue-data", gym?.id],
    queryFn: async () => {
      if (!gym) return { daily: [], yearly: [] };

      // Get last 14 days of payments
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const startDate = twoWeeksAgo.toISOString().split("T")[0];

      const { data: dailyPayments } = await supabase
        .from("payments")
        .select("payment_date, amount, payment_method")
        .eq("gym_id", gym.id)
        .gte("payment_date", startDate)
        .order("payment_date", { ascending: true });

      // Aggregate by date
      const dailyMap = new Map<string, { revenue: number; payments: number }>();
      dailyPayments?.forEach((p) => {
        const existing = dailyMap.get(p.payment_date) || { revenue: 0, payments: 0 };
        dailyMap.set(p.payment_date, {
          revenue: existing.revenue + p.amount,
          payments: existing.payments + 1,
        });
      });

      const daily = Array.from(dailyMap.entries()).map(([date, data]) => ({
        date,
        revenue: data.revenue,
        payments: data.payments,
      }));

      // Get monthly revenue for current year
      const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0];
      const { data: yearPayments } = await supabase
        .from("payments")
        .select("payment_date, amount")
        .eq("gym_id", gym.id)
        .gte("payment_date", yearStart)
        .order("payment_date", { ascending: true });

      // Aggregate by month
      const monthMap = new Map<string, number>();
      yearPayments?.forEach((p) => {
        const month = p.payment_date.substring(0, 7); // YYYY-MM
        const existing = monthMap.get(month) || 0;
        monthMap.set(month, existing + p.amount);
      });

      const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
      ];

      const yearly = months.map((month, i) => {
        const monthKey = `${new Date().getFullYear()}-${String(i + 1).padStart(2, "0")}`;
        const revenue = monthMap.get(monthKey) || 0;
        return { month, revenue };
      });

      const yearlyRevenueTotal = yearly.reduce((sum, m) => sum + m.revenue, 0);

      return { daily, yearly, yearlyRevenueTotal };
    },
    enabled: !!gym,
  });
}
