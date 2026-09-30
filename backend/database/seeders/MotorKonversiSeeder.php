<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\MotorKonversi;

class MotorKonversiSeeder extends Seeder
{
    public function run()
    {
        // 1. Buat Data Master Motor Konversi
        $motor = MotorKonversi::create([
            'nomor_polisi' => 'B 3821 PLN',
            'nama_motor' => 'Motor Listrik Konversi Operasional',
            'merek' => 'Honda',
            'warna' => 'Merah',
            'lokasi_penempatan' => 'WORKSHOP 2',
            'status' => 'Aktif',
        ]);

        // 2. Buat Contoh Log Pemeliharaan
        $logData = [
            [
                'uraian_pemeliharaan' => 'Pengecekan tegangan baterai, pemeriksaan kabel dan konektor kelistrikan',
                'waktu_pelaksana' => '2026-08-03',
                'keterangan' => 'Tegangan baterai normal, konektor sudah dikencangkan',
                'paraf' => 'Teknisi Budi',
            ],
            [
                'uraian_pemeliharaan' => 'Pengecekan controller dan sistem pengereman regeneratif, pelumasan rantai',
                'waktu_pelaksana' => '2026-08-10',
                'keterangan' => 'Rantai sudah dilumasi, tidak ditemukan kendala',
                'paraf' => 'Teknisi Andi',
            ],
            [
                'uraian_pemeliharaan' => 'Pemeriksaan tekanan ban, pengecekan tegangan baterai',
                'waktu_pelaksana' => '2026-08-18',
                'keterangan' => 'Tekanan ban disesuaikan, baterai dalam kondisi baik',
                'paraf' => 'Teknisi Budi',
            ],
        ];

        foreach ($logData as $log) {
            $motor->logPemeliharaan()->create($log);
        }
    }
}