# TODO: Vehicle Registration - Các vấn đề đã fix

## ✅ Đã hoàn thành tất cả

### Fix 1: Gợi ý ghép chuyến (Merge Candidates)
- [x] **Vấn đề**: Chỉ xuất hiện gợi ý khi đăng ký chính xác từng phút (do `findMergeCandidates` yêu cầu `departure_time`).
- [x] **Fix Backend** (`backend/src/models/VehicleRegistration.js`): `findMergeCandidates()` đã bỏ yêu cầu `departure_time`. Chỉ cần cùng **NGÀY + ĐIỂM ĐẾN** là đủ.
- [x] **Fix Controller** (`backend/src/controllers/vehicleRegistration.controller.js`): `getMergeSuggestions` không còn gửi `departure_time`.
- [x] **Fix Frontend** (`frontend/src/pages/VehicleRegistrationPage.jsx`): `handleCheckMerge` chỉ gửi `registration_date` + `destination`.

### Fix 2: Thông báo cho người có quyền duyệt xe khi có ghép chuyến
- [x] **Fix Controller** (`backend/src/controllers/vehicleRegistration.controller.js`): `joinVehicleRegistration` gọi `createNotification(null, ...)` để gửi thông báo đến tất cả admin sau khi ghép chuyến thành công.

### Fix 3: Cộng thêm người tham gia khi ghép chuyến
- [x] **Fix Backend Model** (`backend/src/models/VehicleRegistration.js`): `joinExisting()` nhận thêm tham số `newParticipants` và cộng dồn vào `participants` hiện có.
- [x] **Fix Controller**: `joinVehicleRegistration` nhận `participants: newParticipants` từ request body và truyền xuống Model.
- [x] **Fix Frontend API** (`frontend/src/api/index.js`): `join()` nhận thêm `participants` param.
- [x] **Fix Frontend** (`frontend/src/pages/VehicleRegistrationPage.jsx`): `handleJoinCandidate` gửi `currentRegistration.participants` khi ghép chuyến.

### Fix 4: Cho phép người tạo phiếu sửa khi bị từ chối (rejected)
- [x] **Fix Frontend** (`frontend/src/pages/VehicleRegistrationPage.jsx`): `canEditThis` mở rộng: 
  - Nếu có quyền `EDIT_VEHICLE_REGISTRATION` VÀ phiếu `pending/rejected`
  - **HOẶC là người tạo phiếu** (`reg.requester_id === user?.id`) VÀ phiếu `rejected`
  - Backend `update()` đã tự động chuyển `rejected → pending` khi sửa — đã hoạt động.

### Fix 5: Upload file
- [x] Đã kiểm tra: Upload hoạt động qua route POST `/:id/upload`
- [x] Backend `uploadAttachment` dùng `generalUpload` middleware (hỗ trợ PDF, DOC, DOCX, XLS, XLSX, PNG, JPG, JPEG, CSV, max 10MB)
- [x] Frontend: UI upload file trong modal tạo/sửa + hiển thị trong danh sách
- [x] Auto-upload sau khi tạo phiếu mới

### Các file đã chỉnh sửa
| File | Thay đổi |
|---|---|
| `backend/src/models/VehicleRegistration.js` | Bỏ `departure_time` trong `findMergeCandidates`, thêm `newParticipants` + `participants` trong `joinExisting`, thêm `attachment_path/document_name` |
| `backend/src/controllers/vehicleRegistration.controller.js` | Import `createNotification`, `joinVehicleRegistration` gửi thông báo + nhận participants, `getMergeSuggestions` bỏ departure_time |
| `frontend/src/api/index.js` | `join()` thêm participants param |
| `frontend/src/pages/VehicleRegistrationPage.jsx` | `handleCheckMerge` bỏ departure_time, `handleJoinCandidate` gửi participants, `canEditThis` cho phép người tạo sửa rejected |

