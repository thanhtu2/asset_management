export const changelog = [
  {
    version: '1.2.0',
    date: '2026-08-26',
    changes: [
      { type: 'feature', text: 'Bổ sung module Yêu cầu hỗ trợ kỹ thuật với phân loại phần cứng, phần mềm, mức độ ưu tiên và timeline xử lý' },
      { type: 'feature', text: 'Thêm phân trang, bộ lọc và liên kết tài sản cho danh sách yêu cầu hỗ trợ' },
      { type: 'feature', text: 'Ghi nhận hoạt động tạo và cập nhật yêu cầu hỗ trợ vào Audit Log' },
      { type: 'fix', text: 'Sửa logic kiểm kê tổng, đồng bộ endpoint thêm tài sản và cải thiện phân trang desktop' },
      { type: 'fix', text: 'Sửa quyền truy cập lịch tuần xe và đồng bộ quyền Audit Log, roles và permissions' },
      { type: 'security', text: 'Ngăn khởi động lại backend xóa roles, permissions và mapping quyền đã được quản trị viên cấu hình' },
      { type: 'feature', text: 'Cải thiện animation desktop cho chuyển trang, card, modal, overlay và sidebar' },
    ],
  },
  {
    version: '1.1.0',
    date: '2026-08-25',
    changes: [
      { type: 'feature', text: 'Thêm footer hiển thị trạng thái hệ thống và thông tin phiên bản' },
      { type: 'fix', text: 'Sửa lỗi hiển thị vị trí cha trong màn hình Quản lý vị trí' },
    ],
  },
  {
    version: '1.0.0',
    date: '2026-08-05',
    changes: [
      { type: 'feature', text: 'Phát hành phiên bản đầu tiên: quản lý tài sản, bảo trì, kiểm kê, đề xuất mua sắm' },
    ],
  },
];