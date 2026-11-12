# Panduan Deploy ke VPS (Ubuntu 26.04 LTS)

Susunan yang dipakai:

| Bagian | Alamat | Isi |
|---|---|---|
| Frontend (Next.js, static export) | `https://namadomain.com` | file statis hasil `npm run build` (folder `frontend/out`) |
| Backend (Laravel API) | `https://api.namadomain.com` | `backend/public` lewat PHP-FPM |

Ganti `namadomain.com` dengan domain yang dibeli. Buat dua record DNS **A** (`@` dan `api`) yang mengarah ke IP VPS.

> Jangan pernah mengirim password VPS / database ke siapa pun (termasuk lewat chat). Simpan sendiri.

> **Versi PHP:** backend butuh **PHP 8.4.1 atau lebih baru** (Laravel 13 / Symfony 8). Pilih **Ubuntu 26.04 LTS**
> saat membeli VPS. Ubuntu 24.04 hanya membawa PHP 8.3 sehingga backend tidak bisa berjalan.
> Sebelum memasang paket, cek versi yang tersedia:
> ```bash
> apt-cache policy php8.4-fpm
> ```
> Bila yang tersedia versi lain (≥ 8.4, mis. 8.5), ganti semua `8.4` di panduan ini dengan versi tersebut
> (nama paket `php8.x-...`, file `/etc/php/8.x/fpm/php.ini`, dan socket `/run/php/php8.x-fpm.sock`).

---

## 1. Paket yang dibutuhkan

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx postgresql git unzip curl \
  php8.4-fpm php8.4-cli php8.4-pgsql php8.4-mbstring php8.4-xml php8.4-curl php8.4-zip php8.4-gd php8.4-intl php8.4-bcmath
# Composer
curl -sS https://getcomposer.org/installer | php && sudo mv composer.phar /usr/local/bin/composer
# Node.js 22 (untuk build frontend)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo bash - && sudo apt install -y nodejs
```

### Swap (cadangan RAM)

Build frontend bisa memakai RAM 1–2 GB. Agar VPS 4 GB tidak kehabisan memori, buat swap 2 GB (sekali saja):

```bash
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## 2. Database PostgreSQL

```bash
sudo -u postgres psql
```
```sql
CREATE USER pulse WITH PASSWORD 'GANTI_PASSWORD_KUAT';
CREATE DATABASE pulse OWNER pulse;
\q
```

## 3. Ambil kode

```bash
sudo mkdir -p /var/www && cd /var/www
sudo git clone https://github.com/Limoraaa/pulse-purharlisup2wIII-web.git pulse
sudo chown -R $USER:www-data /var/www/pulse
```

## 4. Backend (Laravel)

```bash
cd /var/www/pulse/backend
composer install --no-dev --optimize-autoloader
cp .env.example .env
php artisan key:generate
nano .env
```

Isi `.env` minimal:

```dotenv
APP_NAME="PULSE PUSHARLIS"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.namadomain.com
LOG_LEVEL=warning

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=pulse
DB_USERNAME=pulse
DB_PASSWORD=GANTI_PASSWORD_KUAT

FRONTEND_URL=https://namadomain.com
SANCTUM_EXPIRATION=10080

# Akun Super Admin pertama (hanya dipakai saat db:seed di produksi)
SUPERADMIN_USERNAME=superadmin
SUPERADMIN_PASSWORD=GANTI_PASSWORD_ADMIN_MIN_8_KARAKTER
```

Lalu:

```bash
php artisan migrate --force
php artisan db:seed --force        # produksi: hanya role/permission + 1 Super Admin (tanpa data contoh)
php artisan storage:link           # agar foto/gambar di storage bisa diakses
php artisan config:cache
php artisan route:cache

sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache
```

> **Jangan** jalankan `migrate:fresh` di server setelah ada data asli — semua data akan terhapus.
> Setelah login pertama, segera ganti password Super Admin dari menu Profil, lalu hapus
> `SUPERADMIN_PASSWORD` dari `.env` dan jalankan `php artisan config:cache` lagi.

## 5. Batas ukuran upload (penting)

Aplikasi menerima PDF IK/HIRARC sampai 10 MB. Bawaan PHP hanya 2 MB, jadi naikkan:

```bash
sudo nano /etc/php/8.4/fpm/php.ini
```
```ini
upload_max_filesize = 12M
post_max_size = 16M
```
```bash
sudo systemctl restart php8.4-fpm
```

