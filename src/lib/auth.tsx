import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Gym, UserProfile, UserRole } from "./supabase";
import type { User, Session } from "@supabase/supabase-js";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  gym: Gym | null;
  profile: UserProfile | null;
  role: UserRole | null;
  isAdmin: boolean;
  loading: boolean;
  signUp: (email: string, password: string, gymName: string) => Promise<{ error: string | null }>;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null; role: UserRole | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [gym, setGym] = useState<Gym | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const role = profile?.role ?? null;
  const isAdmin = role === "admin";

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes — wrap async work to avoid deadlock
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        // Use setTimeout to prevent deadlock with the Supabase auth mutex
        setTimeout(() => {
          fetchUserData(session.user.id);
        }, 0);
      } else {
        setGym(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchUserData(userId: string) {
    try {
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        setLoading(false);
        return;
      }

      // Suspended users are signed out immediately
      if (profileData?.is_suspended) {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setGym(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setProfile(profileData);

      // Admins don't have a gym
      if (profileData?.role === "admin") {
        setGym(null);
        setLoading(false);
        return;
      }

      // Gym owners: fetch their gym
      const { data: gymData, error: gymError } = await supabase
        .from("gyms")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (gymError) {
        console.error("Error fetching gym:", gymError);
      }

      setGym(gymData);
    } finally {
      setLoading(false);
    }
  }

  async function signIn(
    email: string,
    password: string,
  ): Promise<{ error: string | null; role: UserRole | null }> {
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return { error: authError.message, role: null };
    }

    if (!data.user) {
      return { error: "Authentication failed. Please try again.", role: null };
    }

    // Detect role from profile
    const { data: prof, error: profileError } = await supabase
      .from("user_profiles")
      .select("role, is_suspended")
      .eq("user_id", data.user.id)
      .maybeSingle();

    if (profileError || !prof) {
      await supabase.auth.signOut();
      return { error: "Unable to verify your account. Please try again.", role: null };
    }

    if (prof.is_suspended) {
      await supabase.auth.signOut();
      return { error: "Your account has been suspended. Please contact support.", role: null };
    }

    return { error: null, role: prof.role as UserRole };
  }

  async function signUp(
    email: string,
    password: string,
    gymName: string,
  ): Promise<{ error: string | null }> {
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      return { error: error.message };
    }

    if (data.user) {
      // Wait briefly for the trigger to create user_profile
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Check the role the trigger assigned
      const { data: newProfile } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("user_id", data.user.id)
        .maybeSingle();

      // Only create gym for gym_owners (not the first admin user)
      if (newProfile?.role !== "admin") {
        const { error: gymError } = await supabase.from("gyms").insert({
          user_id: data.user.id,
          name: gymName,
        });

        if (gymError) {
          return { error: gymError.message };
        }
      }
    }

    return { error: null };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setGym(null);
    setProfile(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        gym,
        profile,
        role,
        isAdmin,
        loading,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
