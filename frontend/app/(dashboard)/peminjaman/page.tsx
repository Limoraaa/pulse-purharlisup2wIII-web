'use client'

import { useState, useEffect } from 'react'

export default function PeminjamanPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Fungsi untuk mengambil data yang masuk ke API Peminjaman
  const fetchAntreanScan = async () => {
    try {
      const response = await fetch("http://10.22.46.156:8001/api/peminjaman/antrean")
      
      if (!response.ok) throw new Error('Network error')
      
      // BACA RESPONSE HANYA SEKALI
      const result = await response.json()
      
      // GUNAKAN HASILNYA
      setItems(result.data || [])
      
    } catch (error) {
      console.error("Gagal ambil data:", error)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Tampilkan loading hanya saat pertama kali halaman dibuka
    setLoading(true)
    fetchAntreanScan()
    
    // Refresh otomatis setiap 3 detik
    const interval = setInterval(fetchAntreanScan, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6 text-slate-800">Uji Coba Scan QR</h1>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        {loading ? (
          <p className="text-slate-500">Memuat data antrean...</p>
        ) : !items || items?.length === 0 ? (
          // SAFETY CHECK 3: Menggunakan !items || items?.length === 0 agar tidak error saat undefined
          <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-lg">
            <p className="text-slate-500">Belum ada alat yang discan. Arahkan HP ke QR Code!</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((item: any, index: number) => (
              <li key={index} className="flex justify-between p-4 bg-slate-50 rounded-md border border-slate-200">
                <span className="font-semibold text-slate-800">
                  {item.tools_id} 
                  {item.nama_tools ? ` - ${item.nama_tools}` : ''}
                </span>
                <span className="text-blue-600 font-bold">Qty: {item.qty}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}