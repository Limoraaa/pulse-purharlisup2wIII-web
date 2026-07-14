// import node module libraries
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
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

// import required data files
import { DataToolsData } from "data/DataToolsData";

interface InventoryToolsState {
  tools: ToolItemType[];
  transaksiList: TransaksiPeminjamanType[];
  kerusakanHistory: KerusakanHistoryType[];
}

// Data awal masih dummy (DataToolsData). Begitu backend siap, ganti
// initialState.tools ini jadi array kosong lalu fetch data lewat thunk/effect.
const initialState: InventoryToolsState = {
  tools: DataToolsData,
  transaksiList: [],
  kerusakanHistory: [],
};

const inventoryToolsSlice = createSlice({
  name: "inventoryTools",
  initialState,
  reducers: {
    // ---- CRUD Data Tools ----
    addTool: (state, action: PayloadAction<ToolFormValues>) => {
      state.tools.unshift({ id: uuid(), ...action.payload });
    },
    updateTool: (
      state,
      action: PayloadAction<{ id: string; values: ToolFormValues }>
    ) => {
      const tool = state.tools.find((t) => t.id === action.payload.id);
      if (tool) Object.assign(tool, action.payload.values);
    },
    deleteTool: (state, action: PayloadAction<{ id: string }>) => {
      state.tools = state.tools.filter((t) => t.id !== action.payload.id);
    },

    // ---- Checkout Keranjang Peminjaman -> buat transaksi baru ----
    checkoutPeminjaman: (
      state,
      action: PayloadAction<{
        loanForm: LoanFormValues;
        cartItems: CartItemType[];
      }>
    ) => {
      const { loanForm, cartItems } = action.payload;

      const items = cartItems.map((c) => {
        const tool = state.tools.find((t) => t.id === c.toolId);
        if (tool) tool.dipinjam += c.jumlah; // tersedia otomatis berkurang
        return {
          toolId: c.toolId,
          kodeBarang: c.kodeBarang,
          namaBarang: c.namaBarang,
          jumlah: c.jumlah,
          kondisiSaatDipinjam: tool?.kondisi || "Baik",
        };
      });

      state.transaksiList.unshift({
        id: uuid(),
        tanggalPeminjaman: loanForm.tanggalPeminjaman,
        namaPeminjam: loanForm.namaPeminjam,
        divisi: loanForm.divisi,
        areaKerja: loanForm.areaKerja,
        items,
        status: "Sedang Dipinjam",
      });
    },

    // ---- Proses Pengembalian (dari halaman Peminjaman Aktif) ----
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

        // dipinjam selalu berkurang, karena secara fisik alatnya sudah kembali
        tool.dipinjam = Math.max(tool.dipinjam - ret.jumlah, 0);

        if (ret.kondisi === "Baik") {
          // tidak ada aksi tambahan -> tersedia otomatis bertambah
          // karena tersedia dihitung dari (stok - dipinjam)
        } else {
          // alat rusak: stok ikut dikurangi supaya tersedia TIDAK bertambah,
          // kondisi master alat diperbarui, dan dicatat ke riwayat kerusakan
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
});

export const {
  addTool,
  updateTool,
  deleteTool,
  checkoutPeminjaman,
  prosesPengembalian,
} = inventoryToolsSlice.actions;

export default inventoryToolsSlice.reducer;
