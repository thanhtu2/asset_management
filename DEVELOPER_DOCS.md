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
1. **Request:** Frontend gọi qua `apiClient` (đã config base URL và tự động nhét `Bearer Token` lấy từ `localStorage` thông qua request interceptor).
2. **Authentev
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

---

## 4. ⚙️ Các Luồng Nghiệp Vụ Cốt Lõi (Core Business Logic)

### 4.1. Hệ thống Phân quyền (RBAC)
*   **Backend:** 
    *   Sử dụng `authMiddleware` để xác thực JWT từ Http-only Cookie.
    *   Sử dụng `checkPermission(code)` middleware để kiểm tra quyền hạn cụ thể thay vì kiểm tra Role cứng.
    *   **Quy ước mã vai trò:** Lãnh đạo phòng phải sử dụng mã `department-leader` để đồng bộ với logic lọc dữ liệu theo phòng ban trong `Asset.js`.
*   **Frontend:** `AuthContext` giải mã JWT để lấy danh sách `permissions`. Trên UI, các nút bấm (VD: Nút Xóa, Nút Tạo mới) được ẩn/hiện bằng logic điều kiện:
    ```javascript
    {user?.permissions?.includes('EDIT_INVENTORY') && <button>Sửa</button>}
    ```

### 4.2. Luồng Quét QR & Chế độ Public / Private
*   **Mã hóa QR:** QR sinh ra ở backend (`generateQR`) chứa URL trực tiếp: `https://domain.com/asset/<id>`.
*   **Quét qua Camera:** Thư viện `html5-qrcode` ở `PublicAssetPage.jsx` đọc data. Frontend dùng Regex/URL Parser tách ID/Code để tìm tài sản.
*   **Public Access:** Nếu người dùng quét QR nhưng *chưa đăng nhập*, frontend chỉ cho phép xem thông tin và hiện nút **Báo hỏng** (`cần sửa chữa và hỏng`). Request sẽ gọi vào API Public (`/api/assets/public/:id/report-damage`).
*   **Private Access:** Nếu *đã đăng nhập*, user có thể cập nhật mọi trạng thái (Đang sử dụng, Đã thanh lý,...) gọi qua các API nội bộ bị khóa bởi JWT.

### 4.3. Import Excel Dữ Liệu
*   Sử dụng thư viện `xlsx`.
*   **Logic:** Đọc file buffer -> chuyển thành Array of Arrays -> Bỏ qua dòng Header -> Lặp từng dòng -> Map string text (Mã danh mục, tên user) sang ID (category_id, user_id) thông qua Object Mapping (Pre-load data) để tăng tốc độ DB thay vì query từng dòng. Trả về kết quả thành công/thất bại theo từng dòng.

### 4.4. Luồng Kiểm Kê Tài Sản (Inventory)
1.  **Khởi tạo:** Tạo `Session` -> Cập nhật list tài sản vào `Inventory Records` (status mặc định là `pending_check`).
2.  **Quét/Check thực tế:** Sử dụng súng quét mã vạch hoặc Camera. API `/inventory/:sessionId/scan` sẽ đánh dấu tài sản thành `found` (hoặc `found_wrong_location`).
3.  **Xử lý bất thường:** Trong lúc kiểm kê, nếu thấy tài sản hỏng, user nhấn "Báo hỏng". Hệ thống cập nhật record kiểm kê thành `damaged` VÀ gọi song song sang API Asset để đổi trạng thái Asset thành `cần sửa chữa và hỏng` (tạo auto phiếu bảo trì).
4.  **Hoàn thành:** Cập nhật Session `status = completed`. Tính toán số lượng chênh lệch, lưu lịch sử.

### 4.5. Luồng Bảo Trì (Maintenance)
1.  **Tạo mới:** Phiếu bảo trì có thể được tạo thủ công hoặc tự động sinh ra khi người dùng (hoặc khách Public) báo hỏng tài sản.
2.  **Hoàn thành sửa chữa:** Sử dụng API `complete-repair`. Khi gọi, hệ thống sẽ đồng thời:
    *   Đổi `status` của phiếu bảo trì thành `completed`.
    *   Ghi nhận `completion_date` là thời điểm hiện tại.
    *   Đổi `status` của tài sản liên quan trở lại thành `đang sử dụng`.
    *   Giao diện thay thế nút bấm bằng nhãn **✓ Đã bảo trì** (màu xanh) để trực quan hóa và khóa thao tác trùng lặp.

### 4.6. Hệ thống Thông báo (Notification Bell)
*   **Lấy dữ liệu (Polling):** Frontend dùng `setInterval` gọi API `/api/notifications` mỗi 1 phút để tự động cập nhật thông báo mà không cần tải lại trang.
*   **Animation Rung chuông:** 
    *   Sử dụng `useRef` (`prevCountRef`) để lưu trữ số lượng thông báo chưa đọc của lần render trước. 
    *   Mỗi khi số lượng thông báo chưa đọc thực sự tăng lên, trigger đổi state `isRinging = true` để áp dụng class CSS kích hoạt `@keyframes smoothBellRing` trong vòng 1.2s.
