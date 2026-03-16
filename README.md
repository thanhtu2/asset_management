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
- Theo dõi tình trạng tài sản (Mới, Tốt, Cần sửa, Đã thanh lý)
- Hỗ trợ mã vạch/QR code
- Tìm kiếm và lọc tài sản nâng cao

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

### 7. Kiểm kê tài sản (Inventory)
- Tạo phiên kiểm kê
- Danh sách tài sản cần kiểm kê
- Ghi nhận kết quả (Có/Mất/Hỏng)
- Báo cáo chênh lệch sau kiểm kê
- Lịch sử kiểm kê

### 8. Báo cáo & Thống kê (Dashboard)
- Tổng số tài sản
- Tổng giá trị tài sản
- Thống kê theo trạng thái
- Thống kê theo danh mục, bộ phận, vị trí

### 9. Quản lý người dùng (Users)
- Đăng nhập/Đăng xuất an toàn
- Phân quyền (Admin/User)
- Quản lý người dùng (chỉ Admin)

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
| `POST` | `/api/auth/change-password` | Đổi mật khẩu. Body: `{ "oldPassword": "...", "newPassword": "..." }` |

### Assets

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/assets` | Lấy danh sách tài sản (hỗ trợ phân trang, tìm kiếm, lọc). |
| `GET` | `/api/assets/all` | Lấy danh sách rút gọn tất cả tài sản (cho dropdown). |
| `GET` | `/api/assets/:id` | Lấy chi tiết một tài sản. |
| `POST` | `/api/assets` | Tạo tài sản mới. |
| `PUT` | `/api/assets/:id` | Cập nhật thông tin tài sản. |
| `DELETE` | `/api/assets/:id` | Xóa tài sản. |
| `GET` | `/api/assets/export` | Xuất danh sách tài sản ra file Excel. |
| `POST` | `/api/assets/import` | Nhập tài sản từ file Excel. |
| `GET` | `/api/assets/:id/qrcode` | Tạo mã QR cho tài sản. |
| `POST` | `/api/public/:id/report-damage` | API Public để người dùng báo hỏng tài sản qua QR code. |

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
| `GET` | `/api/inventory/:sessionId/records` | Lấy danh sách tài sản trong một phiên. |
| `POST` | `/api/inventory/:sessionId/scan` | Ghi nhận kết quả quét mã QR. |
| `PUT` | `/api/inventory/:sessionId/records/:recordId` | Cập nhật thủ công một bản ghi kiểm kê. |

### Users

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/users` | Lấy danh sách người dùng (chỉ admin). |
| `POST` | `/api/users` | Tạo người dùng mới (chỉ admin). |
| `PUT` | `/api/users/:id` | Cập nhật người dùng (chỉ admin). |
| `DELETE` | `/api/users/:id` | Xóa người dùng (chỉ admin). |

### Dashboard

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard` | Lấy các thống kê tổng quan cho dashboard. |

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
| `current_value` | DECIMAL | Giá trị hiện tại (sau khấu hao) |
| `status` | ENUM | Trạng thái ('Tốt', 'Cần sửa', 'Đang sửa', 'Mất', 'Thanh lý') |
| `barcode` | VARCHAR(100) | Mã vạch (duy nhất) |
| `image_url` | VARCHAR(255) | URL hình ảnh |
| `assigned_to` | INT | Khóa ngoại, liên kết đến `users(id)` |
| `assigned_date` | DATE | Ngày bàn giao |

### Bảng `users`
Quản lý thông tin người dùng và phân quyền.

| Trường | Loại | Mô tả |
|---|---|---|
| `id` | INT | Khóa chính, tự tăng |
| `username` | VARCHAR(50) | Tên đăng nhập (duy nhất) |
| `password` | VARCHAR(255) | Mật khẩu (đã mã hóa) |
| `fullName` | VARCHAR(100) | Họ và tên |
| `role` | ENUM | Vai trò ('admin', 'user') |
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
| `maintenance_type` | ENUM | Loại bảo trì ('Sửa chữa', 'Bảo dưỡng định kỳ') |
| `description` | TEXT | Mô tả công việc |
| `start_date` | DATE | Ngày bắt đầu |
| `completion_date` | DATE | Ngày hoàn thành |
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
| `actual_status` | VARCHAR(50) | Trạng thái thực tế ('found', 'missing', 'damaged', 'extra') |
| `notes` | TEXT | Ghi chú |
| `checked_at` | DATETIME | Thời điểm kiểm kê |
| `checked_by` | INT | Khóa ngoại, liên kết đến `users(id)` |

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

## 🔄 Triển khai LAN

Để truy cập từ mạng LAN:

1. Cấu hình IP tĩnh cho máy chủ
2. Cập nhật CORS trong `backend/src/app.js`:
```javascript
app.use(cors({
  // Thay thế bằng IP LAN của máy chủ và các client được phép
  origin: ['http://<SERVER_IP>:5173', 'http://<CLIENT_IP>:5173'],
  credentials: true
}));
```

3. Cập nhật API URL trong `frontend/src/api/index.js`:
```
javascript
const API_BASE_URL = 'http://192.168.89.118:3001/api';
```

## 📝 Giấy phép

Dự án được phát triển cho mục đích sử dụng nội bộ.

## 👥 Đóng góp

Mọi đóng góp và cải thiện đều được hoan nghênh!

---

**Phiên bản:** 1.0.0  
**Cập nhật cuối:** 2024
