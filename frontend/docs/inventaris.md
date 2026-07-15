# Requirement Frontend
# Sistem Manajemen Inventaris Ruang Tools
## Workshop Mekanik PT PLN (Persero)

---

# 1. Project Overview

Sistem Manajemen Inventaris Ruang Tools merupakan aplikasi berbasis website yang dirancang untuk membantu Staff Ruang Tools dalam mengelola inventaris peralatan, barang consumable, data peminjam, transaksi peminjaman dan pengembalian, riwayat transaksi, serta laporan inventaris.

Frontend dikembangkan menggunakan **Next.js App Router** dan **TypeScript** dengan pendekatan **Component-Based Architecture** sehingga setiap halaman bersifat reusable, scalable, dan mudah dikembangkan.

Website ini menggunakan konsep **Admin Dashboard** dengan tampilan modern, clean, dan profesional yang menyesuaikan identitas visual PT PLN (Persero).

---

# 2. Technology Stack

## Framework

| Technology | Keterangan |
|------------|------------|
| Next.js (App Router) | Framework utama frontend |
| React | UI Library |
| TypeScript | Bahasa utama frontend |

---

## Styling

| Technology | Keterangan |
|------------|------------|
| Tailwind CSS | Utility First CSS |
| Shadcn UI | Reusable UI Components |
| Lucide React | Icon Library |

---

## Data & State

| Technology | Keterangan |
|------------|------------|
| React Context API | Global State |
| React Hook Form | Form Handling |
| Axios | REST API Client |

---

## Table

| Technology | Keterangan |
|------------|------------|
| TanStack Table | Data Table |

---

## Chart

| Technology | Keterangan |
|------------|------------|
| Chart.js | Dashboard Chart |

---

## Notification

| Technology | Keterangan |
|------------|------------|
| SweetAlert2 | Dialog Confirmation |
| React Hot Toast | Toast Notification |

---

# 3. Design System

## Design Style

- Modern Admin Dashboard
- Clean Interface
- Enterprise Style
- Responsive Design
- Simple Navigation
- Minimalist

---

## Color Palette

### Primary

PLN Blue

```
#006492
```

### Secondary

```
#00AEEF
```

### Accent

```
#FFD100
```

### Background

```
#F8FAFC
```

### Border

```
#E5E7EB
```

### Success

```
#22C55E
```

### Warning

```
#F59E0B
```

### Danger

```
#EF4444
```

---

## Typography

Primary Font

```
Inter
```

Fallback

```
sans-serif
```

---

## Border Radius

```
16px
```

---

## Shadow

```
Soft Shadow
```

---

## Icon

```
Lucide React
```

---

# 4. Layout Website

Website menggunakan layout dashboard dengan struktur sebagai berikut.

```
+-----------------------------------------------------------+
| Navbar                                                    |
+-----------+-----------------------------------------------+
|           |                                               |
| Sidebar   |                 Main Content                  |
|           |                                               |
|           |                                               |
|           |                                               |
+-----------+-----------------------------------------------+
```

---

## Navbar

Navbar digunakan untuk menampilkan informasi pengguna dan navigasi cepat.

Komponen

- Logo PT PLN
- Breadcrumb
- Search
- Notification
- User Profile
- Logout

---

## Sidebar

Sidebar berada di sisi kiri halaman.

Sidebar dapat di-collapse sehingga memberikan ruang kerja yang lebih luas.

---

## Main Content

Area utama untuk seluruh halaman aplikasi.

---

# 5. Sidebar Navigation

```
Dashboard

Inventaris
├── Data Tools
├── Data Consumable
└── Data Peminjam

Transaksi
├── Peminjaman Tools
├── Pengembalian Tools
├── Consumable Masuk
└── Consumable Keluar

Riwayat

Laporan

Pengaturan
```

---

# 6. Dashboard

## Tujuan

Dashboard digunakan untuk memberikan informasi singkat mengenai kondisi inventaris Ruang Tools.

---

## Ringkasan Data

