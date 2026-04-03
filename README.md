# Asset Management System

Hệ thống Quản lý Tài sản Doanh nghiệp

## 📋 Tổng quan

**Asset Management System** là hệ thống quản lý tài sản doanh nghiệp toàn diện, được xây dựng bằng ReactJS (Frontend) và NodeJS/Express (Backend) với cơ sở dữ liệu MySQL.

Hệ thống cho phép theo dõi, quản lý và bảo trì tài sản của doanh nghiệp một cách hiệu quả.

## 🚀 Tính năng chính

### 1. Quản lý tài sản (Assets)
- Thêm, sửa, xóa tài sản
- Phân loại tài sản theo danh mục
- Theo dõi vị trí tài sản
- Gán tài sản cho bộ phận/người dùng
- Theo dõi tình trạng tài sản (chờ cấp, đang sử dụng, cần sửa chữa và hỏng, đã thanh lý)
- Hỗ trợ mã vạch/QR code
- Hỗ trợ mã vạch/QR code (Xem và in tem nhãn QR đơn lẻ hoặc hàng loạt)
- Tìm kiếm và lọc tài sản nâng cao
- Import/Export dữ liệu quản lý bằng Excel
- Trang tra cứu tài sản Public (Quét QR không cần đăng nhập để báo hỏng)

### 2. Quản lý danh mục (Categories)
- Thêm, sửa, xóa danh mục tài sản
- Phân cấp danh mục (danh mục cha - con)
- Tỷ lệ khấu hao theo danh mục

### 3. Quản lý vị trí (Locations)
- Thêm, sửa, xóa vị trí lưu trữ
- Quản lý kho/văn phòng/chi nhánh
- Phân cấp vị trí

### 4. Quản lý nhà cung cấp (Suppliers)
- Thông tin nhà cung cấp đầy đủ
- Liên hệ và địa chỉ

### 5. Quản lý bộ phận (Departments)
- Thêm, sửa, xóa bộ phận
- Phân cấp bộ phận
- Gán quản lý bộ phận

### 6. Bảo trì tài sản (Maintenance)
- Lịch bảo trì định kỳ
- Phiếu bảo trì/sửa chữa
- Theo dõi chi phí bảo trì
- Lên lịch bảo trì tiếp theo
- Đánh dấu và dán nhãn trực quan các phiếu bảo trì đã hoàn tất (Ngăn thao tác trùng lặp)

### 7. Kiểm kê tài sản (Inventory)
- Tạo phiên kiểm kê
- Tạo phiên kiểm kê (Toàn bộ hệ thống hoặc theo từng phòng ban)
- Danh sách tài sản cần kiểm kê
- Ghi nhận kết quả (Có/Mất/Hỏng)
- Ghi nhận kết quả (Chờ kiểm/Tìm thấy/Sai vị trí/Thiếu/Hỏng/Thừa) bằng tay hoặc **Quét mã QR trực tiếp**
- Đề xuất sửa chữa/thanh lý trực tiếp tài sản hỏng ngay trong phiên kiểm kê
- Báo cáo chênh lệch sau kiểm kê
- Báo cáo tổng hợp số liệu theo phòng ban
- Lịch sử kiểm kê

### 8. Báo cáo & Thống kê (Dashboard)
- Tổng số tài sản
- Tổng giá trị tài sản
- Thống kê theo trạng thái
- Thống kê theo danh mục, bộ phận, vị trí
- Cảnh báo danh sách tài sản sắp đến hạn bảo trì

### 9. Quản lý người dùng (Users) & Phân quyền (RBAC)
- Đăng nhập/Đăng xuất an toàn
- Phân quyền (Admin/User)
- Phân quyền động (Role-Based Access Control) cho phép gán quyền chi tiết đến từng thao tác
- Giao diện Quản lý vai trò (Roles) và Quyền hạn (Permissions)
- Quản lý người dùng (chỉ Admin)
- Admin có thể chủ động đặt lại mật khẩu cho người dùng bất kỳ
- Xuất danh sách người dùng ra Excel

