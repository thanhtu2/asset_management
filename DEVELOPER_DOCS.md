# 📖 Developer Documentation - Asset Management System

Tài liệu này mô tả chi tiết về cấu trúc hệ thống, quy ước mã nguồn, luồng nghiệp vụ và các công nghệ cốt lõi được sử dụng trong dự án Quản lý tài sản (OfficeMBS).

---

## 1. 🛠 Công Nghệ Sử Dụng (Tech Stack)

### 1.1. Frontend (Client-side)
*   **Core:** ReactJS 18, Vite (Build tool cực nhanh).
*   **Routing:** React Router DOM v6.
*   **State Management:** React Context API (quản lý state Auth/User).
*   **HTTP Client:** Axios (Tích hợp Interceptors để tự động gắn JWT Token).
*   **Thư viện nổi bật:**
    *   `qrcode`: Render mã QR dưới dạng Base64 Data URL.
    *   `html5-qrcode`: Xử lý giao diện Camera và thuật toán quét mã QR ngay trên trình duyệt (hỗ trợ Mobile).
    *   **Thiết kế UI/UX:** Tối ưu hóa trải nghiệm với các thành phần nhẹ: Tích hợp inline SVG cho Toggle Password, Animation chuông thông báo thuần CSS, và Stepper trực quan cho luồng phê duyệt.

### 1.2. Backend (Server-side)
*   **Core:** Node.js, Express.js.
*   **Database:** MySQL 8.0+ (Sử dụng thư viện `mysql2/promise` kết hợp connection pool).
*   **Authentication:** JSON Web Token (JWT) & `bcryptjs` (Mã hóa mật khẩu).
*   **Security:** `express-rate-limit` (Chống Brute-force attack).
*   **Thư viện nổi bật:**
    *   `xlsx`: Xử lý import/export dữ liệu Excel (Tài sản, người dùng).
    *   `multer`: Xử lý upload file (đọc buffer Excel từ memory và lưu trữ đĩa cho tài liệu đính kèm).

### 1.3. Infrastructure & Deployment
*   **Containerization:** Docker & Docker Compose (`docker-compose.prod.yml` gồm MySQL, Nginx, Node app).
*   **Serverless/Cloud:** Cấu hình hỗ trợ deploy Vercel (Monorepo) và Aiven (Managed MySQL).

---

## 2. 🏗 Kiến Trúc Hệ Thống (System Architecture)

Hệ thống tuân theo mô hình **Client - Server** tách biệt hoàn toàn thông qua RESTful API.

### 2.1. Cấu trúc thư mục chuẩn
```text
asset_management/
├── backend/
│   ├── src/
│   │   ├── config/          # Cấu hình DB (database.js), Script SQL (init.sql)
│   │   ├── controllers/     # Controller xử lý logic (VD: asset.controller.js)
│   │   ├── middleware/      # Auth Middleware (check token, RBAC check)
│   │   ├── models/          # Các class tương tác trực tiếp với Database
│   │   ├── routes/          # Định nghĩa Endpoint API
│   │   └── app.js           # Entry point của Express, setup CORS, Routes
├── frontend/
│   ├── src/
│   │   ├── api/             # Nơi tập trung toàn bộ lời gọi Axios (index.js)
│   │   ├── components/      # UI components dùng chung (VD: QrScanner)
│   │   ├── contexts/        # AuthContext (Xử lý Login/Logout, lưu User state)
│   │   ├── pages/           # Chứa các trang giao diện (Inventory, Assets, RBAC)
│   │   └── App.jsx          # Cấu hình Routing & Protected Routes
└── docker-compose.prod.yml  # Cấu hình deploy production
```

### 2.2. Cơ chế Giao tiếp (Communication)
1. **Request:** Frontend gọi qua `apiClient` (Axios, `frontend/src/api/index.js`) — đã config `baseURL` từ `VITE_API_URL` (fallback `/api`) và bật `withCredentials: true` để trình duyệt tự động đính kèm cookie phiên đăng nhập vào mọi request, **không** dùng `Bearer Token` lấy từ `localStorage`.
2. **Authentication (Backend):** `authMiddleware` ưu tiên đọc JWT từ HTTP-only cookie (`req.cookies.token`); nếu không có cookie thì fallback đọc header `Authorization: Bearer <token>` (chỉ để hỗ trợ test bằng Postman/curl, không phải luồng chính của Frontend).
3. **Response:** Response interceptor của `apiClient` bắt lỗi `401` (trừ request `/auth/login`) và tự động điều hướng về `/login` nếu không phải route public (`/asset/...`).

---

## 3. 🗄 Thiết Kế CSDL (Database Schema & Logic)

Sử dụng CSDL quan hệ **MySQL**, thiết kế bao gồm các cụm bảng chính:

