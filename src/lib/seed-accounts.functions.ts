import { createServerFn } from "@tanstack/react-start";

const DEFAULTS = [
  {
    email: "adminofos@gmail.com",
    password: "+923302976105.!",
    role: "admin" as const,
  },
  {
    email: "gymowner@gmail.com",
    password: "@bodystronggym",
    role: "gym_owner" as const,
    gymName: "Body Strong Gym",
  },
];

export const ensureDefaultAccounts = createServerFn({ method: "POST" }).handler(
  async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    for (const acct of DEFAULTS) {
      // Look up existing user by email
      const { data: list } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 200,
      });
      let user = list?.users.find(
        (u) => u.email?.toLowerCase() === acct.email.toLowerCase(),
      );

      if (!user) {
        const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
          email: acct.email,
          password: acct.password,
          email_confirm: true,
        });
        if (error) {
          console.error("[seed] create failed", acct.email, error.message);
          continue;
        }
        user = created.user ?? undefined;
      } else {
        // Ensure the password matches the documented default
        await supabaseAdmin.auth.admin.updateUserById(user.id, {
          password: acct.password,
          email_confirm: true,
        });
      }

      if (!user) continue;

      // Force correct role (trigger sets it on insert, but be safe on updates)
      await supabaseAdmin
        .from("user_profiles")
        .upsert(
          { user_id: user.id, role: acct.role, is_suspended: false },
          { onConflict: "user_id" },
        );

      if (acct.role === "gym_owner") {
        const { data: existingGym } = await supabaseAdmin
          .from("gyms")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        if (!existingGym) {
          await supabaseAdmin
            .from("gyms")
            .insert({ user_id: user.id, name: acct.gymName ?? "My Gym" });
        }
      }
    }

    return { ok: true };
  },
);
