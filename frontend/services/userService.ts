import apiFetch from "lib/api";
import { UserItemType, UserFormValues, ResetPasswordValues } from "types/DataUserTypes";

interface CreateUserPayload {
  full_name: string;
  username: string;
  password: string;
  role?: string; // staff tidak perlu kirim ini, backend akan paksa jadi staff_inventory
  divisi?: string;
}

interface UpdateUserPayload {
  full_name?: string;
  username?: string;
  password?: string;
  role?: string; // hanya diproses backend kalau yang login admin
  divisi?: string;
}
export async function getUsers(): Promise<UserItemType[]> {
  return apiFetch<UserItemType[]>("/users");
}

export async function createUser(
  values: UserFormValues,
  isAdmin: boolean
): Promise<UserItemType> {
  const payload: CreateUserPayload = {
    full_name: values.full_name,
    username: values.username,
    password: values.password,
    divisi: values.divisi,
  };
  // Field role cuma disertakan kalau yang bikin akun adalah admin
  if (isAdmin) {
    payload.role = values.role;
  }

  return apiFetch<UserItemType>("/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateUser(
  id: string,
  values: UserFormValues,
  isAdmin: boolean
): Promise<UserItemType> {
      const payload: UpdateUserPayload = {
    full_name: values.full_name,
    username: values.username,
    divisi: values.divisi,
  };

  if (isAdmin) {
    payload.role = values.role;
  }

  return apiFetch<UserItemType>(`/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteUser(id: string): Promise<void> {
  await apiFetch(`/users/${id}`, { method: "DELETE" });
}

export async function resetUserPassword(
  id: string,
  values: ResetPasswordValues
): Promise<void> {
  await apiFetch(`/users/${id}/reset-password`, {
    method: "PATCH",
    body: JSON.stringify(values),
  });
}

export async function activateUser(id: string): Promise<void> {
  await apiFetch(`/users/${id}/aktifkan`, { method: "PATCH" });
}