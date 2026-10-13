# UI Design Guideline
## Sistem Manajemen Inventaris Ruang Tools
PT PLN (Persero)

---

# Tujuan

Dokumen ini menjadi acuan utama dalam melakukan redesign tampilan website. Fokus pekerjaan hanya pada peningkatan User Interface (UI) dan User Experience (UX).

JANGAN mengubah alur bisnis, struktur menu, logika program, API, database, maupun fungsi yang telah berjalan.

Prioritas utama adalah membuat tampilan yang modern, profesional, bersih, konsisten, dan mudah digunakan oleh staff Ruang Tools.

---

# Konsep Desain

Tema desain:

- Modern
- Clean
- Minimalis
- Professional
- Corporate
- Dashboard Admin
- Mudah digunakan
- Fokus pada keterbacaan data

Referensi gaya:

- Ant Design Pro
- CoreUI
- Tabler
- Shadcn UI
- Vercel Dashboard
- Material Design 3

---

# Branding

Menggunakan identitas visual PT PLN.

Primary Color

#006492

Secondary Color

#00AEEF

Accent

#13A8FF

Success

#22C55E

Warning

#F59E0B

Danger

#EF4444

Background

#F8FAFC

Sidebar

#FFFFFF

Card

#FFFFFF

Border

#E5E7EB

Text Primary

#1F2937

Text Secondary

#6B7280

---

# Typography

Gunakan font

Inter

atau

Poppins

Prioritas:

Inter

Ukuran

Heading

24-30px

Sub Heading

18-20px

Body

14-16px

Caption

12px

Gunakan font-weight yang konsisten.

---

# Border Radius

Card

16px

Button

10px

Input

10px

Table

12px

Modal

16px

---

# Shadow

Gunakan shadow tipis.

Contoh

box-shadow:

0 2px 10px rgba(0,0,0,.05)

Hindari shadow berlebihan.

---

# Sidebar

Sidebar dibuat sederhana.

Menu yang digunakan:

📊 Dashboard

📦 Inventaris

- Data Tools
- Data Consumable
- Data Peminjam

🔄 Transaksi

- Peminjaman Aktif
- Consumable Masuk

🕘 Riwayat

- Peminjaman Tools
- Consumable Keluar

📈 Laporan Kerusakan Alat

Logout

---

Sidebar harus:

- collapsible
- icon modern
- active menu memiliki indicator
- animasi hover halus
- tinggi menu konsisten
- icon dan teks sejajar

---

# Header

Header dibuat sederhana.

Berisi:

Logo PT PLN

Nama Sistem

Search

Notification

User Profile

Tidak terlalu tinggi.

---

# Dashboard

Dashboard merupakan halaman utama.

Gunakan card modern.

Card memiliki:

Icon

Judul

Nilai

Trend kecil bila diperlukan

Gunakan grid responsive.

---

# Card

Gunakan card putih.

Radius besar.

Padding 20-24px.

Jarak antar card konsisten.

---

# Table

Semua halaman data menggunakan style yang sama.

Table harus:

header berwarna terang

hover row

striped optional

rounded

responsive

pagination modern

sticky header jika diperlukan

---

# Button

Gunakan button dengan style modern.

Primary

warna PLN

Secondary

outline

Danger

merah

Success

hijau

Icon berada di kiri teks.

Contoh

+ Tambah Data

Edit

Detail

Export PDF

Export Excel

---

# Form

Semua form menggunakan:

Label di atas input

Spacing konsisten

Input tinggi sekitar 42-48px

Border radius 10px

Placeholder jelas

Validasi sederhana

---

# Modal

Gunakan modal modern.

Lebar proporsional.

Header jelas.

Footer hanya berisi:

Batal

Simpan

---

# Badge

Gunakan badge untuk status.

Hijau

Tersedia

Biru

Dipinjam

Merah

Rusak Permanen



---

# Icon

Gunakan icon dari

Lucide React

atau

Heroicons

Hindari icon lama.

---

# Animasi

Gunakan animasi ringan.

Hover

Fade

Scale kecil

Transition 200ms

Tidak menggunakan animasi berlebihan.

---

# Responsive

Desktop

Laptop

Tablet

Semua halaman harus responsive.

Sidebar berubah menjadi drawer pada mobile.

---

# Konsistensi Layout

Semua halaman memiliki struktur:

Breadcrumb

Judul

Deskripsi singkat

Toolbar

Table/Card

Pagination

---

# Halaman Yang Harus Dirapikan

Dashboard

Data Tools

Data Consumable

Data Peminjam

Peminjaman Aktif

Consumable Masuk

Riwayat Peminjaman

Riwayat Consumable Keluar

Laporan Kerusakan Alat

Semua Form

Semua Modal

Semua Table

---

# Aturan Penting

JANGAN mengubah:

- routing
- logic React
- API
- backend
- database
- nama field
- fungsi button
- struktur menu

Fokus hanya pada:

- layout
- warna
- typography
- spacing
- alignment
- icon
- card
- table
- button
- form
- responsive
- UI consistency

---

# Goal Akhir

Hasil akhir harus menyerupai dashboard admin profesional yang modern dengan identitas visual PT PLN, memiliki tampilan bersih, konsisten, nyaman digunakan, serta memudahkan staff Ruang Tools dalam melakukan pengelolaan inventaris sehari-hari.