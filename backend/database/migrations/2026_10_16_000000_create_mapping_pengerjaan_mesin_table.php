<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mapping_pengerjaan_mesin', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mesin_id')->constrained('mesin_produksi')->onDelete('cascade');
            $table->string('nama_pekerjaan');
            $table->date('tanggal_mulai');
            $table->date('tanggal_selesai');
            $table->text('keterangan')->nullable();
            $table->timestamps();

            // Index kolom relasi (PostgreSQL tidak otomatis membuat index untuk foreign key)
            $table->index('mesin_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mapping_pengerjaan_mesin');
    }
};