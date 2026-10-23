<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('consumables', function (Blueprint $table) {
            $table->uuid('id')->default(DB::raw('gen_random_uuid()'))->primary();
            $table->string('kode_barang'); // unik hanya di antara yang aktif (index parsial di bawah)
            $table->string('nama');
            $table->string('merk')->nullable();
            $table->string('type')->nullable();
            $table->string('er_e')->nullable();
            $table->string('ukuran')->nullable();
            $table->string('satuan')->nullable();
            $table->integer('stok_awal_asli')->default(0);
            $table->integer('stok_tersedia')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Kode barang boleh dipakai lagi setelah consumable lama dihapus (dinonaktifkan), sama seperti tools
        DB::statement('CREATE UNIQUE INDEX consumables_kode_barang_active_unique ON consumables (kode_barang) WHERE is_active = true');
    }

     public function down(): void
    {
        Schema::dropIfExists('consumables');
    }
};
