# Sơ đồ luồng xử lý Đăng ký xe (Vehicle Registration)

## 1. Sơ đồ trạng thái (State Machine)

```mermaid
stateDiagram-v2
    [*] --> pending : Tạo phiếu (người dùng)
    pending --> approved : Duyệt (lãnh đạo)
    pending --> rejected : Từ chối (lãnh đạo)
    approved --> scheduled : Gán xe (điều phối)
    approved --> rejected : Từ chối không sắp được xe (điều phối)
    rejected --> pending : Sửa lại = nộp lại (người dùng)
    scheduled --> scheduled : Hiển thị trong Lịch tuần
    rejected --> [*] : Xóa
    scheduled --> [*] : Xóa
    
    note right of pending
        Trạng thái khởi tạo
        vehicle_id = NULL
        Không được chọn xe khi tạo
    end note
    
    note right of approved
        Đã duyệt nhưng chưa có xe
        Chờ điều phối gán xe
    end note
    
    note right of scheduled
        Đã gán xe cụ thể
        Hiển thị ở Lịch tuần
        Không thể double-booking
    end note
```

## 2. Sơ đồ quy trình xử lý (Activity Diagram)

```mermaid
flowchart TD
    %% Khởi tạo
    A([Bắt đầu]) --> B[Người dùng mở form Đăng ký xe]
    B --> C{Quyền CREATE_VEHICLE_REGISTRATION?}
    C -->|Không| D([Từ chối])
    C -->|Có| E[Nhập thông tin:<br/>- Ngày/giờ khởi hành<br/>- Điểm đi/điểm đến<br/>- Phòng ban tham gia<br/>- Thành phần, ghi chú]
    
    %% Ghép chuyến
    E --> F{Kiểm tra ghép chuyến<br/>cùng ngày + điểm đến?}
    F -->|Có phiếu trùng| G[Hiển thị gợi ý ghép chuyến]
    G --> H{Người dùng chọn?}
    H -->|Ghép chuyến| I[Gọi API joinExisting<br/>Thêm phòng ban vào phiếu cũ]
    I --> J([Kết thúc - Không cần duyệt])
    H -->|Tạo phiếu mới| K
    
    %% Tạo phiếu
    F -->|Không| K
    K[Gọi API POST /vehicle-registrations] --> L[Status = pending<br/>vehicle_id = NULL]
    L --> M{Validation:<br/>- registration_date<br/>- destination<br/>- departure_location<br/>- department_ids}
    M -->|Thiếu| N([Lỗi 400])
    M -->|OK| O[Tạo phiếu thành công]
    
    %% Duyệt
    O --> P[Lãnh đạo xem danh sách pending]
    P --> Q{Quyền APPROVE_VEHICLE_REGISTRATION?}
    Q -->|Không| R([Không thấy nút Duyệt])
    Q -->|Có| S{Nhấn Duyệt?}
    S -->|Không| T{Nhấn Từ chối?}
    S -->|Có| U[Gọi API PUT .../approve]
    U --> V[Status = approved]
    V --> W[Chờ điều phối gán xe]
    
    %% Từ chối (bước duyệt)
    T -->|Có lý do| X[Gọi API PUT .../reject]
    T -->|Không| R
    X --> Y[Status = rejected<br/>Ghi lý do vào notes]
    Y --> Z[Người dùng sửa lại → nộp lại<br/>Status tự về pending]
    
    %% Gán xe
    W --> AA[Điều phối xem danh sách approved]
    AA --> AB{Quyền COORDINATE_VEHICLE?}
    AB -->|Không| AC([Không thấy nút Gán xe])
    AB -->|Có| AD{Mở modal chọn xe}
    AD --> AE[Chọn xe từ dropdown]
    AE --> AF{Kiểm tra conflict<br/>xe đã được gán cho phiếu khác<br/>cùng ngày?}
    AF -->|Có conflict| AG[Hiển thị cảnh báo<br/>xe đã dùng cho phiếu khác]
    AG --> AD
    AF -->|Không| AH[Gọi API PUT .../assign-vehicle]
    AH --> AI[Status = scheduled<br/>vehicle_id = xe đã chọn]
    AI --> AJ[Hiển thị trong Lịch tuần]
    
    AJ --> AK([Kết thúc])
```

## 3. Sơ đồ kiến trúc API

