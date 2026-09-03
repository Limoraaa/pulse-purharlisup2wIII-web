<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('consumable_keluar', function (Blueprint $table) {
            $table->uuid('id')->default(DB::raw('gen_random_uuid()'))->primary();
            $table->timestamp('tanggal');
            $table->foreignUuid('consumable_id')->constrained('consumables');
            $table->string('peminta_id'); 
            $table->integer('jumlah_keluar');
            $table->string('satuan')->nullable(); // Kolom satuan disesuaikan
            $table->string('pekerjaan_area')->nullable();
            $table->string('nama_pekerjaan')->nullable();
            $table->text('keterangan')->nullable();
            $table->foreignUuid('dicatat_oleh')->constrained('users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('consumable_keluar');
    }
};