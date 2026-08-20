<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tools', function (Blueprint $table) {
            $table->uuid('id')->default(DB::raw('gen_random_uuid()'))->primary();
            $table->string('kode_barang')->unique();
            $table->string('nama_barang');
            $table->string('merk')->nullable();
            $table->string('type')->nullable();
            $table->string('warna')->nullable();
            $table->string('ukuran')->nullable();
            $table->integer('stok')->default(0);
            $table->string('keadaan')->default('B'); // B = Baik, R = Rusak
            $table->string('kategori')->default('alat_biasa'); // mesin / alat_biasa
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }


    public function down(): void
    {
        Schema::dropIfExists('tools');
    }
};
