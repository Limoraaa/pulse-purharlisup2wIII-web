"use client";
import { useEffect, useState } from "react";
import api from "lib/api";

interface PermissionState {
  permissions: string[];
  roles: string[];
  loading: boolean;
}
let cachedState: PermissionState | null = null;
let listeners: Array<(state: PermissionState) => void> = [];

const fetchPermissions = async () => {
  try {
    const res: any = await api("/user");
    const data = res?.data || res;
    const perms: string[] = data?.all_permissions || [];
    const roleNames: string[] = (data?.roles || []).map((r: any) => r.name ?? r);
    cachedState = { permissions: perms, roles: roleNames, loading: false };
  } catch {
    cachedState = { permissions: [], roles: [], loading: false };
  }
  listeners.forEach((l) => l(cachedState as PermissionState));
};

/**
 * Hook untuk cek permission user yang sedang login.
 * Pemakaian: const canManage = usePermission('manage_inventaris');
 * Bisa juga cek beberapa sekaligus (OR): usePermission(['process_order', 'manage_order'])
 */
export function usePermission(permissionKey: string | string[]): boolean {
  const [state, setState] = useState<PermissionState>(
    cachedState ?? { permissions: [], roles: [], loading: true }
  );

  useEffect(() => {
    if (!cachedState) {
      fetchPermissions();
    }
    listeners.push(setState);
    return () => {
      listeners = listeners.filter((l) => l !== setState);
    };
  }, []);

  if (state.roles.includes("Super Admin")) return true;

  const keys = Array.isArray(permissionKey) ? permissionKey : [permissionKey];
  return keys.some((k) => state.permissions.includes(k));
}

/** Untuk kasus yang butuh role name langsung, bukan permission */
export function useRoles(): string[] {
  const [state, setState] = useState<PermissionState>(
    cachedState ?? { permissions: [], roles: [], loading: true }
  );

  useEffect(() => {
    if (!cachedState) {
      fetchPermissions();
    }
    listeners.push(setState);
    return () => {
      listeners = listeners.filter((l) => l !== setState);
    };
  }, []);

  return state.roles;
}