Dashboard menampilkan beberapa summary card.

- Total Data Tools
- Total Data Consumable
- Total Peminjam
- Tools Dipinjam
- Tools Tersedia
- Consumable Hampir Habis
- Jumlah Alat Rusak

---

## Widget Dashboard

### Summary Card

Berisi informasi statistik inventaris.

---

### Grafik Peminjaman

Menampilkan grafik jumlah transaksi peminjaman berdasarkan periode tertentu.

---

### Aktivitas Terbaru

Menampilkan daftar transaksi terbaru.

Contoh

- Peminjaman Tools
- Pengembalian Tools
- Consumable Masuk
- Consumable Keluar

---

### Quick Action

Berisi tombol cepat menuju halaman:

- Tambah Peminjaman
- Tambah Barang
- Tambah Consumable

---

# 7. Inventaris

Menu Inventaris digunakan untuk mengelola seluruh data master yang terdapat pada Ruang Tools.

---

# 7.1 Data Tools

## Tujuan

Mengelola seluruh data inventaris peralatan.

---

## Kolom Data

| Nama Kolom |
|------------|
| Kode Barang |
| Nama Barang |
| Merk |
| Tipe |
| Warna |
| Ukuran |
| Kondisi |
| Stok |
| Dipinjam |
| Tersedia |

---

## Fitur

- Tambah Data
- Edit Data
- Hapus Data
- Detail Data
- Search
- Filter
- Pagination

---

## Halaman Detail Tools

Informasi yang ditampilkan

- Informasi lengkap alat
- Riwayat peminjaman
- Riwayat pengembalian
- Riwayat perubahan kondisi
- Status alat

---

## Kondisi Alat

- Tersedia
- Dipinjam
- Rusak 
---

# 7.2 Data Consumable

## Tujuan

Mengelola seluruh barang habis pakai.

---

## Kolom Data

| Nama Kolom |
|------------|
| Kode Barang |
| Nama Barang |
| Merk |
| Tipe |
| Ukuran |
| Stok |
| Satuan |
| Keterangan |

---

## Fitur

- Tambah Data
- Edit Data
- Hapus Data
- Search
- Filter
- Monitoring Stok
- Pagination

---

## Monitoring

Menampilkan status stok barang.

- Aman
- Hampir Habis
- Habis

---

# 7.3 Data Peminjam

## Tujuan

Mengelola master data pegawai yang dapat melakukan peminjaman.

---

## Kolom Data

| Nama Kolom |
|------------|
| NIP |
| Nama Pegawai |
| Divisi |
| Jabatan |
| Status |

---

## Fitur

- Tambah Data
- Edit Data
- Hapus Data
- Search
- Filter
- Pagination

---

## Digunakan Pada

Data peminjam akan digunakan sebagai referensi pada transaksi peminjaman tools sehingga staff tidak perlu menginput data pegawai secara berulang.

---

# 8. Transaksi

Menu Transaksi digunakan untuk mencatat seluruh aktivitas keluar masuk inventaris pada Ruang Tools. Setiap transaksi akan memperbarui data inventaris secara otomatis dan tersimpan sebagai riwayat.

---

# 8.1 Peminjaman Tools

## Tujuan

Mencatat proses peminjaman peralatan oleh pegawai.

---

## Data yang Diinput

| Nama Field | Keterangan |
|------------|------------|
| Nomor Transaksi | Otomatis |
| Tanggal Pinjam | Date Picker |
| Nama Peminjam | Dropdown |
| Divisi | Otomatis dari Data Peminjam |
| Nama Barang | Dropdown |
| Jumlah | Number |
| Keperluan | Text Area |
| Estimasi Pengembalian | Date Picker |
| Status | Dipinjam |

---

## Aksi

- Simpan
- Reset
- Batal

---

## Proses Otomatis

- Mengurangi stok tersedia
- Menambah jumlah dipinjam
- Menyimpan riwayat transaksi
- Mengubah status transaksi menjadi **Dipinjam**

