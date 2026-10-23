<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('log_pemeliharaan_mesin', function (Blueprint $table) {
            $table->id();
            
            // Relasi ke mesin
            $table->foreignId('mesin_produksi_id')
                  ->constrained('mesin_produksi')
                  ->onDelete('cascade');

            // Rencana yang dikerjakan lewat log ini
            $table->foreignId('rencana_id')
                  ->nullable()
                  ->constrained('rencana_pemeliharaan_mesin')
                  ->nullOnDelete();

            // === PENAMBAHAN KOLOM OLI ===
            $table->foreignId('oli_id')
                  ->nullable()
                  ->constrained('olis')
                  ->nullOnDelete();
            $table->decimal('jumlah_oli', 8, 2)->nullable();
            $table->enum('tindakan_oli', ['tambah', 'ganti'])->nullable(); // oli ditambah (top-up) atau diganti semua
            // =============================

            // Tindakan: C / L / P / M / K
            $table->string('aksi', 1)->nullable();

            $table->text('uraian_pemeliharaan');
            $table->date('waktu_pelaksana');
            $table->text('keterangan')->nullable();
            $table->string('paraf');

            // Hasil checklist visual peta part
            $table->json('hasil_checklist')->nullable();
            $table->string('status')->nullable();
            $table->integer('jumlah_part_diperiksa')->nullable();
            $table->integer('jumlah_part_total')->nullable();

            // Pelaksana pemeliharaan
            $table->enum('jenis_pelaksana', ['Internal', 'Vendor'])->default('Internal');
            $table->string('nama_vendor')->nullable();
            $table->timestamps();

            // Index kolom relasi (PostgreSQL tidak otomatis membuat index untuk foreign key)
            $table->index('mesin_produksi_id');
            $table->index('rencana_id');
            $table->index('oli_id');
        });
    }

    public function down()
    {
        Schema::dropIfExists('log_pemeliharaan_mesin');
    }
};