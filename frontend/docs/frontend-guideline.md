# Frontend Guideline
# Sistem Manajemen Inventaris Ruang Tools
## Workshop Mekanik PT PLN (Persero)

---

# 1. Tujuan

Dokumen ini menjadi pedoman pengembangan Frontend Sistem Manajemen Inventaris Ruang Tools menggunakan **Next.js App Router** dan **TypeScript**.

Seluruh kode yang dikembangkan harus mengikuti standar yang telah ditetapkan agar mudah dipelihara, konsisten, scalable, dan mudah dipahami oleh seluruh anggota tim.

---

# 2. Technology Stack

| Technology | Keterangan |
|------------|------------|
| Next.js 15 | Framework Frontend |
| React 19 | UI Library |
| TypeScript | Bahasa Pemrograman |
| Tailwind CSS | Styling |
| Shadcn UI | UI Components |
| Lucide React | Icon |
| Axios | HTTP Client |
| TanStack Table | Data Table |
| React Hook Form | Form Management |
| Chart.js | Dashboard Chart |

---

# 3. Coding Principles

Seluruh kode harus mengikuti prinsip berikut.

- Clean Code
- Reusable Component
- Separation of Concerns
- DRY (Don't Repeat Yourself)
- KISS (Keep It Simple)
- Readable Code

---

# 4. Folder Structure

```
src/
│
├── app/
├── components/
├── hooks/
├── services/
├── types/
├── lib/
├── utils/
├── constants/
├── styles/
└── middleware.ts
```

Setiap folder memiliki tanggung jawab masing-masing.

---

# 5. Naming Convention

## Folder

Gunakan huruf kecil.

Contoh

```
dashboard
inventaris
transaksi
components
```

---

## File Component

Gunakan PascalCase.

```
DashboardCard.tsx

InventoryTable.tsx

BorrowDialog.tsx

Sidebar.tsx
```

---

## Page

```
page.tsx

layout.tsx

loading.tsx

error.tsx

not-found.tsx
```

---

## Variables

Gunakan camelCase.

```ts
const totalTools

const totalBorrowed

const selectedTool
```

---

## Function

Gunakan camelCase.

```ts
getTools()

updateInventory()

deleteBorrow()
```

---

## Interface

Gunakan PascalCase.

```ts
interface Tool {}

interface Borrow {}

interface User {}
```

---

## Enum

Gunakan PascalCase.

```ts
enum ToolStatus {}

enum BorrowStatus {}
```

---

## Constant

Gunakan UPPER_CASE.

```ts
MAX_UPLOAD_SIZE

DEFAULT_PAGE_SIZE
```

---

# 6. Import Rules

Urutan import.

```ts
// React

// Next

// Third Party

// Components

// Hooks

// Services

// Utils

// Types

// Styles
```

Contoh

```tsx
import { useState } from "react";

import Link from "next/link";

import axios from "axios";

import Button from "@/components/ui/button";

import { useAuth } from "@/hooks/useAuth";

import { Tool } from "@/types/tool";
```

---

# 7. Component Rules

Satu komponen hanya memiliki satu tanggung jawab.

❌ Jangan

```
Dashboard.tsx

+
Inventory Table

+
Modal

+
API

+
Chart
```

Semua menjadi satu file.

---

✅ Pisahkan.

```
DashboardCard.tsx

InventoryTable.tsx

BorrowModal.tsx

ChartCard.tsx
```

---

# 8. Props

Seluruh props wajib menggunakan TypeScript.

```tsx
interface ButtonProps{

title:string

loading:boolean

onClick:()=>void

}
```

---

# 9. State Management

State lokal

Gunakan

```
useState()
```

State kompleks

Gunakan

```
useReducer()
```

Global

Gunakan

```
Context API
```

---

# 10. API Request

Seluruh request dilakukan melalui folder

```
services/
```

Contoh

```
services/

inventory.service.ts

borrow.service.ts

report.service.ts
```

Jangan memanggil axios langsung dari halaman.

---

# 11. Styling Rules

Gunakan

```
Tailwind CSS
```

Hindari CSS biasa kecuali benar-benar diperlukan.

---

Gunakan utility class.

Contoh

```tsx
className="flex items-center justify-between rounded-xl border bg-white p-6"
```

---

# 12. Color Palette

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

Success

```
#22C55E
```

Warning

```
#F59E0B
```

Danger

```
#EF4444
```

Background

```
#F8FAFC
```

---

# 13. Typography

Font

```
Inter
```

Heading

```
font-semibold
```

Body

```
font-normal
```

---

# 14. Icon

Gunakan

```
Lucide React
```

Hindari penggunaan icon dari library lain.

---

# 15. Form Guideline

Seluruh form menggunakan

```
React Hook Form
```

Validasi menggunakan

```
Zod
```

Setiap form wajib memiliki

- Label
- Placeholder
- Error Message
- Helper Text (jika diperlukan)

---

# 16. Data Table Guideline

Gunakan

```
TanStack Table
```

Fitur minimum

- Search
- Sorting
- Pagination
- Filter
- Empty State
- Loading State

---

# 17. Loading State

Setiap halaman wajib memiliki loading.

Gunakan

- Skeleton
- Spinner

Jangan menampilkan halaman kosong.

---

# 18. Empty State

Jika data kosong tampilkan ilustrasi sederhana beserta pesan yang informatif.

Contoh

```
Belum ada data inventaris.
```

---

# 19. Error Handling

Gunakan toast notification.

Contoh

```
Data berhasil disimpan.

Data berhasil diperbarui.

Gagal mengambil data.
```

---

# 20. Responsive Design

Breakpoint

| Device | Width |
|---------|------:|
| Mobile | <768px |
| Tablet | ≥768px |
| Laptop | ≥1024px |
| Desktop | ≥1280px |

Sidebar

Desktop

```
Expanded
```

Tablet

```
Collapsible
```

Mobile

```
Drawer
```

---

# 21. Commit Message

Gunakan format berikut.

```
feat: tambah halaman dashboard

feat: tambah data tools

fix: perbaiki pagination

style: rapikan tampilan tabel

refactor: pisahkan inventory table

docs: update inventaris.md
```

---

# 22. Best Practice

- Gunakan reusable component.
- Hindari duplikasi kode.
- Pisahkan logika bisnis dari tampilan.
- Gunakan TypeScript secara konsisten.
- Selalu gunakan interface untuk data.
- Komponen maksimal menangani satu fungsi utama.
- Pastikan tampilan responsif pada seluruh perangkat.
- Gunakan penamaan yang konsisten di seluruh proyek.

---

# 23. Penutup

Dokumen ini menjadi standar pengembangan frontend Sistem Manajemen Inventaris Ruang Tools. Seluruh anggota tim diharapkan mengikuti pedoman ini agar kode yang dihasilkan konsisten, mudah dipelihara, dan siap dikembangkan di masa mendatang.