---

# 8.2 Pengembalian Tools

## Tujuan

Mencatat proses pengembalian alat yang sebelumnya dipinjam.

---

## Data yang Diinput

| Nama Field | Keterangan |
|------------|------------|
| Nomor Transaksi | Lookup |
| Nama Peminjam | Otomatis |
| Nama Barang | Otomatis |
| Jumlah | Otomatis |
| Tanggal Kembali | Date Picker |
| Kondisi Alat | Dropdown |
| Catatan | Text Area |

---

## Pilihan Kondisi

- Baik
- Rusak Ringan
- Rusak Berat
- Rusak Permanen

---

## Proses Otomatis

- Menambah stok tersedia
- Mengurangi jumlah dipinjam
- Mengubah status transaksi menjadi **Selesai**
- Menyimpan riwayat pengembalian

---

# 8.3 Consumable Masuk

## Tujuan

Mencatat penambahan stok barang consumable.

---

## Data yang Diinput

| Nama Field | Keterangan |
|------------|------------|
| Nomor Transaksi | Otomatis |
| Tanggal | Date Picker |
| Nama Barang | Dropdown |
| Jumlah | Number |
| Supplier | Optional |
| Keterangan | Text Area |

---

## Proses Otomatis

- Menambah stok barang
- Menyimpan riwayat transaksi

---

# 8.4 Consumable Keluar

## Tujuan

Mencatat penggunaan barang consumable.

---

## Data yang Diinput

| Nama Field | Keterangan |
|------------|------------|
| Nomor Transaksi | Otomatis |
| Tanggal | Date Picker |
| Nama Pegawai | Dropdown |
| Divisi | Otomatis |
| Nama Barang | Dropdown |
| Jumlah | Number |
| Keperluan | Text Area |

---

## Proses Otomatis

- Mengurangi stok barang
- Menyimpan riwayat transaksi

---

# 9. Riwayat

## Tujuan

Menampilkan seluruh histori aktivitas inventaris.

---

## Jenis Riwayat

- Riwayat Peminjaman
- Riwayat Pengembalian
- Riwayat Consumable Masuk
- Riwayat Consumable Keluar
- Riwayat Perubahan Kondisi Alat

---

## Fitur

- Search
- Filter Tanggal
- Filter Barang
- Filter Pegawai
- Detail Transaksi
- Pagination

---

## Detail Riwayat

Menampilkan informasi lengkap transaksi.

- Nomor Transaksi
- Tanggal
- Pegawai
- Barang
- Jumlah
- Status
- Catatan

---

# 10. Laporan

## Tujuan

Menyajikan laporan inventaris secara otomatis berdasarkan data transaksi.

---

## Jenis Laporan

- Laporan Inventaris Tools
- Laporan Peminjaman
- Laporan Pengembalian
- Laporan Consumable
- Laporan Kondisi Alat

---

## Fitur

- Filter Periode
- Filter Barang
- Preview
- Export PDF
- Export Excel
- Print

---

# 11. Pengaturan

## Tujuan

Mengelola informasi pengguna dan konfigurasi sistem.

---

## Menu

### Profil Pengguna

- Foto Profil
- Nama
- Email
- Ubah Password

---

### Manajemen Akun

- Tambah User
- Edit User
- Nonaktifkan User

---

### Hak Akses

- Administrator
- Staff Ruang Tools

---

### Pengaturan Sistem

- Informasi Aplikasi
- Backup Database
- Restore Database

---

### Logout

Keluar dari aplikasi.

---

# 12. Reusable Components

Frontend dibangun menggunakan komponen yang dapat digunakan kembali pada berbagai halaman.

## Layout

- Sidebar
- Navbar
- Footer
- Page Header

---

## UI Components

- Button
- Input
- Textarea
- Select
- Badge
- Alert
- Modal
- Card
- Tooltip
- Breadcrumb
- Avatar

---

## Table Components

- Data Table
- Pagination
- Search Bar
- Filter Dropdown
- Sort Header
- Empty State

