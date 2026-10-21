<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('rencana_pemeliharaan_mesin', function (Blueprint $table) {
            $table->enum('jenis_pelaksana', ['Internal', 'Vendor'])->default('Internal')->after('status');
            $table->string('nama_vendor')->nullable()->after('jenis_pelaksana');
            $table->string('no_po')->nullable()->after('nama_vendor');
            $table->integer('biaya_aktual')->nullable()->after('rab');
        });
    }

    public function down()
    {
        Schema::table('rencana_pemeliharaan_mesin', function (Blueprint $table) {
            $table->dropColumn(['jenis_pelaksana', 'nama_vendor', 'no_po', 'biaya_aktual']);
        });
    }
};