```mermaid
sequenceDiagram
    participant User as Người dùng
    participant FE as Frontend (React)
    participant BE as Backend (Express)
    participant DB as Database (MySQL)
    
    Note over User,DB: === TẠO PHIẾU ===
    
    User->>FE: Điền form đăng ký
    FE->>BE: POST /vehicle-registrations
    BE->>BE: Kiểm tra CREATE_VEHICLE_REGISTRATION
    BE->>DB: INSERT (vehicle_id=null, status=pending)
    DB-->>BE: Registration created
    BE-->>FE: { message, id }
    FE-->>User: "Gửi yêu cầu thành công"
    
    Note over User,DB: === DUYỆT PHIẾU ===
    
    User->>FE: Nhấn "Duyệt" (lãnh đạo)
    FE->>BE: PUT /vehicle-registrations/:id/approve
    BE->>BE: Kiểm tra APPROVE_VEHICLE_REGISTRATION
    BE->>BE: Kiểm tra status === 'pending'
    BE->>DB: UPDATE status='approved'
    DB-->>BE: Updated
    BE-->>FE: { message }
    FE-->>User: "Duyệt thành công"
    
    Note over User,DB: === GÁN XE ===
    
    User->>FE: Chọn xe (điều phối)
    FE->>BE: PUT /vehicle-registrations/:id/assign-vehicle
    BE->>BE: Kiểm tra COORDINATE_VEHICLE
    BE->>BE: Kiểm tra status === 'approved'
    BE->>DB: Check vehicle conflict
    DB-->>BE: No conflict
    BE->>DB: UPDATE vehicle_id, status='scheduled'
    DB-->>BE: Updated
    BE-->>FE: { message }
    FE-->>User: "Gán xe thành công"
    
    Note over User,DB: === GHÉP CHUYẾN ===
    
    User->>FE: Điền ngày/giờ/điểm đến
    FE->>BE: GET /vehicle-registrations/merge-suggestions
    BE->>DB: Tìm phiếu trùng lịch
    DB-->>BE: Danh sách phiếu
    BE-->>FE: { data: candidates }
    FE-->>User: Hiển thị gợi ý ghép
    User->>FE: Chọn "Ghép chuyến này"
    FE->>BE: POST /vehicle-registrations/:id/join
    BE->>DB: INSERT department_ids
    DB-->>BE: Joined
    BE-->>FE: { message }
    FE-->>User: "Ghép chuyến thành công"
```

## 4. Sơ đồ phân quyền (Permission Matrix)

```mermaid
flowchart LR
    subgraph Quyền
        CREATE[CREATE_VEHICLE_REGISTRATION]
        VIEW[VIEW_VEHICLE_REGISTRATIONS]
        EDIT[EDIT_VEHICLE_REGISTRATION]
        DELETE[DELETE_VEHICLE_REGISTRATION]
        APPROVE[APPROVE_VEHICLE_REGISTRATION]
        COORDINATE[COORDINATE_VEHICLE]
        WEEKLY[VIEW_VEHICLE_WEEKLY]
    end
    
    subgraph User
        U[Người dùng thường]
        L[Lãnh đạo - APPROVE]
        D[Điều phối - COORDINATE]
        A[Admin]
    end
    
    A --> CREATE
    A --> VIEW
    A --> EDIT
    A --> DELETE
    A --> APPROVE
    A --> COORDINATE
    A --> WEEKLY
    
    U --> CREATE
    U --> VIEW
    U --> EDIT
    U --> DELETE
    
    L --> APPROVE
    L --> VIEW
    L --> WEEKLY
    
    D --> COORDINATE
    D --> VIEW
    D --> WEEKLY
```

## 5. Sơ đồ cấu trúc Database (ERD)

```mermaid
erDiagram
    vehicle_registrations {
        int id PK "Khóa chính"
        string registration_number "Mã đăng ký (UNIQUE)"
        int requester_id FK "Người tạo phiếu"
        int vehicle_id FK "Xe được gán (NULL ở bước 1)"
        date registration_date "Ngày khởi hành"
        time departure_time "Giờ khởi hành"
        string departure_location "Điểm đi"
        string destination "Điểm đến"
        string participants "Thành phần tham gia"
        text notes "Ghi chú"
        enum status "pending|approved|scheduled|rejected|cancelled"
        string attachment_path "File đính kèm"
    }
    
    vehicle_registration_departments {
        int registration_id FK
        int department_id FK
    }
    
    vehicles {
        int id PK
        string plate_number "Biển số xe"
        string brand "Hãng xe"
        string model "Mẫu xe"
        enum status "available|in_use|maintenance|retired"
    }
    
    departments {
        int id PK
        string name "Tên phòng ban"
    }
    
    users {
        int id PK
        string fullName "Họ tên"
        int department_id FK "Phòng ban"
    }
    
    vehicle_registrations ||--o{ vehicle_registration_departments : "có"
    vehicle_registration_departments }o--|| departments : "thuộc"
    vehicle_registrations ||--o| vehicles : "được gán"
    vehicle_registrations }o--|| users : "tạo bởi"
```

## 6. Ghi chú logic quan trọng

### Ràng buộc khi tạo phiếu:
- `vehicle_id` phải là `NULL` - không được chọn xe khi tạo
- `status` luôn bắt đầu là `pending`
- Bắt buộc có: `registration_date`, `destination`, `departure_location`, `department_ids`

### Ràng buộc khi sửa phiếu:
- Chỉ sửa được khi `pending` hoặc `rejected`
- Sửa khi `rejected` = nộp lại → tự chuyển về `pending`
- Không cho sửa `vehicle_id` hay `status` qua API sửa thông thường

### Ràng buộc khi duyệt (approve):
- Chỉ duyệt được khi `status === 'pending'`

### Ràng buộc khi gán xe (assignVehicle):
- Chỉ gán xe được khi `status === 'approved'`
- Kiểm tra double-booking: xe không được gán cho phiếu khác cùng ngày

### Ràng buộc khi từ chối (reject):
- Cho phép ở cả `pending` (lãnh đạo từ chối) và `approved` (điều phối từ chối)

### Ghép chuyến (Merge/Carpool):
- Chỉ ghép vào phiếu đã `approved` hoặc `scheduled`
- Dùng `INSERT IGNORE` để tránh trùng phòng ban

