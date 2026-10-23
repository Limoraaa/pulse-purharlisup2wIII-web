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
            
            // Menggunakan foreignId yang otomatis membuat tipe bigint unsigned 
            // dan langsung menghubungkannya ke tabel mesin_produksi
            $table->foreignId('mesin_produksi_id')
                  ->constrained('mesin_produksi')
                  ->onDelete('cascade');

            // Rencana yang dikerjakan lewat log ini (kosong bila bukan dari rencana)
            $table->foreignId('rencana_id')
                  ->nullable()
                  ->constrained('rencana_pemeliharaan_mesin')
                  ->nullOnDelete();

            // Tindakan: C / L / P / M / K, dipakai untuk mencocokkan log ke plotting rencana
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

            // Pelaksana pemeliharaan: internal PLN atau vendor (pihak ketiga)
            $table->enum('jenis_pelaksana', ['Internal', 'Vendor'])->default('Internal');
            $table->string('nama_vendor')->nullable();
            $table->timestamps();

            // Index kolom relasi (PostgreSQL tidak otomatis membuat index untuk foreign key)
            $table->index('mesin_produksi_id');
            $table->index('rencana_id');
        });
    }

    public function down()
    {
        Schema::dropIfExists('log_pemeliharaan_mesin');
    }
};