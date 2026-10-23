# Panduan Deploy ke VPS (Ubuntu 26.04 LTS)

Susunan yang dipakai:

| Bagian | Alamat | Isi |
|---|---|---|
| Frontend (Next.js, static export) | `https://namadomain.com` | file statis hasil `npm run build` (folder `frontend/out`) |
| Backend (Laravel API) | `https://api.namadomain.com` | `backend/public` lewat PHP-FPM |

Ganti `namadomain.com` dengan domain yang dibeli. Buat dua record DNS **A** (`@` dan `api`) yang mengarah ke IP VPS.

> Jangan pernah mengirim password VPS / database ke siapa pun (termasuk lewat chat). Simpan sendiri.

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

## 9. Update aplikasi di kemudian hari

```bash
cd /var/www/pulse && git pull
cd backend && composer install --no-dev --optimize-autoloader \
  && php artisan migrate --force && php artisan config:cache && php artisan route:cache
cd ../frontend && npm ci && NEXT_PUBLIC_API_URL=https://api.namadomain.com/api npm run build
```

## 10. Cek setelah deploy

- [ ] `https://namadomain.com` membuka halaman login.
- [ ] Login dengan akun Super Admin berhasil, lalu ganti password.
- [ ] Unggah foto mesin & PDF IK (± 5–10 MB) berhasil dan bisa dibuka.
- [ ] `https://api.namadomain.com/api/user` tanpa login menjawab 401 (bukan halaman error berisi detail kode).
- [ ] Backup database terjadwal, mis. `pg_dump pulse > backup-$(date +%F).sql` setiap hari.
