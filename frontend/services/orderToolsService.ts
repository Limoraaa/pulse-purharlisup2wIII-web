import apiFetch from "/lib/api";

// Service untuk Order Tools — mirror dari orderConsumableService,
// dengan endpoint /order-tools dan sumber data dari /tools (Data Tools).
export const getOrderTools = async (status?: string) => {
  const query = status && status !== 'semua' ? `?status_pembelian=${encodeURIComponent(status)}` : '';
  const json = await apiFetch<any>(`/order-tools${query}`);
  return json.data || json;
};

export const updateOrderToolsStatus = async (id: number, status: string, tanggal_kedatangan?: string) => {
  return await apiFetch<any>(`/order-tools/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({
      status_pembelian: status,
      ...(tanggal_kedatangan && { tanggal_kedatangan }),
    }),
  });
};

// Daftar pegawai/pengusul (sama seperti Order Consumable)
export const getPemintaListForTools = async () => {
  const json = await apiFetch<any>("/peminta");
  return json.data || json;
};

// Daftar alat dari Data Tools (bukan consumable)
export const getToolsList = async () => {
  const json = await apiFetch<any>("/tools");
  return json.data || json;
};

export const createOrderTools = async (data: any) => {
  return await apiFetch<any>("/order-tools", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const updateOrderTools = async (id: number, data: any) => {
  return await apiFetch<any>(`/order-tools/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

export const deleteOrderTools = async (id: number) => {
  return await apiFetch<any>(`/order-tools/${id}`, {
    method: "DELETE",
  });
};