---

## Dashboard Components

- Summary Card
- Activity Card
- Chart Card
- Statistic Card

---

## Form Components

- Form Input
- Form Select
- Date Picker
- File Upload
- Validation Message

---

# 13. Struktur Folder

```text
src/
│
├── app/
│   ├── dashboard/
│   ├── inventaris/
│   │   ├── tools/
│   │   ├── consumable/
│   │   └── peminjam/
│   ├── transaksi/
│   │   ├── peminjaman/
│   │   ├── pengembalian/
│   │   ├── consumable-masuk/
│   │   └── consumable-keluar/
│   ├── riwayat/
│   ├── laporan/
│   ├── pengaturan/
│   ├── layout.tsx
│   └── page.tsx
│
├── components/
│   ├── layout/
│   ├── ui/
│   ├── dashboard/
│   ├── inventaris/
│   ├── transaksi/
│   ├── laporan/
│   └── riwayat/
│
├── hooks/
├── lib/
├── services/
├── types/
├── utils/
├── constants/
├── styles/
└── middleware.ts
```

---

# 14. Coding Convention

## Penamaan File

Gunakan PascalCase.

Contoh

```
DashboardCard.tsx
InventoryTable.tsx
BorrowForm.tsx
Sidebar.tsx
```

---

## Penamaan Folder

Gunakan huruf kecil.

Contoh

```
components
dashboard
inventaris
transaksi
```

---

## Penamaan Variabel

Gunakan camelCase.

Contoh

```ts
const totalTools = 120;
const borrowedItems = [];
```

---

## Penamaan Interface

Gunakan awalan **I** atau nama deskriptif.

```ts
interface Tool {
  id: string;
  namaBarang: string;
  stok: number;
}
```

---

# 15. UI/UX Guidelines

Website mengusung konsep **Modern Enterprise Dashboard** dengan tampilan yang bersih, konsisten, dan mudah digunakan.

## Karakteristik

- Clean & Professional
- Responsive Layout
- Minimalist Interface
- Konsisten pada setiap halaman
- Navigasi sederhana
- Fokus pada keterbacaan data

---

## Warna

Primary

```
#006492
```

Secondary

```
#00AEEF
```

Accent

```
#FFD100
```

Background

```
#F8FAFC
```

Card

```
#FFFFFF
```

Border

```
#E5E7EB
```

---

## Komponen Visual

- Sidebar berwarna biru PLN.
- Navbar berwarna putih dengan bayangan tipis.
- Card menggunakan sudut membulat (*rounded-xl*).
- Tabel memiliki efek *hover* untuk meningkatkan keterbacaan.
- Ikon menggunakan **Lucide React**.
- Font menggunakan **Inter**.

---

# 16. Responsive Design

Website dirancang agar dapat digunakan pada berbagai ukuran layar.

## Breakpoint

| Device | Lebar |
|---------|--------|
| Mobile | < 768 px |
| Tablet | ≥ 768 px |
| Laptop | ≥ 1024 px |
| Desktop | ≥ 1280 px |

---

## Responsive Behavior

### Mobile

- Sidebar berubah menjadi **Drawer**.
- Tabel dapat digeser secara horizontal.
- Card ditampilkan dalam satu kolom.

### Tablet

- Sidebar dapat di-*collapse*.
- Grid menggunakan dua kolom.

### Desktop

- Sidebar selalu tampil.
- Dashboard menggunakan grid 4–6 kolom.
- Tabel ditampilkan penuh dengan fitur filter dan pencarian.

---

# 17. Penutup

Dokumen ini menjadi acuan pengembangan **Frontend Sistem Manajemen Inventaris Ruang Tools** menggunakan **Next.js App Router** dan **TypeScript**. Seluruh halaman, komponen, dan struktur antarmuka dirancang agar konsisten, mudah digunakan, serta mendukung proses pengelolaan inventaris secara efektif sesuai kebutuhan operasional Workshop Mekanik PT PLN (Persero).