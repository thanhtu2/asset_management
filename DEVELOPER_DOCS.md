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

### 1.2. Backend (Server-side)
*   **Core:** Node.js, Express.js.
*   **Database:** MySQL 8.0+ (Sử dụng thư viện `mysql2/promise` kết hợp connection pool).
*   **Authentication:** JSON Web Token (JWT) & `bcryptjs` (Mã hóa mật khẩu).
*   **Thư viện nổi bật:**
    *   `xlsx`: Xử lý import/export dữ liệu Excel (Tài sản, người dùng).
    *   `multer`: Xử lý upload file (đọc buffer file Excel từ memory).

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
1. **Request:** Frontend gọi qua `apiClient` (đã config base URL và tự động nhét `Bearer Token` lấy từ `localStorage` thông qua request interceptor).
2. **Response:** Backend check token qua middleware. Nếu hợp lệ, Controller truy vấn DB qua Model, trả về JSON.
3. **Error Handling:** Trả về HTTP Status (400, 401, 403, 404, 500). Axios Response Interceptor ở Frontend nếu gặp mã `401 Unauthorized` sẽ tự động xóa token và redirect về `/login`.

---

## 3. 🗄 Thiết Kế CSDL (Database Schema & Logic)

Sử dụng CSDL quan hệ **MySQL**, thiết kế bao gồm các cụm bảng chính:

1.  **Cụm Danh mục & Cấu hình:** `categories`, `locations`, `departments`, `suppliers`. Các bảng này đóng vai trò lookup (khóa ngoại) cho bảng Tài sản.
2.  **Cụm Tài sản & Bảo trì:**
    *   `assets`: Bảng Master. Các trạng thái: `new`, `good`, `needs_repair`, `disposed`.
    *   `maintenance_records`: Lưu lịch sử sửa chữa. Logic: Khi đổi trạng thái Asset sang `needs_repair`, hệ thống *tự động* trigger tạo 1 record bảo trì (Emergency). Trạng thái hoàn thành (`status = 'completed'`) sẽ vô hiệu hóa thao tác thừa trên UI.
3.  **Cụm Kiểm kê (Inventory):**
    *   `inventory_sessions`: Phiên kiểm kê (Tên, ngày, phòng ban).
    *   `inventory_records`: Ghi nhận chi tiết từng tài sản trong phiên. Các trạng thái: `pending_check`, `found`, `found_wrong_location`, `missing`, `damaged`, `extra`.
4.  **Cụm Phân Quyền Động (RBAC - Role Based Access Control):**
    *   `users`: Chứa user, map với role_code.
    *   `roles`: (VD: ADMIN, MANAGER, USER).
    *   `permissions`: Mã quyền cụ thể (VD: CREATE_INVENTORY, DELETE_ASSET).
    *   `role_permissions`: Bảng trung gian n-n nối roles và permissions.

---

## 4. ⚙️ Các Luồng Nghiệp Vụ Cốt Lõi (Core Business Logic)

### 4.1. Hệ thống Phân quyền (RBAC)
*   **Backend:** Lấy quyền của user bằng cách join bảng `users` -> `roles` -> `role_permissions` -> `permissions` lúc đăng nhập và nén vào payload của JWT, hoặc gọi middleware check quyền từng route.
*   **Frontend:** `AuthContext` giải mã JWT để lấy danh sách `permissions`. Trên UI, các nút bấm (VD: Nút Xóa, Nút Tạo mới) được ẩn/hiện bằng logic điều kiện:
    ```javascript
    {user?.permissions?.includes('EDIT_INVENTORY') && <button>Sửa</button>}
    ```

### 4.2. Luồng Quét QR & Chế độ Public / Private
*   **Mã hóa QR:** QR sinh ra ở backend (`generateQR`) chứa URL trực tiếp: `https://domain.com/asset/<id>`.
*   **Quét qua Camera:** Thư viện `html5-qrcode` ở `PublicAssetPage.jsx` đọc data. Frontend dùng Regex/URL Parser tách ID/Code để tìm tài sản.
*   **Public Access:** Nếu người dùng quét QR nhưng *chưa đăng nhập*, frontend chỉ cho phép xem thông tin và hiện nút **Báo hỏng** (`needs_repair`). Request sẽ gọi vào API Public (`/api/assets/public/:id/report-damage`).
*   **Private Access:** Nếu *đã đăng nhập*, user có thể cập nhật mọi trạng thái (Good, Disposed,...) gọi qua các API nội bộ bị khóa bởi JWT.

### 4.3. Import Excel Dữ Liệu
*   Sử dụng thư viện `xlsx`.
*   **Logic:** Đọc file buffer -> chuyển thành Array of Arrays -> Bỏ qua dòng Header -> Lặp từng dòng -> Map string text (Mã danh mục, tên user) sang ID (category_id, user_id) thông qua Object Mapping (Pre-load data) để tăng tốc độ DB thay vì query từng dòng. Trả về kết quả thành công/thất bại theo từng dòng.