### 10. Hệ thống thông báo (Notifications)
- Chuông thông báo trực tuyến trên giao diện (Navbar)
- Thông báo tự động khi có tài sản mới được thêm hoặc cập nhật thông tin
- Thông báo tự động (Cảnh báo đỏ) khi có thiết bị được báo hỏng từ trang quét QR Public
- Cron Job chạy ngầm hàng ngày: Tự động rà quét và gửi cảnh báo các tài sản sắp đến hạn bảo trì (trong 7 ngày tới)
- Phân loại thông báo (Info, Success, Warning, Maintenance)
- Hiệu ứng rung chuông (Animation) mượt mà, trực quan ngay khi có thông báo mới theo thời gian thực
- Trải nghiệm người dùng (UX) tối ưu: Tự động đóng hộp thoại khi click ra ngoài vùng thông báo

## 🛠️ Công nghệ

### Frontend
- **ReactJS 18** - Thư viện UI
- **Vite** - Công cụ build
- **React Router DOM 6** - Quản lý routing
- **Axios** - HTTP client
- **CSS** - Styling

### Backend
- **NodeJS** - Runtime JavaScript
- **Express** - Web framework
- **MySQL** - Cơ sở dữ liệu
- **JWT** - Xác thực người dùng
- **Bcryptjs** - Mã hóa mật khẩu

## 📁 Cấu trúc dự án

```
asset-management/
├── backend/                    # Backend API
│   ├── src/
│   │   ├── config/            # Cấu hình database
│   │   ├── controllers/       # Xử lý logic
│   │   ├── middleware/       # Middleware (auth)
│   │   ├── models/           # Models database
│   │   ├── routes/           # API routes
│   │   └── app.js            # Entry point
│   ├── package.json
│   └── .env
│
├── frontend/                   # Frontend React
│   ├── src/
│   │   ├── api/              # API client
│   │   ├── components/        # Components
│   │   ├── contexts/         # React Context
│   │   ├── layouts/          # Layouts
│   │   ├── pages/            # Pages
│   │   ├── App.jsx           # Main app
│   │   └── main.jsx          # Entry point
│   ├── package.json
│   └── vite.config.js
│
├── ASSET_MANAGEMENT_PLAN.md   # Kế hoạch phát triển
└── README.md                  # Tài liệu này
```

## ⚡ Cài đặt

### Yêu cầu hệ thống
- Node.js 16+
- MySQL 8.0+
- npm hoặc yarn

### 1. Cài đặt Backend

```
bash
cd backend

# Cài đặt dependencies
npm install

# Tạo file .env
# Cần cấu hình các biến môi trường sau:
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=your_password
# DB_NAME=asset_management
# PORT=3001
# JWT_SECRET=your_secret_key

# Khởi động server
npm run dev
```

### 2. Cài đặt Frontend

```
bash
cd frontend

# Cài đặt dependencies
npm install

# Khởi động development server
npm run dev
```

### 3. Truy cập ứng dụng

http://localhost:5173 hoặc http://192.168.89.118:5173
- **Backend API**: http://localhost:3001/api

### 4. Tài khoản mặc định

```
Username: admin
Password: admin123
```

## 📡 API Documentation

Các API endpoint được bảo vệ bằng JWT, yêu cầu `Authorization: Bearer <token>` trong header cho mỗi request (trừ các API public).

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Đăng nhập. Body: `{ "username": "...", "password": "..." }` |
| `POST` | `/api/auth/register` | Đăng ký người dùng mới (chỉ admin). |
| `GET` | `/api/auth/profile` | Lấy thông tin người dùng đang đăng nhập. |
| `POST` | `/api/auth/change-password` | Đổi mật khẩu. Body: `{ "currentPassword": "...", "newPassword": "..." }` |

