<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Dokumen rahasia mesin (IK Operasional, IK Pemeliharaan, HIRARC).
        // File PDF disimpan di disk privat, bukan di folder publik.
        Schema::create('dokumen_mesin', function (Blueprint $table) {
            $table->id();
            $table->enum('jenis', ['ik_operasional', 'ik_pemeliharaan', 'hirarc']);
            // NULL untuk HIRARC karena satu dokumen berlaku untuk semua mesin
            $table->foreignId('mesin_produksi_id')->nullable()->constrained('mesin_produksi')->cascadeOnDelete();
            $table->string('judul');
            $table->string('nomor_dokumen', 100)->nullable();
            $table->string('revisi', 50)->nullable();
            $table->string('file_path');
            $table->unsignedInteger('ukuran')->default(0); // byte
            $table->foreignUuid('diunggah_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['jenis', 'mesin_produksi_id']);

            // Index kolom relasi (PostgreSQL tidak otomatis membuat index untuk foreign key)
            $table->index('mesin_produksi_id');
            $table->index('diunggah_oleh');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dokumen_mesin');
    }
};
