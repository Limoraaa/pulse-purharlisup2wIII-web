<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('olis', function (Blueprint $table) {
            $table->id();
            $table->string('kode_oli')->unique();
            $table->string('nama_oli');
            $table->decimal('stok', 8, 2)->default(0); // Stok menggunakan desimal
            $table->string('satuan')->default('Liter');
            $table->decimal('batas_minimum', 8, 2)->default(5); // Batas peringatan stok
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('olis');
    }
};