### Assets

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/assets` | Lấy danh sách tài sản (hỗ trợ phân trang, tìm kiếm, lọc). |
| `GET` | `/api/assets/all` | Lấy danh sách rút gọn tất cả tài sản (cho dropdown). |
| `GET` | `/api/assets/:id` | Lấy chi tiết một tài sản (*current_value computed dynamically*). |
| `GET` | `/api/assets/code/:code` | Lấy chi tiết tài sản theo mã tài sản (asset_code). |
| `GET` | `/api/assets/barcode/:barcode` | Lấy chi tiết tài sản theo mã vạch. |
| `POST` | `/api/assets` | Tạo tài sản mới. |
| `PUT` | `/api/assets/:id` | Cập nhật thông tin tài sản. |
| `PUT` | `/api/assets/:id/status` | Cập nhật trạng thái nhanh cho tài sản (hỗ trợ tự động tạo bảo trì). |
| `DELETE` | `/api/assets/:id` | Xóa tài sản. |
| `GET` | `/api/assets/export` | Xuất danh sách tài sản ra file Excel. |
| `GET` | `/api/assets/template` | Tải file Excel mẫu để import tài sản. |
| `POST` | `/api/assets/import` | Nhập tài sản từ file Excel. |
| `GET` | `/api/assets/:id/qrcode` | Tạo mã QR cho tài sản. |
| `POST` | `/api/assets/public/:id/report-damage` | API Public để người dùng báo hỏng tài sản qua QR code. |

**Query Parameters cho `GET /api/assets`:**
- `page`: Số trang (mặc định: 1)
- `limit`: Số lượng trên mỗi trang (mặc định: 10)
- `search`: Từ khóa tìm kiếm (tên, mã tài sản)
- `status`: Lọc theo trạng thái
- `categoryId`: Lọc theo danh mục
- `departmentId`: Lọc theo bộ phận
- `locationId`: Lọc theo vị trí

### Categories, Locations, Departments, Suppliers
Các API cho các tài nguyên này có cấu trúc tương tự nhau.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/{resource}` | Lấy danh sách (hỗ trợ phân trang). |
| `GET` | `/api/{resource}/all` hoặc `/api/{resource}/simple` | Lấy danh sách rút gọn (cho dropdown). |
| `POST` | `/api/{resource}` | Tạo mới. |
| `PUT` | `/api/{resource}/:id` | Cập nhật. |
| `DELETE` | `/api/{resource}/:id` | Xóa. |

*(Thay `{resource}` bằng `categories`, `locations`, `departments`, `suppliers`)*

### Maintenance

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/maintenance` | Lấy danh sách các phiếu bảo trì. |
| `GET` | `/api/maintenance/upcoming` | Lấy danh sách tài sản sắp đến hạn bảo trì. |
| `GET` | `/api/maintenance/costs` | Lấy thống kê chi phí bảo trì. |
| `POST` | `/api/maintenance` | Tạo phiếu bảo trì mới. |
| `POST` | `/api/maintenance/complete-repair` | Hoàn thành một phiếu sửa chữa. |
| `PUT` | `/api/maintenance/:id` | Cập nhật phiếu bảo trì. |
| `DELETE` | `/api/maintenance/:id` | Xóa phiếu bảo trì. |

### Inventory (Kiểm kê)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/inventory` | Lấy danh sách các phiên kiểm kê. |
| `POST` | `/api/inventory` | Tạo phiên kiểm kê mới. |
| `POST` | `/api/inventory/:id/complete` | Hoàn thành một phiên kiểm kê. |
| `GET` | `/api/inventory/:id/summary` | Lấy báo cáo tổng quan của phiên kiểm kê. |
| `GET` | `/api/inventory/:id/summary-by-department` | Lấy báo cáo tổng quan kiểm kê phân theo phòng ban. |
| `POST` | `/api/inventory/:id/add-assets` | Thêm danh sách tài sản chỉ định vào phiên kiểm kê. |
| `POST` | `/api/inventory/:id/add-assets-by-department` | Thêm tất cả tài sản của một phòng ban vào phiên. |
| `POST` | `/api/inventory/:id/add-all-assets` | Thêm toàn bộ tài sản trong hệ thống vào phiên kiểm kê. |
| `GET` | `/api/inventory/:id/records-with-department` | Lấy danh sách bản ghi kiểm kê kèm thông tin phòng ban. |
| `GET` | `/api/inventory/:sessionId/records` | Lấy danh sách tài sản trong một phiên. |
| `POST` | `/api/inventory/:sessionId/scan` | Ghi nhận kết quả quét mã QR. |
| `PUT` | `/api/inventory/:sessionId/records/:recordId` | Cập nhật thủ công một bản ghi kiểm kê. |

### Users

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/users` | Lấy danh sách người dùng (chỉ admin). |
| `GET` | `/api/users/export` | Xuất danh sách người dùng ra file Excel. |
| `POST` | `/api/users` | Tạo người dùng mới (chỉ admin). |
| `PUT` | `/api/users/:id` | Cập nhật người dùng (chỉ admin). |
| `DELETE` | `/api/users/:id` | Xóa người dùng (chỉ admin). |

### Roles & Permissions (Phân quyền)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/roles` | Lấy danh sách tất cả vai trò. |
| `POST` | `/api/roles` | Tạo vai trò mới. |
| `GET` | `/api/permissions` | Lấy danh sách tất cả quyền. |
| `POST` | `/api/permissions` | Tạo quyền mới. |
| `GET` | `/api/roles/:roleCode/permissions` | Lấy danh sách quyền của một vai trò. |
| `POST` | `/api/roles/:roleCode/permissions` | Cập nhật danh sách quyền cho một vai trò. |

