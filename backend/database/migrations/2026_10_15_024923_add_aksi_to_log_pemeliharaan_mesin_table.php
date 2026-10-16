<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        // Pengaman: kalau kolom sudah ada (misalnya instalasi baru dari file create di atas), lewati.
        if (Schema::hasColumn('log_pemeliharaan_mesin', 'aksi')) {
            return;
        }

        Schema::table('log_pemeliharaan_mesin', function (Blueprint $table) {
            $table->string('aksi', 1)->nullable()->after('mesin_produksi_id');
        });
    }

    public function down()
    {
        if (Schema::hasColumn('log_pemeliharaan_mesin', 'aksi')) {
            Schema::table('log_pemeliharaan_mesin', function (Blueprint $table) {
                $table->dropColumn('aksi');
            });
        }
    }
};