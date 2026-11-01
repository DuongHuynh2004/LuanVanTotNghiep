# LUMIQ Store

LUMIQ là website bán hàng thời trang bằng tiếng Việt. Giao diện được xây dựng
bằng React, Vite và React Router; backend dùng Laravel, PHP và MySQL. Website
bao gồm trang cửa hàng, tài khoản khách hàng, thanh toán COD và khu vực quản trị.

## Yêu cầu

- Windows với WampServer (hoặc môi trường tương đương), MySQL và phpMyAdmin.
- PHP 8.3 trở lên và Composer.
- Node.js và npm.
- Database MySQL `lumiq` cùng schema cửa hàng đã được cung cấp.
- Kết nối Internet để tải font, ảnh Unsplash và các dịch vụ bản đồ bên ngoài.

## Cài đặt lần đầu

### 1. Cấu hình Laravel

Mở PowerShell tại thư mục dự án:

```powershell
cd D:\lumiqstore\lumiqstore\backend
composer install
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
php artisan key:generate
```

Chỉ chạy `key:generate` khi cài mới. Nếu đã có `backend/.env`, giữ nguyên
`APP_KEY`; không tạo khóa mới trên cửa hàng đang hoạt động.

Mở `backend/.env`, điền thông tin MySQL của máy. Ví dụ cấu hình mặc định cho
WampServer cục bộ:

```dotenv
APP_URL=http://127.0.0.1:8000
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=lumiq
DB_USERNAME=root
DB_PASSWORD=
```

Đảm bảo MySQL đang chạy và database `lumiq` đã có schema cửa hàng. Không chạy
`php artisan migrate`, `migrate:fresh`, `db:wipe` hoặc seed dữ liệu mẫu: dự án
dùng schema MySQL có sẵn, không dùng migration Laravel để tạo/cập nhật dữ liệu.

Nếu database chưa có các bảng đơn hàng, thanh toán và khuyến mãi, hãy chọn đúng
database `lumiq` trong phpMyAdmin, sau đó nhập
[`backend/database/create_orders.sql`](backend/database/create_orders.sql).
File này tạo các bảng thương mại còn thiếu nhưng **không nâng cấp cột của bảng
đã tồn tại**. Sao lưu database trước khi thay đổi schema và không nhập lại file
dump đầy đủ nếu mục đích chỉ là cập nhật ứng dụng.

Tạo liên kết ảnh upload và xóa cache cấu hình:

```powershell
php artisan storage:link
php artisan config:clear
```

### 2. Cài đặt frontend

Mở cửa sổ PowerShell khác:

```powershell
cd D:\lumiqstore\lumiqstore\frontend
npm ci
```

## Chạy ứng dụng khi phát triển

Chạy Laravel tại `backend`:

```powershell
cd D:\lumiqstore\lumiqstore\backend
php artisan serve --host=127.0.0.1 --port=8000
```

Chạy Vite tại `frontend` ở một cửa sổ khác:

```powershell
cd D:\lumiqstore\lumiqstore\frontend
npm run dev
```

Mở <http://127.0.0.1:5173>. Vite proxy các đường dẫn `/api` và `/storage` tới
Laravel trên cổng 8000 để session và CSRF hoạt động cùng origin.

## Chạy bản build qua Laravel hoặc WampServer

Từ thư mục `frontend`, tạo và publish bản build:

```powershell
npm run build
```

Lệnh này build React vào `frontend/dist` rồi chép ứng dụng vào
`backend/public/app`. Laravel phục vụ bản này tại <http://127.0.0.1:8000> khi
chạy `php artisan serve`, hoặc qua VirtualHost Apache.

Để chạy bằng Apache của WampServer:

1. Tạo VirtualHost trỏ DocumentRoot tới
   `D:/lumiqstore/lumiqstore/backend/public`.
2. Bật `rewrite_module` và cho phép `.htaccess` bằng `AllowOverride All`.
3. Đặt `APP_URL` trong `backend/.env` đúng URL VirtualHost rồi chạy
   `php artisan config:clear`.
4. Khởi động lại Apache và mở URL VirtualHost.

Không trỏ DocumentRoot vào thư mục gốc dự án hoặc `backend`; các thư mục này có
file cấu hình và mã nguồn không dành để public trực tiếp.

## Tạo tài khoản quản trị

Đăng ký tài khoản tại `/dang-ky`, xác minh email nếu được yêu cầu, rồi cấp quyền
admin cho email đó:

```powershell
cd D:\lumiqstore\lumiqstore\backend
php artisan lumiq:admin ten@email.com
```

Đăng xuất, đăng nhập lại và mở `/admin`. Không có tài khoản hoặc mật khẩu admin
mặc định. Endpoint đăng ký công khai chỉ tạo tài khoản khách hàng.

## Cấu hình email xác minh