### Dashboard

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard` | Lấy các thống kê tổng quan cho dashboard. |

### Notifications (Thông báo)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/notifications` | Lấy danh sách thông báo của người dùng hiện tại. |
| `PUT` | `/api/notifications/:id/read` | Đánh dấu một thông báo là đã đọc. |
| `PUT` | `/api/notifications/read-all` | Đánh dấu tất cả thông báo là đã đọc. |

## 🔧 Phân trang

Một số API hỗ trợ phân trang với tham số:

```
GET /api/assets?page=1&limit=10
GET /api/categories?page=1&limit=10
GET /api/locations?page=1&limit=10
GET /api/departments?page=1&limit=10
```

Response:
```
json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

## 🔐 Xác thực

Tất cả API (trừ auth) yêu cầu token JWT trong header:

```
Authorization: Bearer <token>
```

Token được lưu trữ trong localStorage và tự động thêm vào mọi request.

## 📊 Cấu trúc Database

Dưới đây là cấu trúc chi tiết của các bảng chính trong cơ sở dữ liệu `asset_management`.

### Bảng `assets`
Lưu trữ thông tin chi tiết về từng tài sản.

| Trường | Loại | Mô tả |
|---|---|---|
| `id` | INT | Khóa chính, tự tăng |
| `asset_code` | VARCHAR(50) | Mã tài sản (duy nhất) |
| `name` | VARCHAR(255) | Tên tài sản |
| `description` | TEXT | Mô tả chi tiết |
| `category_id` | INT | Khóa ngoại, liên kết đến `categories(id)` |
| `location_id` | INT | Khóa ngoại, liên kết đến `locations(id)` |
| `department_id` | INT | Khóa ngoại, liên kết đến `departments(id)` |
| `supplier_id` | INT | Khóa ngoại, liên kết đến `suppliers(id)` |
| `purchase_date` | DATE | Ngày mua |
| `purchase_price` | DECIMAL | Giá mua |
| `current_value` | DECIMAL | Giá trị hiện tại (*computed on-the-fly via controller.calculateCurrentValue(), categories.depreciation_rate*) |
| `salvage_value` | DECIMAL | Giá trị thu hồi/thanh lý ước tính (mặc định là 0) |
| `status` | VARCHAR(50) | Trạng thái ('chờ cấp', 'đang sử dụng', 'cần sửa chữa và hỏng', 'đã thanh lý') |
| `barcode` | VARCHAR(100) | Mã vạch (duy nhất) |
| `image_url` | VARCHAR(255) | URL hình ảnh |
| `assigned_to` | INT | Khóa ngoại, liên kết đến `users(id)` |
| `assigned_to_name` | VARCHAR(255) | Tên người sử dụng (khi import) |

### Bảng `users`
Quản lý thông tin người dùng và phân quyền.

| Trường | Loại | Mô tả |
|---|---|---|
| `id` | INT | Khóa chính, tự tăng |
| `username` | VARCHAR(50) | Tên đăng nhập (duy nhất) |
| `password` | VARCHAR(255) | Mật khẩu (đã mã hóa) |
| `fullName` | VARCHAR(100) | Họ và tên |
| `role` | VARCHAR(50) | Mã vai trò (khóa ngoại, liên kết đến `roles(code)`) |
| `department_id` | INT | Khóa ngoại, liên kết đến `departments(id)` |
| `isActive` | BOOLEAN | Trạng thái hoạt động |

### Bảng `categories`
Phân loại tài sản.

| Trường | Loại | Mô tả |
|---|---|---|
| `id` | INT | Khóa chính, tự tăng |
| `name` | VARCHAR(255) | Tên danh mục |
| `code` | VARCHAR(50) | Mã danh mục |
| `description` | TEXT | Mô tả |
| `depreciation_rate` | DECIMAL(5,2) | **Tỷ lệ khấu hao hàng năm (%)** - Used by `calculateCurrentValue()` for assets straight-line monthly depreciation |

### Bảng `locations`
Quản lý các vị trí (phòng ban, kho, chi nhánh).

| Trường | Loại | Mô tả |
|---|---|---|
| `id` | INT | Khóa chính, tự tăng |
| `name` | VARCHAR(255) | Tên vị trí |
| `code` | VARCHAR(50) | Mã vị trí |
| `address` | VARCHAR(255) | Địa chỉ |

### Bảng `departments`
Quản lý các phòng ban trong công ty.

| Trường | Loại | Mô tả |
|---|---|---|
| `id` | INT | Khóa chính, tự tăng |
| `name` | VARCHAR(255) | Tên phòng ban |
| `code` | VARCHAR(50) | Mã phòng ban |

### Bảng `suppliers`
Quản lý thông tin nhà cung cấp.

| Trường | Loại | Mô tả |
|---|---|---|
| `id` | INT | Khóa chính, tự tăng |
| `name` | VARCHAR(255) | Tên nhà cung cấp |
| `code` | VARCHAR(50) | Mã nhà cung cấp |
| `contact_person` | VARCHAR(100) | Người liên hệ |
| `phone` | VARCHAR(20) | Số điện thoại |
| `address` | TEXT | Địa chỉ |

### Bảng `maintenance_records`
Lưu trữ lịch sử bảo trì, sửa chữa tài sản.

| Trường | Loại | Mô tả |
|---|---|---|
| `id` | INT | Khóa chính, tự tăng |
| `asset_id` | INT | Khóa ngoại, liên kết đến `assets(id)` |
| `maintenance_type` | ENUM | Loại bảo trì ('emergency', 'scheduled', 'repair') |
| `description` | TEXT | Mô tả công việc |
| `maintenance_date` | DATE | Ngày bảo trì/báo hỏng |
| `completion_date` | DATE | Ngày hoàn thành (tùy chọn) |
| `cost` | DECIMAL | Chi phí |
| `technician` | VARCHAR(100) | Kỹ thuật viên/Đơn vị thực hiện |
| `status` | VARCHAR(50) | Trạng thái ('pending', 'in_progress', 'completed') |

### Bảng `inventory_sessions`
Quản lý các phiên kiểm kê tài sản.

| Trường | Loại | Mô tả |
|---|---|---|
| `id` | INT | Khóa chính, tự tăng |
| `name` | VARCHAR(255) | Tên phiên kiểm kê |
| `start_date` | DATE | Ngày bắt đầu |
| `end_date` | DATE | Ngày kết thúc |
| `status` | ENUM | Trạng thái ('pending', 'in_progress', 'completed') |
| `created_by` | INT | Khóa ngoại, liên kết đến `users(id)` |

### Bảng `inventory_records`
Ghi nhận kết quả chi tiết của một phiên kiểm kê.

| Trường | Loại | Mô tả |
|---|---|---|
| `id` | INT | Khóa chính, tự tăng |
| `session_id` | INT | Khóa ngoại, liên kết đến `inventory_sessions(id)` |
| `asset_id` | INT | Khóa ngoại, liên kết đến `assets(id)` |
| `expected_status` | VARCHAR(50) | Trạng thái dự kiến |
| `status` | VARCHAR(30) | Trạng thái ghi nhận kiểm kê ('pending_check', 'checked') |
| `actual_status` | VARCHAR(50) | Trạng thái thực tế ('found', 'missing', 'damaged', 'extra') |
| `actual_quantity` | INT | Số lượng thực tế kiểm kê được |
| `notes` | TEXT | Ghi chú |
| `checked_at` | DATETIME | Thời điểm kiểm kê |
| `checked_by` | INT | Khóa ngoại, liên kết đến `users(id)` |

### Bảng `roles`
Quản lý các vai trò trong hệ thống.

| Trường | Loại | Mô tả |
|---|---|---|
| `code` | VARCHAR(50) | Khóa chính, mã vai trò (VD: 'admin', 'manager', 'user') |
| `name` | VARCHAR(255) | Tên vai trò (VD: 'Quản trị viên') |
| `description` | TEXT | Mô tả chi tiết |

### Bảng `permissions`
Quản lý các quyền hạn chi tiết trong hệ thống.

| Trường | Loại | Mô tả |
|---|---|---|
| `code` | VARCHAR(50) | Khóa chính, mã quyền (VD: 'CREATE_USER', 'DELETE_ASSET') |
| `name` | VARCHAR(255) | Tên quyền (VD: 'Tạo người dùng') |
| `module` | VARCHAR(100) | Nhóm chức năng (VD: 'Quản lý người dùng') |

### Bảng `role_permissions`
Bảng trung gian để gán quyền cho vai trò.

| Trường | Loại | Mô tả |
|---|---|---|
| `role_code` | VARCHAR(50) | Khóa ngoại, liên kết đến `roles(code)` |
| `permission_code` | VARCHAR(50) | Khóa ngoại, liên kết đến `permissions(code)` |

### Bảng `notifications`
Lưu trữ các thông báo trong hệ thống.

| Trường | Loại | Mô tả |
|---|---|---|
| `id` | INT | Khóa chính, tự tăng |
| `user_id` | INT | Khóa ngoại (NULL = thông báo chung toàn hệ thống), liên kết đến `users(id)` |
| `title` | VARCHAR(255) | Tiêu đề thông báo |
| `message` | TEXT | Nội dung chi tiết thông báo |
| `type` | VARCHAR(50) | Loại thông báo ('info', 'success', 'warning', 'maintenance') |
| `is_read` | BOOLEAN | Trạng thái đã đọc (TRUE/FALSE) |
| `created_at` | TIMESTAMP | Thời gian tạo thông báo |

## 🎨 Giao diện

### Trang chủ (Dashboard)
- Hiển thị tổng số tài sản
- Hiển thị tổng giá trị tài sản
- Biểu đồ thống kê theo trạng thái
- Thống kê nhanh

### Quản lý tài sản
- Bảng danh sách với phân trang
- Thanh tìm kiếm và bộ lọc
- Thao tác Sửa/Xóa
- Nút thêm tài sản mới

### Thêm/Sửa tài sản
- Form nhập liệu đầy đủ
- Dropdown chọn danh mục, vị trí, bộ phận, nhà cung cấp
- Chọn ngày mua, giá mua, giá trị hiện tại
- Chọn trạng thái tài sản
- Nhập mã vạch, URL hình ảnh
- Nút đề xuất mua mới (nếu tài sản ở trạng thái Đã thanh lý)

### Trang tra cứu Public (Scan QR)
- Giao diện tối ưu cho Mobile (Mobile-first)
- Tích hợp Camera quét mã QR trực tiếp qua thư viện `html5-qrcode`
- Người dùng vãng lai (chưa đăng nhập) có thể tra cứu nhanh thông tin và báo hỏng thiết bị mà không bị chặn bởi tường lửa xác thực (Auth)
- Nhân viên đã đăng nhập có thể cập nhật mọi trạng thái tài sản

### Quản lý Kiểm kê (Inventory)
- Theo dõi tiến độ phiên kiểm kê
- Thêm tài sản hàng loạt, thêm theo phòng ban
- Thống kê màu sắc rõ ràng (Chờ, Tìm thấy, Thiếu, Hỏng, Thừa)
- Cửa sổ (Modal) xử lý: Tạo phiếu bảo trì cho tài sản hỏng hoặc đưa vào danh sách chờ thanh lý.

### Quản lý Phân quyền (RBAC)
- Dropdown chọn vai trò (Role) để xem cấu hình
- Giao diện danh sách quyền (Permissions) được nhóm trực quan theo chức năng (Module)
- Checkbox bật/tắt quyền hạn theo thời gian thực

### Chuông thông báo (Notification Bell)
- Tích hợp ngay trên thanh Header (MainLayout)
- Hiển thị số lượng thông báo chưa đọc dạng Badge đỏ nổi bật
- Tự động cập nhật dữ liệu (Polling) định kỳ mà không cần tải lại trang

### Xử lý lỗi Encoding (Database)
- Hệ thống cung cấp sẵn script `backend/src/config/fix_encoding.sql` để tự động khắc phục triệt để lỗi font tiếng Việt (chuyển đổi charset từ `latin1` sang `utf8mb4`) nếu dữ liệu cũ import vào gặp lỗi hiển thị.

## 🚀 Cron Jobs & Triển khai Production (Vercel Native Cron)

### ✅ Vercel Cron Jobs (Mới - Serverless ready)
- **Tính năng**: Tự động rà quét tài sản sắp đến hạn bảo trì mỗi ngày 8h sáng.
- **Endpoint**: `/api/cron/maintenance-check` (no auth, system-only).
- **Logic**: Query `maintenance_records`, tạo notifications cho admin.
- **Config**: `vercel.json` `"crons": [{"path": "/api/cron/maintenance-check", "schedule": "0 8 * * *"}]`
- **Local**: `backend/src/cron.service.js` dùng `node-cron` (test every minute).
- **Vercel**: Native Cron Jobs (persistent, reliable).

### 1. Production Deployment (Vercel + Aiven MySQL)

**Vercel Cron Status**: Active ✅ (check Vercel Dashboard > Functions > Cron Jobs)

**Deploy command**:
```bash
vercel --prod
```

**Environment Variables** (Vercel Project Settings):
```
DB_HOST=your-aiven-mysql-host
DB_PORT=17300
DB_USER=avnadmin
DB_PASSWORD=your-aiven-password
DB_NAME=defaultdb
JWT_SECRET=your-super-secret-key-min-32-chars
VITE_API_URL=/api
FRONTEND_URL=https://your-project.vercel.app
```

## ☁️ Triển khai Production (Vercel & Aiven)

Hệ thống được thiết kế để hỗ trợ triển khai hoàn toàn miễn phí trên kiến trúc Serverless với Vercel và Database trên Cloud.

### 1. Cơ sở dữ liệu (Aiven.io)
1. Đăng ký và tạo dịch vụ **MySQL** trên [Aiven.io](https://aiven.io).
2. Sử dụng phần mềm **MySQL Workbench** hoặc **DBeaver** để kết nối vào Database bằng thông số Aiven cấp (Bắt buộc chọn kết nối qua **SSL/Require**).
3. Mở file `backend/src/config/init.sql`, sửa lệnh `USE asset_management;` thành `USE defaultdb;` (Tên DB mặc định của Aiven) và chạy (Execute) để khởi tạo các bảng dữ liệu.

### 2. Triển khai Ứng dụng (Vercel)
Dự án sử dụng kiến trúc Monorepo (chứa cả Frontend và Backend). Cấu hình điều hướng đã được thiết lập sẵn trong tệp `vercel.json` ở thư mục gốc.

1. Đẩy mã nguồn lên GitHub.
2. Đăng nhập Vercel và Import dự án.
3. **Cài đặt cực kỳ quan trọng trên Vercel (Project Settings):**
   - **Root Directory**: Bắt buộc **ĐỂ TRỐNG** (Không được điền `frontend`, xóa trắng nếu có).
4. **Cấu hình Environment Variables (Biến môi trường):**
   ```env
   DB_HOST=mysql-xxxx.aivencloud.com (Lấy từ Aiven)
   DB_PORT=17300 (Cổng từ Aiven)
   DB_USER=avnadmin
   DB_PASSWORD=mật_khẩu_aiven
   DB_NAME=defaultdb
   VITE_API_URL=/api
   FRONTEND_URL=https://your-app.vercel.app (Không có dấu gạch chéo ở cuối)
   JWT_SECRET=chuoi_ky_tu_bi_mat_cua_ban
   ```
5. Bấm **Deploy** (hoặc Redeploy tắt bộ nhớ đệm). Hệ thống sẽ tự động build giao diện và kích hoạt API Backend Serverless.

## 🔄 Triển khai LAN

Để truy cập từ mạng LAN:

1. Cấu hình IP tĩnh cho máy chủ
2. Mở file `frontend/.env` (tạo mới nếu chưa có) và thêm URL trỏ tới Backend bằng IP LAN:
```env
# Thay 192.168.x.x bằng IP máy tính chạy server của bạn
VITE_API_URL=http://192.168.x.x:3001/api
```
3. Khởi động ứng dụng React với tham số `--host` để thiết bị khác có thể quét mã truy cập:
```bash
npm run dev -- --host
```

*💡 **Lưu ý:** Mã nguồn dự án đã được tối ưu hóa sự linh động. Khi test local, Backend tự động mở CORS cho các dải IP `192.168.*` hoặc `localhost`. Khi triển khai lên Vercel (nơi không có biến `VITE_API_URL`), Frontend sẽ tự động fallback về relative path `/api`. Bạn không cần phải chỉnh sửa trực tiếp vào file code.*

## 📝 Giấy phép

Dự án được phát triển cho mục đích sử dụng nội bộ.

## 👥 Đóng góp

Mọi đóng góp và cải thiện đều được hoan nghênh!

---

**Phiên bản:** 1.0.0  
**Cập nhật cuối:** 2024