*   **Click-outside:** Dùng `useRef` gắn vào container chứa dropdown và lắng nghe sự kiện `mousedown` trên toàn `document` để đóng hộp thoại thông báo mượt mà khi click ra ngoài.

### 4.7. Luồng Xử Lý Khấu Hao Tài Sản (Depreciation Logic)
Hệ thống tính khấu hao theo phương pháp **đường thẳng tính theo tháng** (Straight-line monthly depreciation) và tính toán **động (on-the-fly)** ở Backend mỗi khi có request lấy dữ liệu.
*   **Nguồn dữ liệu:** Dữ liệu tính toán lấy từ Bảng `assets` (Giá mua, ngày mua, giá trị thu hồi) kết hợp thông qua JOIN với bảng `categories` (Tỷ lệ khấu hao hàng năm tính bằng `%`).
*   **Logic Backend (`asset.controller.js`):** Hàm `calculateCurrentValue(asset)` tự động được gọi để tính toán: Tính số tháng đã qua kể từ ngày mua, nhân với mức khấu hao mỗi tháng để ra tổng khấu hao, từ đó suy ra `current_value`. Logic cũng đảm bảo giá trị này không bao giờ rớt xuống dưới mức `salvage_value` (Giá trị thu hồi) hoặc `0`.
*   **Hiển thị Frontend (`AssetListPage.jsx`):** Bổ trợ thêm các hàm `assetMonthsPassed` và `formatMonthlyDep` để hiển thị trực quan "Số tháng đã khấu hao" và "Mức khấu hao/tháng" lên giao diện Modal chi tiết tài sản.
*   **Ưu điểm thiết kế:** Việc không lưu cứng cột `current_value` vào Database giúp bỏ qua sự phụ thuộc vào Cron Job chạy ngầm mỗi đêm. Giá trị tài sản luôn luôn chính xác theo thời gian thực (real-time) tại thời điểm gọi API.

### 4.8. Luồng Ghi nhận Lịch sử Thao tác (Audit Logs)
Khác với hệ thống Chuông thông báo (nhằm mục đích nhắc nhở công việc), hệ thống Audit Logs được thiết kế cho mục đích **Bảo mật và Truy vết (Accountability)**.
*   **Database:** Mọi thay đổi được lưu vào bảng `audit_logs` với các trường quan trọng: `user_id`, `action` (CREATE/UPDATE/DELETE), `entity_type`, `entity_id`, `old_values`, `new_values`, `ip_address`.
*   **Backend Logic:** Hàm `AuditLog.log()` được gọi ngầm (silently) ngay sau khi thao tác Cập nhật/Xóa/Thêm hoàn tất thành công trong các Controller (VD: `user.controller.js`, `asset.controller.js`).
*   **Field-level Diffing (So sánh chi tiết):** Trong các thao tác UPDATE (ví dụ cập nhật tài sản), hệ thống sử dụng `fieldMap` để đối chiếu từng field giữa dữ liệu cũ (`oldAsset`) và dữ liệu mới (`req.body`). Từ đó tự động sinh ra chuỗi mô tả tiếng Việt trực quan (VD: *"Sửa giá mua từ 2 thành 1"*).
*   **Bảo mật:** Không cung cấp bất kỳ API Endpoint nào để Xóa (DELETE) hay Sửa (PUT) bản ghi trong bảng này, đảm bảo tuyệt đối tính toàn vẹn của dữ liệu kiểm toán.

