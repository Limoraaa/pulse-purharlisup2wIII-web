<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('temporary_cart', function (Blueprint $table) {
            $table->id();
            $table->uuid('user_id');
            $table->uuid('tools_id');
            $table->integer('qty')->default(1);
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('tools_id')->references('id')->on('tools')->onDelete('cascade');
            $table->unique(['user_id', 'tools_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('temporary_cart');
    }
};