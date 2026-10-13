<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('log_pemeliharaan_motor_konversi', 'hasil_checklist')) {
            Schema::table('log_pemeliharaan_motor_konversi', function (Blueprint $table) {
                $table->json('hasil_checklist')->nullable();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('log_pemeliharaan_motor_konversi', 'hasil_checklist')) {
            Schema::table('log_pemeliharaan_motor_konversi', function (Blueprint $table) {
                $table->dropColumn('hasil_checklist');
            });
        }
    }
};
