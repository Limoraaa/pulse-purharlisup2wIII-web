<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    // ID consumable berbentuk UUID, tetapi kolom order_consumables.consumable_id dibuat bigint,
    // sehingga order tidak pernah tersambung ke barangnya (selalu tersimpan kosong).
    // Nilai lama tidak mungkin menunjuk ke consumable mana pun, jadi dikosongkan dulu.

    public function up(): void
    {
        DB::table('order_consumables')->update(['consumable_id' => null]);

        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE order_consumables ALTER COLUMN consumable_id TYPE uuid USING NULL');
        } elseif (in_array($driver, ['mysql', 'mariadb'])) {
            DB::statement('ALTER TABLE order_consumables MODIFY consumable_id CHAR(36) NULL');
        }
        // SQLite hanya dipakai untuk testing; tipe kolomnya longgar sehingga dibiarkan apa adanya
    }

    public function down(): void
    {
        DB::table('order_consumables')->update(['consumable_id' => null]);

        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE order_consumables ALTER COLUMN consumable_id TYPE bigint USING NULL');
        } elseif (in_array($driver, ['mysql', 'mariadb'])) {
            DB::statement('ALTER TABLE order_consumables MODIFY consumable_id BIGINT UNSIGNED NULL');
        }
    }
};
