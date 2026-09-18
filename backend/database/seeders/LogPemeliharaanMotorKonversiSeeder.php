<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\LogPemeliharaanMotorKonversi;
use App\Models\MotorKonversi;

class LogPemeliharaanMotorKonversiSeeder extends Seeder
{
    public function run()
    {
        // Pastikan ada data motor konversi setidaknya satu untuk direlasikan
        $motor = MotorKonversi::first();

        if ($motor) {
            LogPemeliharaanMotorKonversi::insert([
                [
                    'motor_konversi_id' => $motor->id,
                    'uraian_pemeliharaan' => 'Pengecekan tegangan dan kondisi baterai',
                    'waktu_pelaksana' => '2026-08-01',
                    'keterangan' => 'Kondisi baterai baik, tidak ada penurunan performa',
                    'paraf' => 'Teknisi Rian',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'motor_konversi_id' => $motor->id,
                    'uraian_pemeliharaan' => 'Pemeriksaan kabel dan konektor sistem kelistrikan motor',
                    'waktu_pelaksana' => '2026-08-05',
                    'keterangan' => 'Ditemukan konektor kendor, sudah dikencangkan',
                    'paraf' => 'Teknisi Rian',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'motor_konversi_id' => $motor->id,
                    'uraian_pemeliharaan' => 'Pengecekan controller dan sistem pengereman regeneratif',
                    'waktu_pelaksana' => '2026-08-12',
                    'keterangan' => 'Tidak ditemukan kendala berarti',
                    'paraf' => 'Teknisi Dian',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'motor_konversi_id' => $motor->id,
                    'uraian_pemeliharaan' => 'Pelumasan rantai dan pemeriksaan ban',
                    'waktu_pelaksana' => '2026-08-20',
                    'keterangan' => 'Tekanan ban disesuaikan sesuai standar',
                    'paraf' => 'Supervisor Andi',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]);
        }
    }
}