Nginx juga dibatasi lewat `client_max_body_size` (sudah ada di konfigurasi di bawah).

## 6. Frontend (Next.js)

```bash
cd /var/www/pulse/frontend
npm ci
NEXT_PUBLIC_API_URL=https://api.namadomain.com/api npm run build
```

Hasilnya ada di folder `frontend/out`. Ulangi perintah build setiap kali kode frontend berubah.

## 7. Nginx

`sudo nano /etc/nginx/sites-available/pulse`

```nginx
# Frontend (file statis)
server {
    listen 80;
    server_name namadomain.com;
    root /var/www/pulse/frontend/out;
    index index.html;

    location / {
        # /signin -> signin.html (hasil static export)
        try_files $uri $uri.html $uri/ =404;
    }

    # Worker penampil PDF (pdf.worker.min.mjs) wajib dikirim sebagai JavaScript.
    # mime.types bawaan nginx belum mengenal .mjs (terkirim sebagai octet-stream),
    # sehingga dokumen IK/HIRARC gagal dibuka di sebagian browser HP.
    location ~* \.mjs$ {
        types { }
        default_type application/javascript;
        try_files $uri =404;
    }

    error_page 404 /404.html;
}

# Backend (Laravel API)
server {
    listen 80;
    server_name api.namadomain.com;
    root /var/www/pulse/backend/public;
    index index.php;

    client_max_body_size 16M;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.4-fpm.sock;
    }

    location ~ /\.(?!well-known) {
        deny all;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/pulse /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

## 8. HTTPS (gratis, Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d namadomain.com -d api.namadomain.com
```

## 9. Backup otomatis

Skrip `deploy/backup.sh` menyimpan database (`pg_dump`) dan semua file upload (`storage/app/public`)
ke `/var/backups/pulse/<tanggal>`, lalu menghapus backup yang lebih tua dari 14 hari.

```bash
sudo cp /var/www/pulse/deploy/backup.sh /usr/local/bin/pulse-backup && sudo chmod +x /usr/local/bin/pulse-backup
sudo pulse-backup                 # coba sekali, pastikan muncul "Backup selesai"
sudo crontab -e                   # tambahkan baris berikut (backup tiap pukul 02.00):
0 2 * * * /usr/local/bin/pulse-backup >> /var/log/pulse-backup.log 2>&1
```

Backup di server yang sama ikut hilang bila server rusak, jadi unduh juga sesekali ke komputer lain:

```powershell
scp -r root@IP_SERVER:/var/backups/pulse D:\backup-pulse\dari-server
```

Memulihkan (hanya bila perlu, data saat ini akan diganti isi backup):

```bash
sudo -u postgres pg_restore --clean --if-exists -d pulse /var/backups/pulse/<tanggal>/database.dump
sudo tar xzf /var/backups/pulse/<tanggal>/uploads.tar.gz -C /var/www/pulse/backend/storage/app
sudo chown -R www-data:www-data /var/www/pulse/backend/storage
```

## 10. Update aplikasi di kemudian hari

Jalankan `sudo pulse-backup` dulu bila update mengubah struktur database (ada migration baru).

```bash
cd /var/www/pulse && git pull
cd backend && composer install --no-dev --optimize-autoloader \
  && php artisan migrate --force && php artisan config:cache && php artisan route:cache
cd ../frontend && npm ci && NEXT_PUBLIC_API_URL=https://api.namadomain.com/api npm run build
```

## 11. Cek setelah deploy

- [ ] `https://namadomain.com` membuka halaman login.
- [ ] Login dengan akun Super Admin berhasil, lalu ganti password.
- [ ] Unggah foto mesin & PDF IK (± 5–10 MB) berhasil dan bisa dibuka, juga dari HP.
- [ ] File worker PDF terkirim sebagai JavaScript:
      `curl -sI https://namadomain.com/_next/static/media/$(ls /var/www/pulse/frontend/out/_next/static/media | grep pdf.worker) | grep -i content-type`
      harus `application/javascript`.
- [ ] `https://api.namadomain.com/api/user` tanpa login menjawab 401 (bukan halaman error berisi detail kode).
- [ ] `sudo pulse-backup` berhasil dan jadwal cron sudah terpasang (`sudo crontab -l`).
