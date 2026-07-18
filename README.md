# NexCommerce

NexCommerce adalah aplikasi **marketplace multi-vendor** berbasis Laravel dan React yang mendukung alur belanja customer, pengelolaan produk dan pesanan vendor, promosi, wallet, penarikan dana, notifikasi, audit log, serta laporan transaksi admin.

## Fitur Utama

### Customer
- Melihat katalog dan detail produk
- Pencarian produk dan toko
- Promo otomatis dengan countdown
- Keranjang belanja multi-vendor
- Checkout dan pembayaran
- Riwayat serta detail pesanan
- Notifikasi transaksi
- Pengelolaan profil dan kata sandi

### Vendor
- Dashboard performa toko
- Tambah, edit, hapus, dan pulihkan produk
- Pengelolaan foto utama produk
- Pengelolaan SKU, harga, stok, dan varian
- Pengelolaan status pesanan
- Wallet vendor dan riwayat transaksi
- Permintaan penarikan dana
- Dukungan akses `vendor_owner` dan `vendor_staff`

### Admin
- Dashboard platform
- Pengelolaan promosi
- Peninjauan penarikan dana vendor
- Audit log aktivitas
- Laporan transaksi
- Ekspor laporan CSV
- Dukungan role `admin` dan `super_admin`

## Teknologi

- Laravel 13
- PHP 8.3
- React
- Inertia.js
- Tailwind CSS
- Vite
- MySQL
- Laravel Queue
- PHPUnit

## Role Pengguna

| Role | Deskripsi |
|---|---|
| `super_admin` | Memiliki akses penuh ke seluruh fitur admin |
| `admin` | Mengelola fitur administratif sesuai izin |
| `vendor_owner` | Pemilik toko dan pengelola utama vendor |
| `vendor_staff` | Staf vendor dengan akses berbasis permission |
| `customer` | Pembeli yang menggunakan katalog dan checkout |

## Persyaratan Lokal

Pastikan perangkat sudah memiliki:

- PHP 8.3 atau lebih baru
- Composer
- Node.js dan npm
- MySQL
- Git

## Instalasi Lokal

Clone repository:

```bash
git clone https://github.com/adessetiaputri123/nexcommerce.git
cd nexcommerce
```

Install dependency PHP:

```bash
composer install
```

Install dependency frontend:

```bash
npm install
```

Salin environment file:

```bash
cp .env.example .env
```

Pada Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Generate application key:

```bash
php artisan key:generate
```

Atur koneksi database pada `.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=nexcommerce
DB_USERNAME=root
DB_PASSWORD=
```

Jalankan migration:

```bash
php artisan migrate
```

Seeder hanya digunakan untuk pengembangan. Pastikan seluruh password akun demo diganti sebelum digunakan di production.

```bash
php artisan db:seed
```

Buat symbolic link penyimpanan:

```bash
php artisan storage:link
```

Build frontend:

```bash
npm run build
```

Jalankan aplikasi:

```bash
php artisan serve
```

Untuk development frontend:

```bash
npm run dev
```

## Queue Worker

NexCommerce menggunakan queue untuk proses yang berjalan di belakang layar.

Jalankan worker:

```bash
php artisan queue:work --sleep=3 --tries=3 --timeout=120
```

## Menjalankan Pengujian

```bash
php artisan test
```

Pada audit integrasi terakhir, seluruh pengujian berhasil dijalankan:

```text
108 tests passed
587 assertions
```

## Perintah Pembersihan Cache

Gunakan perintah berikut setelah melakukan perubahan konfigurasi atau deployment:

```bash
php artisan optimize:clear
```

Untuk production:

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
```

## Deployment Railway

Deployment Railway membutuhkan:

1. Service aplikasi dari repository GitHub
2. Database MySQL Railway
3. Worker service untuk queue
4. Volume atau object storage untuk gambar produk

Environment variable utama:

```env
APP_NAME=NexCommerce
APP_ENV=production
APP_DEBUG=false
APP_KEY=
APP_URL=

LOG_CHANNEL=stderr

DB_CONNECTION=mysql
DB_URL=${{MySQL.MYSQL_URL}}

QUEUE_CONNECTION=database
SESSION_DRIVER=database
CACHE_STORE=database

FILESYSTEM_DISK=public
```

Pre-deploy command:

```bash
php artisan migrate --force && php artisan optimize:clear && php artisan config:cache && php artisan event:cache && php artisan route:cache && php artisan view:cache
```

Worker start command:

```bash
php artisan queue:work --sleep=3 --tries=3 --timeout=120
```

Jangan menyimpan `APP_KEY`, password database, token, atau credential production di GitHub.

## Struktur Halaman Utama

```text
resources/js/
├── Components/
├── Layouts/
├── Pages/
│   ├── Admin/
│   ├── Auth/
│   ├── Cart/
│   ├── Checkout/
│   ├── Notifications/
│   ├── Orders/
│   ├── Products/
│   ├── Profile/
│   ├── Vendor/
│   ├── VendorOrders/
│   └── VendorWallet/
└── app.jsx
```

## Keamanan

- File `.env` tidak boleh di-commit
- `APP_DEBUG` harus `false` di production
- Password akun seeder harus diganti
- Worker tidak memerlukan domain publik
- File upload production harus memakai persistent storage
- Jangan menjalankan seeder demo secara otomatis di production

## Lisensi

Proyek ini dikembangkan untuk kebutuhan pembelajaran dan portofolio. Penggunaan, pengembangan, atau distribusi lebih lanjut dapat disesuaikan dengan kebutuhan pemilik proyek.
