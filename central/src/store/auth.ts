import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";
import type { Tenant, TenantRole } from "@lena/shared/db";
import { supabase } from "../lib/supabase";
import { acceptMyInvitations } from "../lib/team";

interface AuthState {
  session: Session | null;
  user: User | null;
  tenants: Tenant[];
  /** role do usuário em cada tenant (tenant_id → role) */
  roles: Record<string, TenantRole>;
  isPlatformAdmin: boolean;
  currentTenantId: string | null;
  status: "loading" | "anon" | "signed-in";
  /** true depois que tenants/roles/perfil chegaram; rotas protegidas esperam isto */
  tenantsLoaded: boolean;
  init: () => Promise<void>;
  loadTenants: () => Promise<void>;
  setCurrentTenant: (id: string) => void;
  signOut: () => Promise<void>;
  /** role do usuário no tenant atual; null se não houver tenant */
  currentRole: () => TenantRole | null;
  /** true se admin do tenant atual OU platform admin */
  isAdmin: () => boolean;
}

const STORAGE_KEY = "lena.currentTenantId";

export const useAuth = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  tenants: [],
  roles: {},
  isPlatformAdmin: false,
  currentTenantId: null,
  status: "loading",
  tenantsLoaded: false,

  init: async () => {
    const { data } = await supabase.auth.getSession();
    set({
      session: data.session,
      user: data.session?.user ?? null,
      status: data.session ? "signed-in" : "anon",
    });

    if (data.session) {
      await acceptMyInvitations();
      await get().loadTenants();
    }

    supabase.auth.onAuthStateChange(async (_event, session) => {
      set({
        session,
        user: session?.user ?? null,
        status: session ? "signed-in" : "anon",
      });
      if (session) {
        await acceptMyInvitations();
        await get().loadTenants();
      } else {
        set({ tenants: [], roles: {}, isPlatformAdmin: false, currentTenantId: null, tenantsLoaded: false });
        localStorage.removeItem(STORAGE_KEY);
      }
    });
  },

  loadTenants: async () => {
    const userId = get().user?.id ?? null;

    const [tenantsRes, membersRes, profileRes] = await Promise.all([
      supabase
        .from("tenants")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: true }),
      userId
        ? supabase
            .from("tenant_members")
            .select("tenant_id, role")
            .eq("user_id", userId)
            .not("accepted_at", "is", null)
        : Promise.resolve({ data: [], error: null }),
      userId
        ? supabase
            .from("profiles")
            .select("is_platform_admin")
            .eq("id", userId)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

    if (tenantsRes.error) {
      console.error("erro ao carregar tenants:", tenantsRes.error.message);
      set({ tenantsLoaded: true }); // não deixa rotas protegidas esperando para sempre
      return;
    }

    const tenants = (tenantsRes.data ?? []) as Tenant[];

    const roles: Record<string, TenantRole> = {};
    for (const m of (membersRes.data ?? []) as { tenant_id: string; role: TenantRole }[]) {
      roles[m.tenant_id] = m.role;
    }

    const isPlatformAdmin =
      (profileRes.data as { is_platform_admin?: boolean } | null)?.is_platform_admin ??
      false;

    const stored = localStorage.getItem(STORAGE_KEY);
    const validStored = tenants.find((t) => t.id === stored)?.id ?? null;
    const fallback = tenants[0]?.id ?? null;

    set({
      tenants,
      roles,
      isPlatformAdmin,
      currentTenantId: validStored ?? fallback,
      tenantsLoaded: true,
    });
  },

  setCurrentTenant: (id) => {
    localStorage.setItem(STORAGE_KEY, id);
    set({ currentTenantId: id });
  },

  signOut: async () => {
    await supabase.auth.signOut();
  },

  currentRole: () => {
    const { currentTenantId, roles } = get();
    if (!currentTenantId) return null;
    return roles[currentTenantId] ?? null;
  },

  isAdmin: () => {
    const { isPlatformAdmin } = get();
    if (isPlatformAdmin) return true;
    return get().currentRole() === "admin";
  },
}));
