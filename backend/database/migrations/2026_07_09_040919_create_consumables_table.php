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
            $table->string('kode_barang')->unique();
            $table->string('nama');
            $table->string('merk')->nullable();
            $table->string('type')->nullable();
            $table->string('er_e')->nullable();
            $table->string('ukuran')->nullable();
            $table->string('satuan')->nullable();
            $table->integer('stok_awal')->default(0);
            $table->integer('stok_awal_asli')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

     public function down(): void
    {
        Schema::dropIfExists('consumables');
    }
};