1.  **Cụm Danh mục & Cấu hình:** `categories`, `locations`, `departments`, `suppliers`. Các bảng này đóng vai trò lookup (khóa ngoại) cho bảng Tài sản.
2.  **Cụm Tài sản & Bảo trì:**
    *   `assets`: Bảng Master. Các trạng thái: `chờ cấp`, `đang sử dụng`, `cần sửa chữa`, `hỏng`, `đã thanh lý`.
    *   `maintenance_records`: Lưu lịch sử sửa chữa. Logic: Khi đổi trạng thái Asset sang `cần sửa chữa và hỏng`, hệ thống *tự động* trigger tạo 1 record bảo trì (Emergency). Trạng thái hoàn thành (`status = 'completed'`) sẽ vô hiệu hóa thao tác thừa trên UI.
3.  **Cụm Kiểm kê (Inventory):**
    *   `inventory_sessions`: Phiên kiểm kê (Tên, ngày, phòng ban).
    *   `inventory_records`: Ghi nhận chi tiết từng tài sản trong phiên. Các trạng thái: `pending_check`, `found`, `found_wrong_location`, `missing`, `damaged`, `extra`.
4.  **Cụm Phân Quyền Động (RBAC - Role Based Access Control):**
    *   `users`: Chứa user, map với role_code.
    *   `roles`: (VD: `admin`, `department-leader`, `user`).
    *   `permissions`: Mã quyền cụ thể (VD: CREATE_INVENTORY, DELETE_ASSET).
    *   `role_permissions`: Bảng trung gian n-n nối roles và permissions.
5.  **Cụm Mua sắm (Purchasing):**
    *   `purchase_proposals`: Quản lý phiếu đề xuất. Các trạng thái: `draft`, `department_pending`, `director_pending`, `approved`, `rejected`.
6.  **Cụm Xe & Đăng ký (Vehicle):**
    *   `vehicles`: Danh mục xe (plate_number, status).
    *   `vehicle_registrations`: Phiếu đăng ký (requester_id, date, status, vehicle_id).
    *   `vehicle_trips`: Lịch trình xe (hiện chủ yếu phục vụ log gán xe).

---

## 4. ⚙️ Các Luồng Nghiệp Vụ Cốt Lõi (Core Business Logic)

### 4.1. Hệ thống Phân quyền (RBAC)
*   **Backend:** 
    *   Sử dụng `authMiddleware` để xác thực JWT từ Http-only Cookie.
    *   Sử dụng `checkPermission(code)` middleware để kiểm tra quyền hạn cụ thể thay vì kiểm tra Role cứng.
*   **Frontend:** `AuthContext` giải mã JWT để lấy danh sách `permissions`. Trên UI, các nút bấm (VD: Nút Xóa, Nút Tạo mới) được ẩn/hiện bằng logic điều kiện.

### 4.2. Luồng Đăng ký Xe (Vehicle Registration)
*   **Quyền truy cập:**
    *   **Tất cả người dùng đã đăng nhập:** Đều có quyền **xem** danh sách đăng ký, **xem** lịch tuần, và **tạo mới** phiếu đăng ký xe.
    *   **Admin/Lãnh đạo/Điều phối:** Có thêm quyền **Duyệt**, **Gán xe**, **Từ chối**, **Sửa/Xóa** các phiếu đăng ký.
*   **Luồng hoạt động:**
    1.  **Tạo phiếu (`pending`):** User tạo yêu cầu (Ngày, Điểm đến, Thông tin tham gia). Không chọn xe (`vehicle_id` = NULL). Hệ thống kiểm tra trùng lịch (Carpooling) và gợi ý ghép chuyến.
    2.  **Duyệt phiếu (`approved`):** Người có quyền `APPROVE_VEHICLE_REGISTRATION` duyệt phiếu từ `pending`.
    3.  **Gán xe (`scheduled`):** Người có quyền `COORDINATE_VEHICLE` chọn xe cho phiếu đã `approved`. Phiếu chuyển trạng thái `scheduled` và hiển thị trên Lịch tuần.
    4.  **Từ chối (`rejected`):** Có thể thực hiện ở cả bước 1 và bước 2. Phiếu bị trả về và có thể được user sửa/nộp lại (tự quay về `pending`).
*   **Ghép chuyến (Carpool):** Tính năng gợi ý giúp người dùng tham gia vào các chuyến xe đã được duyệt thay vì tạo yêu cầu mới, tối ưu hóa tài nguyên.

*(Các luồng khác: Quét QR, Import Excel, Kiểm kê, Bảo trì, Notification, Khấu hao tài sản, Audit Logs - Xem chi tiết trong bản tài liệu cũ đã được tổng hợp)*

---

## 5. 🚀 Hướng Dẫn Setup & Khắc Phục Lỗi (Tóm tắt)
*(Các phần hướng dẫn vẫn giữ nguyên như cũ, chỉ cập nhật thêm thông tin về thay đổi quyền đăng ký xe tại mục 4.2)*
