<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Pelaksana pemeliharaan: dikerjakan internal PLN atau oleh vendor (pihak ketiga)
    public function up(): void
    {
        Schema::table('log_pemeliharaan_mesin', function (Blueprint $table) {
            $table->enum('jenis_pelaksana', ['Internal', 'Vendor'])->default('Internal');
            $table->string('nama_vendor')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('log_pemeliharaan_mesin', function (Blueprint $table) {
            $table->dropColumn(['jenis_pelaksana', 'nama_vendor']);
        });
    }
};
