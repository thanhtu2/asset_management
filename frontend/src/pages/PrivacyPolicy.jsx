const Section = ({ title, children }) => (
  <section style={{ marginBottom: 28 }}>
    <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, color: '#111827' }}>{title}</h2>
    <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.7 }}>{children}</div>
  </section>
);

const PrivacyPolicy = () => {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Chính sách bảo mật thông tin</h1>
      <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 32 }}>Cập nhật lần cuối: 26/08/2026 · Phiên bản 1.2.0</p>

      <Section title="1. Phạm vi áp dụng">
        Hệ thống Asset Management được xây dựng để phục vụ công tác quản lý tài sản nội bộ cơ quan.
        Chính sách này áp dụng cho toàn bộ cán bộ, nhân viên được cấp tài khoản truy cập hệ thống.
      </Section>

      <Section title="2. Dữ liệu được thu thập và lưu trữ">
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          <li>Thông tin tài khoản: họ tên, tên đăng nhập, phòng ban, chức vụ, vai trò phân quyền</li>
          <li>Dữ liệu nghiệp vụ: thông tin tài sản, lịch sử bàn giao, bảo trì, kiểm kê, đề xuất mua sắm</li>
          <li>Dữ liệu hỗ trợ kỹ thuật: nội dung yêu cầu, nhóm lỗi, mức độ ưu tiên, trạng thái và lịch sử xử lý</li>
          <li>File đính kèm được cung cấp trong các quy trình nghiệp vụ có hỗ trợ tải lên</li>
          <li>Nhật ký thao tác hệ thống (audit log): thời gian, người thực hiện, hành động, địa chỉ IP</li>
        </ul>
        Hệ thống không thu thập dữ liệu cá nhân ngoài phạm vi phục vụ công việc.
      </Section>

      <Section title="3. Mục đích sử dụng dữ liệu">
        Dữ liệu được sử dụng để quản lý tài sản, tiếp nhận và xử lý yêu cầu hỗ trợ kỹ thuật,
        thực hiện kiểm kê, điều phối xe, theo dõi mua sắm và lập báo cáo nội bộ. Dữ liệu không được sử dụng
        cho mục đích quảng cáo hoặc cung cấp cho bên thứ ba ngoài phạm vi vận hành được phê duyệt.
      </Section>

      <Section title="4. Phân quyền truy cập dữ liệu">
        Dữ liệu được phân quyền truy cập theo vai trò (Quản trị viên, Quản lý tài sản, Trưởng/Phó phòng, Người dùng...).
        Mỗi tài khoản chỉ xem và thao tác được trên dữ liệu thuộc phạm vi quyền hạn được cấp.
        Phiếu hỗ trợ kỹ thuật được giới hạn theo người gửi, phòng ban và quyền xử lý.
        Nhật ký hệ thống chỉ người được cấp quyền quản trị mới có quyền truy vấn.
      </Section>

      <Section title="5. Bảo mật tài khoản và phiên đăng nhập">
        Hệ thống sử dụng mật khẩu đã mã hóa và JWT lưu trong HTTP-only cookie để giảm nguy cơ bị đọc bởi mã JavaScript trên trình duyệt.
        Phiên đăng nhập có thời hạn; người dùng cần đăng xuất khi sử dụng thiết bị dùng chung.
        Hệ thống áp dụng giới hạn tần suất cho đăng nhập, API và các endpoint công khai.
      </Section>

      <Section title="6. File tải lên và dữ liệu công khai">
        File tải lên chỉ được xử lý qua các chức năng nghiệp vụ được cấp quyền và không nên chứa mật khẩu,
        khóa truy cập hoặc dữ liệu ngoài phạm vi công việc. Thông tin tài sản công khai qua QR chỉ hiển thị
        các dữ liệu được thiết kế cho tra cứu và tiếp nhận báo hỏng.
      </Section>

      <Section title="7. Thời gian lưu trữ dữ liệu">
        Dữ liệu nghiệp vụ (tài sản, bảo trì, kiểm kê) được lưu trữ trong suốt thời gian hệ thống vận hành
        để phục vụ tra cứu và báo cáo. Nhật ký hệ thống được lưu tối thiểu 12 tháng phục vụ công tác kiểm tra, đối soát khi cần.
      </Section>

      <Section title="8. Trách nhiệm của người dùng">
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          <li>Không chia sẻ tên đăng nhập, mật khẩu cho người khác</li>
          <li>Đăng xuất khỏi hệ thống khi rời khỏi thiết bị dùng chung</li>
          <li>Báo ngay cho Bộ phận CNTT khi nghi ngờ có người sử dụng tài khoản của mình hoặc phát hiện lỗ hổng bảo mật</li>
        </ul>
      </Section>

      <Section title="9. Xử lý sự cố và liên hệ">
        Mọi thắc mắc liên quan đến chính sách bảo mật hoặc dữ liệu cá nhân, vui lòng liên hệ Văn phòng - Bộ phận CNTT.
        Khi phát hiện đăng nhập bất thường, lộ thông tin tài khoản hoặc file không hợp lệ, hãy báo ngay cho Bộ phận CNTT
        và cung cấp mã phiếu hoặc thời điểm phát sinh để hỗ trợ kiểm tra audit log.
      </Section>
    </div>
  );
};

export default PrivacyPolicy;