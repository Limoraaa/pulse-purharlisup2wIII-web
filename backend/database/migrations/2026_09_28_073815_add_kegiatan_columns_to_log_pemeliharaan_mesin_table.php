<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // ASUMSI: nama tabel log = log_pemeliharaan_mesin (dari nama migration
    // create_log_pemeliharaan_mesin_table). Kalau di project kamu beda, ganti di sini.
    public function up(): void
    {
        Schema::table('log_pemeliharaan_mesin', function (Blueprint $table) {
            $table->json('hasil_checklist')->nullable();
            $table->string('status', 20)->nullable();
            $table->unsignedSmallInteger('jumlah_part_diperiksa')->nullable();
            $table->unsignedSmallInteger('jumlah_part_total')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('log_pemeliharaan_mesin', function (Blueprint $table) {
            $table->dropColumn(['hasil_checklist', 'status', 'jumlah_part_diperiksa', 'jumlah_part_total']);
        });
    }
};