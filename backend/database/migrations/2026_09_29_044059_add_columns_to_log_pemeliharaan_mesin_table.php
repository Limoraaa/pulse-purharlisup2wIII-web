<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddColumnsToLogPemeliharaanMesinTable extends Migration
{
    public function up(): void
    {
        Schema::table('log_pemeliharaan_mesin', function (Blueprint $table) {
            if (!Schema::hasColumn('log_pemeliharaan_mesin', 'hasil_checklist')) {
                $table->json('hasil_checklist')->nullable();
            }
            if (!Schema::hasColumn('log_pemeliharaan_mesin', 'status')) {
                $table->string('status')->nullable();
            }
            if (!Schema::hasColumn('log_pemeliharaan_mesin', 'jumlah_part_diperiksa')) {
                $table->integer('jumlah_part_diperiksa')->nullable();
            }
            if (!Schema::hasColumn('log_pemeliharaan_mesin', 'jumlah_part_total')) {
                $table->integer('jumlah_part_total')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('log_pemeliharaan_mesin', function (Blueprint $table) {
            $table->dropColumn([
                'hasil_checklist',
                'status',
                'jumlah_part_diperiksa',
                'jumlah_part_total',
            ]);
        });
    }
}