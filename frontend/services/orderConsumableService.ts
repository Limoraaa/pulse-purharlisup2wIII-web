import apiFetch from "/lib/api";

export const getOrderConsumables = async () => {
  const json = await apiFetch<any>("/order-consumable");
  return json.data || json;
};

// Tambahkan parameter tanggal_kedatangan opsional
export const updateOrderStatus = async (id: number, status: string, tanggal_kedatangan?: string) => {
  return await apiFetch<any>(`/order-consumable/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ 
        status_pembelian: status,
        ...(tanggal_kedatangan && { tanggal_kedatangan }) // Kirim tanggal jika ada
    }),
  });
};

// Pastikan fungsi ini persis seperti ini:
export const getPemintaList = async () => {
  // Apakah endpoint-nya '/peminta' ? 
  const json = await apiFetch<any>("/peminta");
  // Pastikan Anda mengembalikan array datanya.
  // Jika backend mengembalikan format { success: true, data: [...] }, maka gunakan json.data
  return json.data || json; 
};

export const getConsumableList = async () => {
  // Apakah endpoint-nya '/consumable' ?
  const json = await apiFetch<any>("/consumable");
  return json.data || json;
};

export const createOrderConsumable = async (data: any) => {
  return await apiFetch<any>("/order-consumable", {
    method: "POST",
    body: JSON.stringify(data),
  });
};