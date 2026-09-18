// import node module libraries
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { v4 as uuid } from "uuid";

// import custom types
import {
  ToolItemType,
  ToolFormValues,
  CartItemType,
  LoanFormValues,
  TransaksiPeminjamanType,
  PengembalianItemInput,
  KerusakanHistoryType,
} from "types/DataToolsTypes";

// import API services (sudah terhubung ke Laravel)
import {
  getTools,
  createTool as createToolApi,
  updateTool as updateToolApi,
  deleteTool as deleteToolApi,
} from "services/toolService";
import { submitPeminjaman } from "services/peminjamanService";

interface InventoryToolsState {
  tools: ToolItemType[];
  transaksiList: TransaksiPeminjamanType[];
  kerusakanHistory: KerusakanHistoryType[];
  loadingTools: boolean;
  toolsError: string | null;
  checkoutError: string | null;
}

const initialState: InventoryToolsState = {
  tools: [],
  transaksiList: [],
  kerusakanHistory: [],
  loadingTools: false,
  toolsError: null,
  checkoutError: null,
};

// ================= THUNKS (manggil Laravel API) =================

// Ambil semua data tools dari backend. Panggil ini sekali di halaman utama (mount).
export const fetchTools = createAsyncThunk(
  "inventoryTools/fetchTools",
  async (_: void, { rejectWithValue }) => {
    try {
      return await getTools();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal memuat data alat";
      return rejectWithValue(message);
    }
  }
);

export const addToolThunk = createAsyncThunk(
  "inventoryTools/addTool",
  async (values: ToolFormValues, { rejectWithValue }) => {
    try {
      return await createToolApi(values);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal menambah data alat";
      return rejectWithValue(message);
    }
  }
);

export const updateToolThunk = createAsyncThunk(
  "inventoryTools/updateTool",
  async (
    { id, values }: { id: string; values: ToolFormValues },
    { rejectWithValue }
  ) => {
    try {
      return await updateToolApi(id, values);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal menyimpan perubahan alat";
      return rejectWithValue(message);
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
      const message = err instanceof Error ? err.message : "Gagal menghapus data alat";
      return rejectWithValue(message);
    }
  }
);

// Checkout keranjang peminjaman -> kirim tiap item ke POST /api/peminjaman,
// lalu refetch tools supaya kolom "dipinjam"/"tersedia" akurat sesuai server.
export const checkoutPeminjamanThunk = createAsyncThunk(
  "inventoryTools/checkoutPeminjaman",
  async (
    {
      loanForm,
      cartItems,
      dicatatOleh,
    }: {
      loanForm: LoanFormValues;
      cartItems: CartItemType[];
      dicatatOleh: string;
    },
    { getState, rejectWithValue }
  ) => {
    try {
      await submitPeminjaman(
        cartItems,
        loanForm.peminjamId,
        loanForm.areaKerja,
        dicatatOleh,
        loanForm.spesifikasi,
        loanForm.keterangan
      );

      // ambil ulang data tools terbaru dari server (dipinjam/tersedia sudah akurat)
      const freshTools = await getTools();

      // bangun entri transaksi lokal untuk ditampilkan langsung di UI
      const state = getState() as { inventoryTools: InventoryToolsState };
      const items = cartItems.map((c) => {
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
      const message = err instanceof Error ? err.message : "Gagal membuat peminjaman";
      return rejectWithValue(message);
    }
  }
);

const inventoryToolsSlice = createSlice({
  name: "inventoryTools",
  initialState,
  reducers: {
    // ---- Pengembalian & riwayat kerusakan: MASIH DUMMY, backend belum ada ----
    // Sengaja belum disambungkan ke API. Jangan dipakai untuk data final dulu.
    prosesPengembalian: (
      state,
      action: PayloadAction<{
        transaksiId: string;
        returns: PengembalianItemInput[];
      }>
    ) => {
      const { transaksiId, returns } = action.payload;
      const transaksi = state.transaksiList.find((t) => t.id === transaksiId);
      if (!transaksi) return;

      returns.forEach((ret) => {
        const tool = state.tools.find((t) => t.id === ret.toolId);
        if (!tool) return;

        tool.dipinjam = Math.max(tool.dipinjam - ret.jumlah, 0);

        if (ret.kondisi === "Baik") {
          // tidak ada aksi tambahan -> tersedia otomatis bertambah
        } else {
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
    // ---- fetchTools ----
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

    // ---- addToolThunk ----
    builder.addCase(addToolThunk.fulfilled, (state, action) => {
      state.tools.unshift(action.payload);
    });

    // ---- updateToolThunk ----
    builder.addCase(updateToolThunk.fulfilled, (state, action) => {
      const idx = state.tools.findIndex((t) => t.id === action.payload.id);
      if (idx !== -1) state.tools[idx] = action.payload;
    });

    // ---- deleteToolThunk ----
    builder.addCase(deleteToolThunk.fulfilled, (state, action) => {
      state.tools = state.tools.filter((t) => t.id !== action.payload);
    });

    // ---- checkoutPeminjamanThunk ----
    builder
      .addCase(checkoutPeminjamanThunk.pending, (state) => {
        state.checkoutError = null;
      })
      .addCase(checkoutPeminjamanThunk.fulfilled, (state, action) => {
        state.tools = action.payload.freshTools;
        state.transaksiList.unshift(action.payload.transaksi);
      })
      .addCase(checkoutPeminjamanThunk.rejected, (state, action) => {
        state.checkoutError = (action.payload as string) || "Gagal membuat peminjaman";
      });
  },
});

export const { prosesPengembalian } = inventoryToolsSlice.actions;

export default inventoryToolsSlice.reducer;