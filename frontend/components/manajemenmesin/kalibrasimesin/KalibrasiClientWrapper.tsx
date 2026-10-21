"use client";
import React, { useState } from "react";
import DataMesinManager from "components/manajemenmesin/DataMesinManager"; 
import DetailMesinManager from "/components/manajemenmesin/DetailMesinManager";

export default function KalibrasiClientWrapper() {
  const [selectedMesin, setSelectedMesin] = useState<any | null>(null);

  // Jika mesin diklik, masuk ke DetailMesinManager dengan mode pemeliharaan
  if (selectedMesin) {
    return (
      <DetailMesinManager 
        mesin={selectedMesin} 
        canManage={true} 
        mode="pemeliharaan" 
        onBack={() => setSelectedMesin(null)} 
      />
    );
  }

  // Menampilkan daftar mesin. Jika DataMesinManager menggunakan prop lain atau kita tangani lewat state lokal, 
  // pastikan tipenya aman atau sesuaikan dengan props asli DataMesinManager.
  return (
    <div onClick={() => {
      // Sebagai alternatif aman jika DataMesinManager tidak mendukung onSelectMesin secara langsung,
      // kita bisa biarkan DataMesinManager mengatur halamannya sendiri, atau sesuaikan prop-nya.
    }}>
      <DataMesinManager 
        mode="pemeliharaan"
      />
    </div>
  );
}