### 4.4. Luồng Kiểm Kê Tài Sản (Inventory)
1.  **Khởi tạo:** Tạo `Session` -> Cập nhật list tài sản vào `Inventory Records` (status mặc định là `pending_check`).
2.  **Quét/Check thực tế:** Sử dụng súng quét mã vạch hoặc Camera. API `/inventory/:sessionId/scan` sẽ đánh dấu tài sản thành `found` (hoặc `found_wrong_location`).
3.  **Xử lý bất thường:** Trong lúc kiểm kê, nếu thấy tài sản hỏng, user nhấn "Báo hỏng". Hệ thống cập nhật record kiểm kê thành `damaged` VÀ gọi song song sang API Asset để đổi trạng thái Asset thành `needs_repair` (tạo auto phiếu bảo trì).
4.  **Hoàn thành:** Cập nhật Session `status = completed`. Tính toán số lượng chênh lệch, lưu lịch sử.

### 4.5. Luồng Bảo Trì (Maintenance)
1.  **Tạo mới:** Phiếu bảo trì có thể được tạo thủ công hoặc tự động sinh ra khi người dùng (hoặc khách Public) báo hỏng tài sản.
2.  **Hoàn thành sửa chữa:** Khi người dùng nhấn nút "Hoàn thành", hệ thống sẽ đồng thời:
    *   Đổi `status` của phiếu bảo trì thành `completed`.
    *   Đổi `status` của tài sản liên quan trở lại thành `good`.
    *   Giao diện thay thế nút bấm bằng nhãn **✓ Đã bảo trì** (màu xanh) để trực quan hóa và khóa thao tác trùng lặp.

### 4.6. Hệ thống Thông báo (Notification Bell)
*   **Lấy dữ liệu (Polling):** Frontend dùng `setInterval` gọi API `/api/notifications` mỗi 1 phút để tự động cập nhật thông báo mà không cần tải lại trang.
*   **Animation Rung chuông:** 
    *   Sử dụng `useRef` (`prevCountRef`) để lưu trữ số lượng thông báo chưa đọc của lần render trước. 
    *   Mỗi khi số lượng thông báo chưa đọc thực sự tăng lên, trigger đổi state `isRinging = true` để áp dụng class CSS kích hoạt `@keyframes smoothBellRing` trong vòng 1.2s.
*   **Click-outside:** Dùng `useRef` gắn vào container chứa dropdown và lắng nghe sự kiện `mousedown` trên toàn `document` để đóng hộp thoại thông báo mượt mà khi click ra ngoài.

---

## 5. 🔌 Tiêu Chuẩn Giao Tiếp API (API Standards)

*   **RESTful URLs:** Danh từ số nhiều (e.g., `/api/assets`, `/api/users`).
*   **Phân trang (Pagination):** Request truyền `?page=1&limit=10`. Response format:
    ```json
    {
      "data": [...],
      "pagination": { "page": 1, "limit": 10, "total": 50, "totalPages": 5 }
    }
    ```
*   **Trích xuất User ID:** Backend tự động lấy `req.user.id` từ Middleware Auth để gán vào các hành động (VD: `created_by`, `checked_by`). Không gửi User ID tường minh từ Frontend để bảo mật.

---

## 6. 🚀 Hướng Dẫn Setup & Khắc Phục Lỗi Dành Cho Dev

### Môi trường Cục bộ (Local / Dev)
1. **Clone repo**, cd vào cả 2 thư mục `frontend` và `backend` chạy `npm install`.
2. Tạo file `.env` ở Backend, config `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`.
3. Chạy `init.sql` vào MySQL cục bộ để tạo Schema.
4. Chạy `npm run dev` ở backend (cổng 3001) và frontend (cổng 5173).

### Lưu ý khi làm việc với Vercel
* Hệ thống này có cấu trúc **Monorepo**.
* File `vercel.json` định tuyến API gọi từ Frontend `/api/*` chọc thẳng vào các Serverless functions của Node.js.
* **Cực kỳ quan trọng:** Không được set `Root Directory` trong Vercel Settings (phải để trống) để Vercel đọc được `vercel.json` ở thư mục gốc.

### Xử lý lỗi phổ biến
*   **Lỗi 401 văng ra trang Login liên tục:** Do JWT hết hạn, hãy xóa localStorage application và login lại, hoặc kiểm tra biến `JWT_SECRET` trên server.
*   **Lỗi Font Tiếng Việt trên DB:** Nếu import DB cũ bị lỗi, chạy script `fix_encoding.sql` ở backend để ép bảng về `utf8mb4`.
*   **Quét QR không lên:** `html5-qrcode` yêu cầu thiết bị phải cấp quyền Camera và domain bắt buộc phải là `HTTPS` (hoặc `localhost` khi dev) thì trình duyệt mới cho phép truy cập Camera.
*   **Không import được Excel:** Hãy tải lại template mẫu từ hệ thống `/api/assets/template` vì thứ tự cột trong code Backend map cứng (VD: `row[0] = asset_code`, `row[1] = name`).