#!/bin/bash
# Backup harian Pulse: database PostgreSQL + file upload (foto mesin, gambar peta part, PDF IK/HIRARC).
# Jalankan sebagai root lewat cron (lihat docs/DEPLOY.md bagian "Backup otomatis").
set -euo pipefail

DB_NAME="${PULSE_DB_NAME:-pulse}"
APP_DIR="${PULSE_APP_DIR:-/var/www/pulse}"
BACKUP_ROOT="${PULSE_BACKUP_DIR:-/var/backups/pulse}"
KEEP_DAYS="${PULSE_BACKUP_KEEP_DAYS:-14}"

DEST="$BACKUP_ROOT/$(date +%F_%H%M)"
mkdir -p "$DEST"

# Format custom (-Fc): ringkas dan dipulihkan dengan pg_restore. Aman dijalankan saat aplikasi berjalan.
if [ "$(id -u)" -eq 0 ] && [ -z "${PGUSER:-}" ]; then
    runuser -u postgres -- pg_dump -Fc "$DB_NAME" > "$DEST/database.dump"
else
    pg_dump -Fc "$DB_NAME" > "$DEST/database.dump"
fi

# Isi storage/app/public = semua file yang diunggah lewat aplikasi
tar czf "$DEST/uploads.tar.gz" -C "$APP_DIR/backend/storage/app" public

# Hapus backup yang lebih tua dari KEEP_DAYS hari
find "$BACKUP_ROOT" -mindepth 1 -maxdepth 1 -type d -mtime +"$KEEP_DAYS" -exec rm -rf {} +

echo "Backup selesai: $DEST ($(du -sh "$DEST" | cut -f1))"
