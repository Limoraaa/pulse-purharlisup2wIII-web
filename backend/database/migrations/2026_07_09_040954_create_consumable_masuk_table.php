<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('consumable_masuk', function (Blueprint $table) {
            $table->uuid('id')->default(DB::raw('gen_random_uuid()'))->primary();
            $table->timestamp('tanggal');
            $table->foreignUuid('consumable_id')->constrained('consumables');
            $table->integer('jumlah_masuk');
            $table->string('satuan')->nullable(); // Kolom satuan ditambahkan di sini
            $table->text('keterangan')->nullable();
            $table->string('dicatat_oleh'); // ID kartu Inventory Man (tabel peminta)
            $table->foreign('dicatat_oleh')->references('id')->on('peminta')->onUpdate('cascade');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('consumable_masuk');
    }
};
