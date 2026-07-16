import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { v4 as uuid } from "uuid";

import {
  ToolItemType,
  ToolFormValues,
  CartItemType,
  LoanFormValues,
  TransaksiPeminjamanType,
  PengembalianItemInput,
  KerusakanHistoryType,
} from "types/DataToolsTypes";

import {
  getTools,
  createTool as createToolApi,
  updateTool as updateToolApi,
  deleteTool as deleteToolApi,
} from "services/toolService";

import {
  scanTool,
  fetchAntrean,
  updateCartItem,
  removeCartItem,
  prosesPeminjamanApi,
  AntreanItemResponse,
} from "services/peminjamanService";

interface InventoryToolsState {
  tools: ToolItemType[];
  cart: CartItemType[];
  cartLoading: boolean;
  cartError: string | null;
  transaksiList: TransaksiPeminjamanType[];
  kerusakanHistory: KerusakanHistoryType[];
  loadingTools: boolean;
  toolsError: string | null;
  checkoutError: string | null;
}

const initialState: InventoryToolsState = {
  tools: [],
  cart: [],
  cartLoading: false,
  cartError: null,
  transaksiList: [],
  kerusakanHistory: [],
  loadingTools: false,
  toolsError: null,
  checkoutError: null,
};

const mapAntreanToCartItems = (data: AntreanItemResponse[]): CartItemType[] =>
  data.map((d) => ({
    toolId: d.tool_id,
    cartId: d.cart_id,
    kodeBarang: d.kode_barang,
    namaBarang: d.nama_barang,
    jumlah: d.qty,
    maxJumlah: d.max_jumlah,
  }));

// ================= THUNKS: TOOLS (tidak berubah) =================

export const fetchTools = createAsyncThunk(
  "inventoryTools/fetchTools",
  async (_: void, { rejectWithValue }) => {
    try {
      return await getTools();
    } catch (err) {
      return rejectWithValue(err instanceof Error ? err.message : "Gagal memuat data alat");
    }
  }
);

export const addToolThunk = createAsyncThunk(
  "inventoryTools/addTool",
  async (values: ToolFormValues, { rejectWithValue }) => {
    try {
      return await createToolApi(values);
    } catch (err) {
      return rejectWithValue(err instanceof Error ? err.message : "Gagal menambah data alat");
    }
  }
);

export const updateToolThunk = createAsyncThunk(
  "inventoryTools/updateTool",
  async ({ id, values }: { id: string; values: ToolFormValues }, { rejectWithValue }) => {
    try {
      return await updateToolApi(id, values);
    } catch (err) {
      return rejectWithValue(err instanceof Error ? err.message : "Gagal menyimpan perubahan alat");
    }
  }
);

export const deleteToolThunk = createAsyncThunk(
  "inventoryTools/deleteTool",
  async (id: string, { rejectWithValue }) => {
    try {
      await deleteToolApi(id);
      return id;
    } catch (err) {
      return rejectWithValue(err instanceof Error ? err.message : "Gagal menghapus data alat");
    }
  }
);

// ================= THUNKS: CART (temporary_cart) =================

export const fetchAntreanThunk = createAsyncThunk(
  "inventoryTools/fetchAntrean",
  async (_: void, { rejectWithValue }) => {
    try {
      const data = await fetchAntrean();
      return mapAntreanToCartItems(data);
    } catch (err) {
      return rejectWithValue(err instanceof Error ? err.message : "Gagal memuat antrean");
    }
  }
);

export const scanToolThunk = createAsyncThunk(
  "inventoryTools/scanTool",
  async ({ toolId, jumlah = 1 }: { toolId: string; jumlah?: number }, { rejectWithValue }) => {
    try {
      await scanTool(toolId, jumlah);
      const data = await fetchAntrean();
      return mapAntreanToCartItems(data);
    } catch (err) {
      return rejectWithValue(err instanceof Error ? err.message : "Gagal menambah ke keranjang");
    }
  }
);

export const updateCartItemThunk = createAsyncThunk(
  "inventoryTools/updateCartItem",
  async ({ cartId, qty }: { cartId: string | number; qty: number }, { rejectWithValue }) => {
    try {
      await updateCartItem(cartId, qty);
      const data = await fetchAntrean();
      return mapAntreanToCartItems(data);
    } catch (err) {
      return rejectWithValue(err instanceof Error ? err.message : "Gagal mengubah jumlah");
    }
  }
);

export const removeCartItemThunk = createAsyncThunk(
  "inventoryTools/removeCartItem",
  async (cartId: string | number, { rejectWithValue }) => {
    try {
      await removeCartItem(cartId);
      const data = await fetchAntrean();
      return mapAntreanToCartItems(data);
    } catch (err) {
      return rejectWithValue(err instanceof Error ? err.message : "Gagal menghapus item");
    }
  }
);

// ================= THUNK: CHECKOUT =================

