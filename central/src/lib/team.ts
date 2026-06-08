import type { TenantRole } from "@lena/shared/db";
import { supabase } from "./supabase";

export interface TenantMember {
  user_id: string;
  email: string;
  full_name: string | null;
  role: TenantRole;
  accepted_at: string | null;
  invited_at: string;
}

export interface PendingInvitation {
  id: string;
  email: string;
  role: TenantRole;
  invited_at: string;
}

export async function listMembers(tenantId: string): Promise<TenantMember[]> {
  const { data, error } = await supabase.rpc("list_tenant_members", {
    p_tenant_id: tenantId,
  });
  if (error) throw error;
  return (data ?? []) as TenantMember[];
}

export async function listPendingInvitations(
  tenantId: string,
): Promise<PendingInvitation[]> {
  const { data, error } = await supabase
    .from("tenant_invitations")
    .select("id, email, role, invited_at")
    .eq("tenant_id", tenantId)
    .eq("status", "pending")
    .order("invited_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PendingInvitation[];
}

export async function inviteMember(
  tenantId: string,
  email: string,
  role: TenantRole = "operador",
): Promise<string> {
  const { data, error } = await supabase.rpc("invite_member", {
    p_tenant_id: tenantId,
    p_email: email,
    p_role: role,
  });
  if (error) throw error;
  return data as string;
}

export async function revokeInvitation(invitationId: string): Promise<void> {
  const { error } = await supabase.rpc("revoke_invitation", {
    p_invitation_id: invitationId,
  });
  if (error) throw error;
}

export async function acceptMyInvitations(): Promise<{
  tenant_id: string;
  role: TenantRole;
}[]> {
  const { data, error } = await supabase.rpc("accept_my_invitations");
  if (error) {
    // não bloqueia o login: log e segue
    console.warn("accept_my_invitations:", error.message);
    return [];
  }
  return (data ?? []) as { tenant_id: string; role: TenantRole }[];
}
