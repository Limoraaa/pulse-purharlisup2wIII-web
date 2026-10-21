<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    // Tambah status "Tidak Aktif" untuk fitur Nonaktifkan mesin/motor
    // (enum awal hanya Aktif, Maintenance, Rusak sehingga toggle status selalu gagal).
    private const TABEL = ['mesin_produksi', 'motor_konversi'];

    public function up(): void
    {
        $this->ubahStatus(['Aktif', 'Maintenance', 'Rusak', 'Tidak Aktif']);
    }

    public function down(): void
    {
        foreach (self::TABEL as $tabel) {
            DB::table($tabel)->where('status', 'Tidak Aktif')->update(['status' => 'Rusak']);
        }
        $this->ubahStatus(['Aktif', 'Maintenance', 'Rusak']);
    }

    private function ubahStatus(array $nilai): void
    {
        $daftar = "'" . implode("','", $nilai) . "'";

        foreach (self::TABEL as $tabel) {
            $driver = DB::getDriverName();

            if ($driver === 'pgsql') {
                // Laravel membuat enum di PostgreSQL sebagai CHECK constraint "{tabel}_status_check"
                DB::statement("ALTER TABLE {$tabel} DROP CONSTRAINT IF EXISTS {$tabel}_status_check");
                DB::statement("ALTER TABLE {$tabel} ADD CONSTRAINT {$tabel}_status_check CHECK (status IN ({$daftar}))");
            } elseif (in_array($driver, ['mysql', 'mariadb'])) {
                DB::statement("ALTER TABLE {$tabel} MODIFY status ENUM({$daftar}) NOT NULL DEFAULT 'Aktif'");
            }
            // SQLite hanya dipakai untuk testing; dibiarkan apa adanya
        }
    }
};