### 4.9. Luồng Bảo mật (Security Implementations)
*   **Rate Limiting (Chống Brute-force & DDoS):** API `/api/auth/login` giới hạn tối đa 5 request đăng nhập/15 phút. Toàn bộ các API nội bộ bị giới hạn 300 request/15 phút. Các API Public (như báo hỏng bằng mã QR) bị giới hạn 10 request/giờ để ngăn chặn spam rác từ thiết bị lạ.
*   **XSS Protection (Chống Cross-Site Scripting):** Tại các chức năng in ấn (In mã vạch hàng loạt ở `AssetListPage.jsx`), dữ liệu tài sản (`asset_code`, `name`) được làm sạch qua hàm `escapeHTML()` trước khi chèn vào `innerHTML`, ngăn chặn chèn mã độc Javascript vào DOM.
*   **SQL Injection Protection:** Database Driver `mysql2/promise` tự động escape các tham số đầu vào bằng Parameterized Queries.
*   **Secure File Serving (Phục vụ File an toàn):** Việc truy cập các file đính kèm (VD: file báo giá trong phiếu mua sắm) được thực hiện thông qua một API endpoint chuyên dụng (`/api/download/:filename`) được bảo vệ bởi `authMiddleware`. Hệ thống không còn phục vụ file tĩnh trực tiếp từ thư mục `uploads`, ngăn chặn truy cập trái phép vào tài liệu nhạy cảm.
*   **HTTP-only Cookie Authentication:** Token xác thực (JWT) được lưu trong HTTP-only cookie thay vì `localStorage`. Điều này ngăn chặn mã JavaScript phía client truy cập vào token, giảm thiểu đáng kể nguy cơ bị đánh cắp phiên làm việc thông qua các cuộc tấn công XSS.
*   **Permission-based Access:** Chuyển đổi từ `adminMiddleware` sang `checkPermission('CODE')` cho phép phân quyền linh hoạt hơn, không phụ thuộc vào tên Role.

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
2. Tạo file `.env` ở thư mục gốc của dự án, config `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`.
3. Chạy `init.sql` vào MySQL cục bộ để tạo Schema.
4. Chạy `npm run dev`
**💡 Mẹo test thực tế trên mạng LAN (VD: Test tính năng quét QR qua Camera điện thoại):**
Để điện thoại có thể truy cập, bạn nên chạy bằng IP mạng LAN (`192.168.x.x`) thay vì `localhost`. Dự án đã được thiết kế linh hoạt cho việc này:
*   **Backend (`app.js`)**: Cấu hình CORS đã tự động cho phép mọi kết nối đến từ dải IP bắt đầu bằng `http://192.168.*` và các domain đuôi `.vercel.app`.
*   **Frontend (`.env`)**: Bạn chỉ cần tạo `.env` tại thư mục frontend và thêm: `VITE_API_URL=http://192.168.x.x:3001/api`. Cấu trúc code Axios sẽ ưu tiên lấy biến môi trường này; nếu không có (như khi deploy thẳng lên Vercel), nó sẽ tự động fallback về đường dẫn tương đối `/api`.
*   Mở command line tại thư mục `frontend/`, chạy `npm run dev -- --host` để lắng nghe trên mọi Network Interface.

### Lưu ý khi làm việc với Vercel (Cron Jobs Serverless)

**Cron Job Support ✅**
* `node-cron` chỉ hoạt động local. Vercel dùng Native Cron Jobs config trong `vercel.json`.
* Endpoint `/api/cron/maintenance-check` được Vercel tự gọi theo schedule `"0 8 * * *"` (8AM daily).
* Logic chia sẻ qua `cron.service.js` export `runMaintenanceCheck()` function (reuse code).
* Monitor: Vercel Dashboard > Functions > Cron Jobs tab (logs + executions history).
* Limit: Hobby tier 1000 invocations/month (enough for daily cron).

**Root Directory**: **PHẢI để TRỐNG** (Vercel đọc `vercel.json` gốc project).

### Lưu ý khi làm việc với Vercel
* Hệ thống này có cấu trúc **Monorepo**.
* File `vercel.json` định tuyến API gọi từ Frontend `/api/*` chọc thẳng vào các Serverless functions của Node.js.
* **Cực kỳ quan trọng:** Không được set `Root Directory` trong Vercel Settings (phải để trống) để Vercel đọc được `vercel.json` ở thư mục gốc.
* **Cron Job trên Vercel:** Thư viện `node-cron` sẽ **KHÔNG** hoạt động khi deploy lên Vercel do đặc thù Serverless sẽ tự động "ngủ" (sleep) ngay sau khi phản hồi request. Để chạy Cron (VD: gửi thông báo bảo trì hàng ngày), bắt buộc phải biến hàm đó thành 1 API Endpoint (`/api/cron/...`) và gọi thông qua cấu hình `"crons"` bên trong file `vercel.json`.

### Lưu ý khi làm việc với Aiven MySQL (Cloud DB)
* **Giới hạn tên Database:** Gói miễn phí của Aiven **chỉ cho phép sử dụng duy nhất một database có tên là `defaultdb`** và khóa quyền `CREATE DATABASE`. Bắt buộc phải để biến môi trường `DB_NAME=defaultdb` trên Vercel, nếu để tên khác (như `asset_management`) server sẽ báo lỗi 500. Bạn phải mở MySQL Workbench, `USE defaultdb;` và chạy lệnh SQL tạo bảng trực tiếp vào đó.
* **Lỗi `connect ETIMEDOUT` (Sập Server lúc khởi động):** Mặc định Aiven bật tường lửa chặn mọi kết nối. Vì Vercel sử dụng IP động, bạn **bắt buộc** phải vào giao diện quản trị Aiven > **Allowed IP Addresses** > Thêm luật `0.0.0.0/0` để mở khóa mạng. Chỉ cần thiếu bước này, Vercel sẽ không thể kết nối tới DB.

