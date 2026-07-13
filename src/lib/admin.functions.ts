import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SUPER_ADMIN_EMAILS = ["huzzibhai@gmail.com", "huzaifasiddike@gmail.com"] as const;
const isSuperAdminEmail = (email: string) =>
  SUPER_ADMIN_EMAILS.includes(email.toLowerCase() as (typeof SUPER_ADMIN_EMAILS)[number]);

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data: caller, error } = await context.supabase
    .from("user_profiles")
    .select("role, is_suspended")
    .eq("user_id", context.userId)
    .maybeSingle();
  if (error) throw new Error("Unable to verify caller.");
  if (!caller || caller.role !== "admin" || caller.is_suspended) {
    throw new Error("Forbidden: super admin access required.");
  }
}

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
    if (isSuperAdminEmail(data.email)) {
      throw new Error("This email is reserved for the super admin.");
    }
    return data;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });
    if (createErr || !created?.user) {
      throw new Error(createErr?.message || "Failed to create user.");
    }
    const newUserId = created.user.id;

    const { error: profileErr } = await supabaseAdmin
      .from("user_profiles")
      .upsert(
        {
          user_id: newUserId,
          role: "gym_owner",
          is_suspended: false,
          must_change_password: true,
        },
        { onConflict: "user_id" },
      );
    if (profileErr) {
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      throw new Error(profileErr.message);
    }

    // Trigger may have already created a gym for this user; upsert to be safe.
    const { data: existingGym } = await supabaseAdmin
      .from("gyms")
      .select("id")
      .eq("user_id", newUserId)
      .maybeSingle();

    if (existingGym) {
      await supabaseAdmin.from("gyms").update({ name: data.gymName }).eq("id", existingGym.id);
    } else {
      const { error: gymErr } = await supabaseAdmin
        .from("gyms")
        .insert({ user_id: newUserId, name: data.gymName });
      if (gymErr) {
        await supabaseAdmin.auth.admin.deleteUser(newUserId);
        throw new Error(gymErr.message);
      }
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
    await assertAdmin(context);
    if (data.userId === context.userId) {
      throw new Error("Cannot delete your own account.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Guard: never delete an admin
    const { data: prof } = await supabaseAdmin
      .from("user_profiles")
      .select("role")
      .eq("user_id", data.userId)
      .maybeSingle();
    if (prof?.role === "admin") throw new Error("Cannot delete an admin account.");

    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const resetOwnerPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { userId: string; password: string }) => {
    if (!data?.userId || !data?.password) throw new Error("userId and password required");
    if (data.password.length < 6) throw new Error("Password must be at least 6 characters.");
    return data;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: prof } = await supabaseAdmin
      .from("user_profiles")
      .select("role")
      .eq("user_id", data.userId)
      .maybeSingle();
    if (prof?.role === "admin") throw new Error("Cannot reset an admin account password here.");

    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      password: data.password,
    });
    if (error) throw new Error(error.message);

    await supabaseAdmin
      .from("user_profiles")
      .update({ must_change_password: true })
      .eq("user_id", data.userId);

    return { ok: true };
  });

export const listGymOwners = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profiles, error: profErr } = await supabaseAdmin
      .from("user_profiles")
      .select("id, user_id, role, is_suspended, must_change_password, created_at")
      .eq("role", "gym_owner")
      .order("created_at", { ascending: false });
    if (profErr) throw new Error(profErr.message);

    const userIds = (profiles || []).map((p) => p.user_id);
    const { data: gyms } = await supabaseAdmin
      .from("gyms")
      .select("id, user_id, name, created_at")
      .in("user_id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);
    const gymByUser = new Map((gyms || []).map((g) => [g.user_id, g]));

    // Fetch emails via admin listUsers (paged)
    const emailByUser = new Map<string, string>();
    let page = 1;
    // Cap iterations for safety
    for (let i = 0; i < 20; i++) {
      const { data: usersPage, error: uerr } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage: 200,
      });
      if (uerr) break;
      for (const u of usersPage?.users || []) {
        if (u.id && u.email) emailByUser.set(u.id, u.email);
      }
      if (!usersPage || (usersPage.users?.length ?? 0) < 200) break;
      page += 1;
    }

    return (profiles || []).map((p) => ({
      id: p.id,
      user_id: p.user_id,
      role: p.role,
      is_suspended: p.is_suspended,
      must_change_password: p.must_change_password,
      created_at: p.created_at,
      email: emailByUser.get(p.user_id) ?? null,
      gym: gymByUser.get(p.user_id)
        ? {
            id: gymByUser.get(p.user_id)!.id,
            name: gymByUser.get(p.user_id)!.name,
            created_at: gymByUser.get(p.user_id)!.created_at,
          }
        : null,
    }));
  });

export const clearMustChangePassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("user_profiles")
      .update({ must_change_password: false })
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