export const checkoutPeminjamanThunk = createAsyncThunk(
  "inventoryTools/checkoutPeminjaman",
  async (
    { loanForm, dicatatOleh }: { loanForm: LoanFormValues; dicatatOleh: string },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as { inventoryTools: InventoryToolsState };
      const cartSnapshot = state.inventoryTools.cart;

      await prosesPeminjamanApi({
        pemintaId: loanForm.peminjamId,
        dicatatOleh,
        areaKerja: loanForm.areaKerja,
        spesifikasi: loanForm.spesifikasi,
        keterangan: loanForm.keterangan,
      });

      const freshTools = await getTools();

      const items = cartSnapshot.map((c) => {
        const tool = state.inventoryTools.tools.find((t) => t.id === c.toolId);
        return {
          toolId: c.toolId,
          kodeBarang: c.kodeBarang,
          namaBarang: c.namaBarang,
          jumlah: c.jumlah,
          kondisiSaatDipinjam: tool?.kondisi || "Baik",
        };
      });

      const transaksi: TransaksiPeminjamanType = {
        id: uuid(),
        tanggalPeminjaman: loanForm.tanggalPeminjaman,
        namaPeminjam: loanForm.namaPeminjam,
        divisi: loanForm.divisi,
        areaKerja: loanForm.areaKerja,
        items,
        status: "Sedang Dipinjam",
      };

      return { freshTools, transaksi };
    } catch (err) {
      return rejectWithValue(err instanceof Error ? err.message : "Gagal membuat peminjaman");
    }
  }
);

const inventoryToolsSlice = createSlice({
  name: "inventoryTools",
  initialState,
  reducers: {
    prosesPengembalian: (
      state,
      action: PayloadAction<{ transaksiId: string; returns: PengembalianItemInput[] }>
    ) => {
      const { transaksiId, returns } = action.payload;
      const transaksi = state.transaksiList.find((t) => t.id === transaksiId);
      if (!transaksi) return;

      returns.forEach((ret) => {
        const tool = state.tools.find((t) => t.id === ret.toolId);
        if (!tool) return;

        tool.dipinjam = Math.max(tool.dipinjam - ret.jumlah, 0);

        if (ret.kondisi !== "Baik") {
          tool.stok = Math.max(tool.stok - ret.jumlah, 0);
          tool.kondisi = ret.kondisi;

          state.kerusakanHistory.unshift({
            id: uuid(),
            tanggal: new Date().toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            }),
            kodeBarang: ret.kodeBarang,
            namaBarang: ret.namaBarang,
            jumlah: ret.jumlah,
            kondisi: ret.kondisi,
            catatan: ret.catatan,
            namaPeminjam: transaksi.namaPeminjam,
            divisi: transaksi.divisi,
          });
        }
      });

      transaksi.status = "Selesai";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTools.pending, (state) => {
        state.loadingTools = true;
        state.toolsError = null;
      })
      .addCase(fetchTools.fulfilled, (state, action) => {
        state.loadingTools = false;
        state.tools = action.payload;
      })
      .addCase(fetchTools.rejected, (state, action) => {
        state.loadingTools = false;
        state.toolsError = (action.payload as string) || "Gagal memuat data alat";
      });

    builder.addCase(addToolThunk.fulfilled, (state, action) => {
      state.tools.unshift(action.payload);
    });

    builder.addCase(updateToolThunk.fulfilled, (state, action) => {
      const idx = state.tools.findIndex((t) => t.id === action.payload.id);
      if (idx !== -1) state.tools[idx] = action.payload;
    });

    builder.addCase(deleteToolThunk.fulfilled, (state, action) => {
      state.tools = state.tools.filter((t) => t.id !== action.payload);
    });

    builder
      .addCase(fetchAntreanThunk.pending, (state) => {
        state.cartLoading = true;
      })
      .addCase(fetchAntreanThunk.fulfilled, (state, action) => {
        state.cartLoading = false;
        state.cart = action.payload;
      })
      .addCase(fetchAntreanThunk.rejected, (state, action) => {
        state.cartLoading = false;
        state.cartError = (action.payload as string) || "Gagal memuat antrean";
      });

    builder
      .addCase(scanToolThunk.fulfilled, (state, action) => {
        state.cart = action.payload;
        state.cartError = null;
      })
      .addCase(scanToolThunk.rejected, (state, action) => {
        state.cartError = (action.payload as string) || "Gagal menambah ke keranjang";
      });

    builder.addCase(updateCartItemThunk.fulfilled, (state, action) => {
      state.cart = action.payload;
    });

    builder.addCase(removeCartItemThunk.fulfilled, (state, action) => {
      state.cart = action.payload;
    });

    builder
      .addCase(checkoutPeminjamanThunk.pending, (state) => {
        state.checkoutError = null;
      })
      .addCase(checkoutPeminjamanThunk.fulfilled, (state, action) => {
        state.tools = action.payload.freshTools;
        state.transaksiList.unshift(action.payload.transaksi);
        state.cart = [];
      })
      .addCase(checkoutPeminjamanThunk.rejected, (state, action) => {
        state.checkoutError = (action.payload as string) || "Gagal membuat peminjaman";
      });
  },
});

export const { prosesPengembalian } = inventoryToolsSlice.actions;
export default inventoryToolsSlice.reducer;