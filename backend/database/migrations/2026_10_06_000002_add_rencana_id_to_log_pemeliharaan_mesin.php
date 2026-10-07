<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Untuk DATABASE YANG SUDAH ADA: menambahkan rencana_id ke tabel log.
// Pada instalasi baru kolom ini sudah dibuat oleh migrasi create_log_pemeliharaan_mesin,
// sehingga migrasi ini otomatis dilewati.
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('log_pemeliharaan_mesin', 'rencana_id')) {
            return;
        }

        Schema::table('log_pemeliharaan_mesin', function (Blueprint $table) {
            $table->foreignId('rencana_id')
                ->nullable()
                ->after('mesin_produksi_id')
                ->constrained('rencana_pemeliharaan_mesin')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        if (!Schema::hasColumn('log_pemeliharaan_mesin', 'rencana_id')) {
            return;
        }

        Schema::table('log_pemeliharaan_mesin', function (Blueprint $table) {
            $table->dropConstrainedForeignId('rencana_id');
        });
    }
};