Đăng ký và đặt lại mật khẩu sử dụng mã OTP qua email. Cấu hình SMTP trong
`backend/.env` theo các biến `MAIL_*` ở `.env.example`. Với Gmail, cần bật xác
minh 2 bước và tạo App Password; điền App Password vào `MAIL_PASSWORD`, không
đưa mật khẩu vào mã nguồn hoặc chat.

Sau khi cập nhật cấu hình:

```powershell
cd D:\lumiqstore\lumiqstore\backend
php artisan config:clear
```

Tài khoản mới cần xác minh trước khi đăng nhập. Tài khoản cũ chưa có
`email_verified_at` cũng cần xác minh qua `/xac-minh-email`.

## Giao hàng và bản đồ

Trang thanh toán yêu cầu khách nhập địa chỉ, tìm hoặc ghim vị trí trên bản đồ,
rồi xác nhận tuyến đường. Cửa hàng ở **801/2 Phạm Thế Hiển, Phường Chánh Hưng,
Thành phố Hồ Chí Minh**. Phạm vi cấu hình hiện tại là tối đa **40 km theo tuyến
đường ô tô** quanh kho; phí mặc định là **5.000đ/km**, làm tròn lên từng km.
Đây là giới hạn phục vụ nội thành hiện tại, không giao hàng toàn quốc. Giới hạn
40 km được tính quanh kho và không thay thế kiểm tra chính xác đường biên hành
chính TP. Hồ Chí Minh; khách cần xác nhận vị trí giao hàng trên bản đồ.

Các thiết lập nằm trong `backend/config/services.php` và có thể ghi đè trong
`backend/.env`:

```dotenv
STORE_ORIGIN_ADDRESS="801/2 Phạm Thế Hiển, Phường Chánh Hưng, Thành phố Hồ Chí Minh, Việt Nam"
DELIVERY_MAX_DISTANCE_KM=40
OSRM_ROUTING_URL=https://router.project-osrm.org/route/v1/driving
SHIPPING_RATE_PER_KM=5000
```

Không cần API key. Bản đồ dùng MapLibre GL JS và dữ liệu OpenFreeMap; tìm địa
chỉ dùng Photon; tính tuyến đường dùng OSRM. Các dịch vụ công cộng có thể giới
hạn lưu lượng hoặc gián đoạn, và cần Internet. Nếu dịch vụ định tuyến không
hoạt động, checkout báo lỗi và không tạo đơn với phí ước tính. Khách cũng có
thể chọn vị trí trực tiếp trên bản đồ nếu tìm địa chỉ không ra kết quả.

## Chức năng chính

- Trang chủ, bộ sưu tập, tìm kiếm/lọc sản phẩm, chi tiết sản phẩm, giỏ hàng và
  thanh toán COD.
- Trang Giới thiệu, Liên hệ và Chính sách bảo mật.
- Đăng ký, đăng nhập, OTP email, hồ sơ cá nhân, đổi mật khẩu và lịch sử đơn.
- Quản trị sản phẩm, biến thể/size/màu/SKU/tồn kho, ảnh, danh mục và khách hàng.
- Quản lý đơn hàng, thanh toán, phiếu nội bộ và mã khuyến mãi.
- Dashboard tồn kho và doanh thu theo khoảng thời gian.

Các phiếu trong hệ thống là chứng từ nội bộ, **không phải hóa đơn VAT**. Trạng
thái thanh toán và trạng thái xử lý đơn được quản lý riêng. Đơn hoàn tất tạo
phiếu cuối; khi đặt đơn, hệ thống tạo biên nhận đặt hàng.

## Kiểm thử và định dạng

Backend:

```powershell
cd D:\lumiqstore\lumiqstore\backend
php artisan test
```

Các test backend dùng database MySQL được cấu hình trong `backend/.env`. Chỉ
chạy trên database phát triển/test, không chạy trực tiếp trên production vì
một số test có thể ghi dữ liệu thử nghiệm trong transaction.

Frontend:

```powershell
cd D:\lumiqstore\lumiqstore\frontend
npm test
npx prettier --check src vite.config.js
npm run build
```

`npm run build` cũng publish bản frontend vào `backend/public/app`.

## Cấu trúc dự án

```text
frontend/
  src/
    components/       Thành phần dùng chung và bản đồ giao hàng
    pages/            Trang cửa hàng, tài khoản và thanh toán
    pages/admin/      Các trang quản trị
    App.jsx           Router và trạng thái đăng nhập/giỏ hàng
    api.js            Gọi API, CSRF và định dạng tiền
    styles.css        Giao diện và responsive
backend/
  app/                Controller, model, middleware và service
  config/             Cấu hình Laravel, gồm dịch vụ giao hàng
  database/           SQL tạo các bảng thương mại
  routes/web.php      API và fallback phục vụ React
  tests/              Kiểm thử PHP
  public/app/         Bản React đã build và publish
```

Ảnh sản phẩm upload được lưu trong `backend/storage/app/public/products`; URL
`/storage/...` cần symbolic link/junction do `php artisan storage:link` tạo.
Không đưa `backend/.env`, khóa SMTP hoặc thông tin nhạy cảm vào repository.
