import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type CreateOwnerInput = {
  email: string;
  password: string;
  gymName: string;
};

export const createGymOwner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: CreateOwnerInput) => {
    if (!data?.email || !data?.password || !data?.gymName) {
      throw new Error("Email, password and gym name are required.");
    }
    if (data.password.length < 6) {
      throw new Error("Password must be at least 6 characters.");
    }
    return data;
  })
  .handler(async ({ data, context }) => {
    // Only admins may create gym owners
    const { data: caller, error: callerErr } = await context.supabase
      .from("user_profiles")
      .select("role, is_suspended")
      .eq("user_id", context.userId)
      .maybeSingle();

    if (callerErr) throw new Error("Unable to verify caller.");
    if (!caller || caller.role !== "admin" || caller.is_suspended) {
      throw new Error("Forbidden: admin access required.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Create auth user (email pre-confirmed so they can sign in immediately)
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });

    if (createErr || !created?.user) {
      throw new Error(createErr?.message || "Failed to create user.");
    }

    const newUserId = created.user.id;

    // Ensure profile is gym_owner (trigger may have created it already)
    const { error: profileErr } = await supabaseAdmin
      .from("user_profiles")
      .upsert(
        { user_id: newUserId, role: "gym_owner", is_suspended: false },
        { onConflict: "user_id" },
      );
    if (profileErr) {
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      throw new Error(profileErr.message);
    }

    // Create the gym linked to this owner
    const { error: gymErr } = await supabaseAdmin.from("gyms").insert({
      user_id: newUserId,
      name: data.gymName,
    });
    if (gymErr) {
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      throw new Error(gymErr.message);
    }

    return { ok: true, userId: newUserId };
  });

export const deleteGymOwner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { userId: string }) => {
    if (!data?.userId) throw new Error("userId required");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { data: caller } = await context.supabase
      .from("user_profiles")
      .select("role, is_suspended")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!caller || caller.role !== "admin" || caller.is_suspended) {
      throw new Error("Forbidden: admin access required.");
    }
    if (data.userId === context.userId) {
      throw new Error("Cannot delete your own account.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
