<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * PostgreSQL tidak otomatis membuat index untuk kolom foreign key.
 * Index ini mempercepat query per alat / per mesin / per peminta (dashboard, riwayat, detail)
 * saat data sudah banyak. Tidak mengubah isi data.
 */
return new class extends Migration
{
    private const KOLOM = [
        'consumable_keluar' => ['consumable_id', 'peminta_id'],
        'consumable_masuk' => ['consumable_id', 'dicatat_oleh'],
        'dokumen_mesin' => ['mesin_produksi_id', 'diunggah_oleh'],
        'kalibrasi_mesin' => ['mesin_produksi_id', 'rencana_pemeliharaan_id'],
        'laporan_kerusakan_tools' => ['tool_id', 'peminjaman_id'],
        'log_aktivitas_mesin' => ['mesin_produksi_id'],
        'log_pemeliharaan_mesin' => ['mesin_produksi_id', 'rencana_id'],
        'log_pemeliharaan_motor_konversi' => ['motor_konversi_id'],
        'mapping_pengerjaan_mesin' => ['mesin_id'],
        'order_consumables' => ['peminta_id'],
        'order_tools' => ['peminta_id', 'tool_id'],
        'peminjaman' => ['tool_id', 'peminta_id'],
        'tools_masuk' => ['tool_id', 'dicatat_oleh'],
    ];

    public function up(): void
    {
        foreach (self::KOLOM as $tabel => $kolom) {
            Schema::table($tabel, function (Blueprint $table) use ($kolom) {
                foreach ($kolom as $k) {
                    $table->index($k);
                }
            });
        }
    }

    public function down(): void
    {
        foreach (self::KOLOM as $tabel => $kolom) {
            Schema::table($tabel, function (Blueprint $table) use ($kolom) {
                foreach ($kolom as $k) {
                    $table->dropIndex([$k]);
                }
            });
        }
    }
};
