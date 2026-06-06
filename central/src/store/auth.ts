import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";
import type { Tenant } from "@lena/shared/db";
import { supabase } from "../lib/supabase";

interface AuthState {
  session: Session | null;
  user: User | null;
  tenants: Tenant[];
  currentTenantId: string | null;
  status: "loading" | "anon" | "signed-in";
  init: () => Promise<void>;
  loadTenants: () => Promise<void>;
  setCurrentTenant: (id: string) => void;
  signOut: () => Promise<void>;
}

const STORAGE_KEY = "lena.currentTenantId";

export const useAuth = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  tenants: [],
  currentTenantId: null,
  status: "loading",

  init: async () => {
    const { data } = await supabase.auth.getSession();
    set({
      session: data.session,
      user: data.session?.user ?? null,
      status: data.session ? "signed-in" : "anon",
    });

    if (data.session) {
      await get().loadTenants();
    }

    supabase.auth.onAuthStateChange(async (_event, session) => {
      set({
        session,
        user: session?.user ?? null,
        status: session ? "signed-in" : "anon",
      });
      if (session) {
        await get().loadTenants();
      } else {
        set({ tenants: [], currentTenantId: null });
        localStorage.removeItem(STORAGE_KEY);
      }
    });
  },

  loadTenants: async () => {
    const { data, error } = await supabase
      .from("tenants")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("erro ao carregar tenants:", error.message);
      return;
    }

    const tenants = (data ?? []) as Tenant[];
    const stored = localStorage.getItem(STORAGE_KEY);
    const validStored = tenants.find((t) => t.id === stored)?.id ?? null;
    const fallback = tenants[0]?.id ?? null;

    set({ tenants, currentTenantId: validStored ?? fallback });
  },

  setCurrentTenant: (id) => {
    localStorage.setItem(STORAGE_KEY, id);
    set({ currentTenantId: id });
  },

  signOut: async () => {
    await supabase.auth.signOut();
  },
}));
