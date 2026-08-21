import apiFetch from "/lib/api";

// Service untuk Order Consumable — mirror dari orderToolsService,
// dengan endpoint /order-consumable dan sumber data dari /consumable (Data Consumable).
export const getOrderConsumables = async () => {
  const json = await apiFetch<any>("/order-consumable");
  return json.data || json;
};

export const updateOrderConsumableStatus = async (id: number, status: string, tanggal_kedatangan?: string) => {
  return await apiFetch<any>(`/order-consumable/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({
      status_pembelian: status,
      ...(tanggal_kedatangan && { tanggal_kedatangan }),
    }),
  });
};

// Daftar pegawai/pengusul (sama seperti Order Tools)
export const getPemintaListForConsumable = async () => {
  const json = await apiFetch<any>("/peminta");
  return json.data || json;
};

// Daftar alat dari Data Consumable
export const getConsumableList = async () => {
  const json = await apiFetch<any>("/consumable");
  return json.data || json;
};

export const createOrderConsumable = async (data: any) => {
  return await apiFetch<any>("/order-consumable", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const updateOrderConsumable = async (id: number, data: any) => {
  return await apiFetch<any>(`/order-consumable/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};