### Xử lý lỗi phổ biến
*   **Lỗi 401 văng ra trang Login liên tục:** Do JWT hết hạn, hãy xóa localStorage application và login lại, hoặc kiểm tra biến `JWT_SECRET` trên server.
*   **Lỗi Font Tiếng Việt trên DB:** Nếu import DB cũ bị lỗi, chạy script `fix_encoding.sql` ở backend để ép bảng về `utf8mb4`.
*   **Quét QR không lên:** `html5-qrcode` yêu cầu thiết bị phải cấp quyền Camera và domain bắt buộc phải là `HTTPS` (hoặc `localhost` khi dev) thì trình duyệt mới cho phép truy cập Camera.
*   **Không import được Excel:** Hãy tải lại template mẫu từ hệ thống `/api/assets/template` vì thứ tự cột trong code Backend được map cứng (VD: `row[0] = asset_code`, `row[1] = name`).
*   **Lỗi mất File đính kèm khi upload bằng Axios (`req.file` undefined):** Do cấu hình API Client mặc định ép Header `Content-Type: application/json`, Axios sẽ làm mất chuỗi `boundary` phân tách file của chuẩn multipart. *Cách khắc phục:* Khi gửi `FormData` có file đính kèm, sử dụng `fetch` API thuần thay thế cho `axios` để trình duyệt tự động nội suy đúng Header `multipart/form-data`.
*   **Lỗi xác thực khi quét QR (Public):**
    *   **Triệu chứng:** Người dùng chưa đăng nhập khi quét mã QR để xem thông tin tài sản thì gặp lỗi "Lỗi xác thực" hoặc lỗi 401.
    *   **Nguyên nhân:** Lỗi xảy ra khi trang public (`PublicAssetPage.jsx`) cố gắng gọi các API yêu cầu đăng nhập (ví dụ: `/api/assets/:id/user-history`) để lấy lịch sử sử dụng và lịch sử bảo trì. Do các API này được bảo vệ bởi `authMiddleware`, server đã từ chối request.
    *   **Giải pháp:** Tái cấu trúc bằng cách tạo một API endpoint công khai mới (`GET /api/assets/public/:id/history`) không yêu cầu xác thực. API này sẽ trả về cả hai loại lịch sử. Frontend được cập nhật để chỉ gọi API công khai này, loại bỏ các lời gọi đến API private gây lỗi.
*   **Lỗi lồng chuỗi JSON hai lần (Double Stringification):** Xảy ra khi lưu mảng (VD: `items` của phiếu mua sắm) vào MySQL JSON, chuỗi có thể biến dạng thành dạng lồng ngầm `"[{\"name\":
---

## 7. 📈 Tiến Độ Phát Triển (Project Progress)

**Các module đã hoàn thiện & đi vào ổn định (Done):**
*   ✅ **Xác thực & RBAC:** Đăng nhập JWT, Phân quyền động, Quản lý người dùng, Vai trò (Roles) và Quyền (Permissions).
*   ✅ **Quản lý Tài sản (Core):** CRUD Tài sản, Tính toán Khấu hao động (on-the-fly), In ấn tem nhãn QR (Đơn lẻ & Hàng loạt).
*   ✅ **Quét QR Code:** Hỗ trợ quét bằng Camera ngay trên Mobile (xử lý Fake SSL cho LAN nội bộ), chống lỗi nháy Camera kép, xử lý đa định dạng mã.
*   ✅ **Bảo trì & Báo hỏng:** Liên kết chặt chẽ với Kiểm kê và Public page. Tự động sinh phiếu bảo trì (chống sinh trùng lặp), tự động đóng phiếu khi tài sản thanh lý.
*   ✅ **Kiểm kê Tài sản:** Quét mã vạch kiểm đếm tự động, phát hiện tài sản sai vị trí/thừa/thiếu, hỗ trợ thao tác xử lý hư hỏng và đề xuất thanh lý ngay trong màn hình kiểm kê.
*   ✅ **Đề xuất mua sắm:** Luồng phê duyệt chuẩn 4 bước (Nháp -> Lãnh đạo Phòng -> Ban Giám đốc -> Hoàn thành), có hỗ trợ đính kèm File báo giá/hình ảnh.
*   ✅ **Báo cáo & Dashboard:** Thống kê dữ liệu Real-time, tính năng Xuất (Export) & Nhập (Import) dữ liệu bằng Excel.
*   ✅ **Hệ thống phụ trợ:** Chuông thông báo (Notification) tự động cập nhật, Audit Logs ghi nhận lịch sử thay đổi cực kỳ chi tiết đến từng Field bị chỉnh sửa, Hệ thống Rate Limit chống Spam/DDoS.