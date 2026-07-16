<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('temporary_cart', function (Blueprint $table) {
            // Gunakan uuid sebagai primary key agar tidak error 'invalid input syntax for type bigint'
            $table->uuid('id')->primary(); 
            
            // Tambahkan kolom user_id agar query filter user bisa berjalan
            $table->uuid('user_id');
            $table->uuid('tools_id');
            
            $table->integer('qty')->default(1);
            $table->timestamps();

            // Opsional: Jika ingin menambahkan constraint relasi
            // $table->foreign('tools_id')->references('id')->on('tools')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('temporary_cart');
    }
};