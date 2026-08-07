import React, { useEffect, useRef } from 'react';

const UserGuidePage = () => {
  const mainContentRef = useRef(null);
  const sidebarRef = useRef(null);

  useEffect(() => {
    const sidebarLinks = sidebarRef.current?.querySelectorAll('a');
    const contentSections = mainContentRef.current?.querySelectorAll('section');

    if (!sidebarLinks || !contentSections || sidebarLinks.length === 0 || contentSections.length === 0) {
      return;
    }

    const changeActiveLink = () => {
      let currentIndex = -1;
      contentSections.forEach((section, index) => {
        if (window.scrollY >= section.offsetTop - 120) {
          currentIndex = index;
        }
      });

      sidebarLinks.forEach((link, index) => {
        if (index === currentIndex) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
    };

    const handleLinkClick = (e) => {
      e.preventDefault();
      const targetId = e.currentTarget.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 100,
          behavior: 'smooth',
        });
      }
    };

    changeActiveLink();
    window.addEventListener('scroll', changeActiveLink);
    sidebarLinks.forEach(link => {
      link.addEventListener('click', handleLinkClick);
    });

    return () => {
      window.removeEventListener('scroll', changeActiveLink);
      sidebarLinks.forEach(link => {
        link.removeEventListener('click', handleLinkClick);
      });
    };
  }, []);

  return (
    <>
      <style>{`
        .user-guide-container {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background-color: #f9fafb;
            color: #1e293b;
            line-height: 1.7;
            display: flex;
            min-height: 100vh;
        }
        .user-guide-sidebar {
            width: 280px;
            background-color: #ffffff;
            border-right: 1px solid #e2e8f0;
            height: 100vh;
            position: fixed;
            top: 0;
            left: 0;
            overflow-y: auto;
            padding: 30px 20px;
            box-sizing: border-box;
            z-index: 100;
        }
        .user-guide-sidebar h2 {
            font-size: 18px;
            color: #1e293b;
            margin-top: 0;
            margin-bottom: 25px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e2e8f0;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .user-guide-sidebar ul { list-style: none; padding: 0; margin: 0; }
        .user-guide-sidebar li a {
            display: block;
            padding: 10px 15px;
            color: #64748b;
            text-decoration: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.25s ease;
            margin-bottom: 4px;
        }
        .user-guide-sidebar li a:hover {
            background-color: #f1f5f9;
            color: #2563eb;
        }
        .user-guide-sidebar li a.active {
            background-color: #eff6ff;
            color: #2563eb;
            font-weight: 600;
            border-left: 3px solid #2563eb;
            border-radius: 0 8px 8px 0;
        }
        .user-guide-sidebar .group-title {
            font-size: 12px;
            font-weight: 700;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            padding: 20px 15px 10px;
        }
        .user-guide-main-content {
            margin-left: 280px;
            padding: 40px 60px;
            width: calc(100% - 280px);
            max-width: 900px;
        }
        .user-guide-main-content section { margin-bottom: 60px; }
        .user-guide-main-content h1 {
            font-size: 32px;
            color: #0f172a;
            margin-top: 0;
            margin-bottom: 20px;
        }
        .user-guide-main-content h2 {
            font-size: 24px;
            color: #334155;
            margin-top: 40px;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid #e2e8f0;
        }
        .user-guide-main-content p, .user-guide-main-content li {
            font-size: 16px;
            color: #475569;
        }
        .user-guide-main-content code {
            background-color: #f1f5f9;
            color: #e11d48;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 0.9em;
        }
        .user-guide-main-content .card {
            background-color: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 25px;
            margin-top: 20px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .user-guide-main-content .note {
            background-color: #eff6ff;
            border-left: 4px solid #2563eb;
            padding: 20px;
            border-radius: 0 8px 8px 0;
            margin: 25px 0;
            color: #1e40af;
        }
        @media (max-width: 768px) {
            .user-guide-container { display: block; }
            .user-guide-sidebar { position: static; width: 100%; height: auto; border-right: none; }
            .user-guide-main-content { margin-left: 0; width: 100%; padding: 20px; }
        }
      `}</style>
      <div className="user-guide-container">
        <nav className="user-guide-sidebar" ref={sidebarRef}>
          <h2>📖 Hướng Dẫn</h2>
          <ul>
            <li className="group-title">Bắt đầu</li>
            <li><a href="#tinh-nang-moi">Tính năng mới</a></li>
            <li><a href="#dang-nhap">Đăng nhập & Giao diện</a></li>
            
            <li className="group-title">Chức năng chính</li>
            <li><a href="#quan-ly-tai-san">1. Quản lý Tài sản</a></li>
            <li><a href="#kiem-ke">2. Kiểm kê</a></li>
            <li><a href="#bao-tri">3. Bảo trì</a></li>
            <li><a href="#quan-ly-xe">4. Quản lý Đăng ký xe</a></li>
            <li><a href="#de-xuat-mua-sam">5. Đề xuất Mua sắm</a></li>

            <li className="group-title">Quản trị</li>
            <li><a href="#nguoi-dung">Quản lý Người dùng</a></li>
            <li><a href="#phan-quyen">Phân quyền</a></li>
          </ul>
        </nav>

        <main className="user-guide-main-content" ref={mainContentRef}>
          
          <section id="tinh-nang-moi">
              <h1>Tính năng mới</h1>
              <div className="card">
                  <h2>Menu Cá nhân (Dropdown)</h2>
                  <p>Tại góc dưới bên trái màn hình, nhấn vào tên người dùng để mở menu:</p>
                  <ul>
                      <li><strong>Xem hồ sơ:</strong> Chỉnh sửa họ tên, đổi mật khẩu.</li>
                      <li><strong>Đăng xuất:</strong> Đảm bảo thoát tài khoản an toàn khi dùng chung máy.</li>
                  </ul>
              </div>
          </section>

          <section id="dang-nhap">
              <h1>Đăng nhập & Giao diện</h1>
              <div className="card">
                  <h2>Đăng nhập</h2>
                  <p>Sử dụng tài khoản cơ quan để đăng nhập. Nếu quên mật khẩu, vui lòng liên hệ bộ phận Quản trị viên hệ thống.</p>
                  <h2>Giao diện Sidebar</h2>
                  <p>Sidebar bên trái chứa danh mục chức năng. Bạn có thể sử dụng nút mũi tên ở cạnh phải sidebar để <strong>Thu nhỏ/Mở rộng</strong> không gian làm việc.</p>
              </div>
          </section>

          <section id="quan-ly-tai-san">
              <h1>1. Quản lý Tài sản</h1>
              <p>Đây là khu vực thao tác chính. Quy trình làm việc hiệu quả:</p>
              
              <div className="card">
                  <h3>Thêm tài sản mới</h3>
                  <ol>
                      <li>Nhấn <strong>"+ Thêm tài sản"</strong>.</li>
                      <li>Điền thông tin: Tên, loại tài sản, phòng ban sử dụng.</li>
                      <li>Hệ thống tự tạo mã tài sản duy nhất. Nhấn <strong>Lưu</strong>.</li>
                  </ol>
                  
                  <h3>In tem QR Code (Khuyên dùng)</h3>
                  <p>Sau khi tạo tài sản, hệ thống cần tem để quét. Để in tem:</p>
                  <ul>
                      <li><strong>Đơn lẻ:</strong> Nhấn nút "QR" trên dòng tài sản.</li>
                      <li><strong>Hàng loạt:</strong> Tích chọn nhiều dòng → Nhấn <strong>"In QR"</strong> trên thanh công cụ hiện ra.</li>
                  </ul>
              </div>
              
              <div className="note">
                  <p><strong>Mẹo:</strong> Sử dụng ô tìm kiếm và các bộ lọc (Phòng ban/Trạng thái) để quản lý danh sách tài sản hàng nghìn dòng một cách nhanh chóng.</p>
              </div>
          </section>

          <section id="kiem-ke">
              <h1>2. Kiểm kê</h1>
              <p>Đảm bảo dữ liệu trên hệ thống khớp thực tế.</p>
              <div className="card">
                  <ol>
                      <li><strong>Tạo phiên:</strong> Nhấn <strong>"+ Tạo phiên kiểm kê"</strong>, chọn phạm vi kiểm kê (theo phòng ban hoặc toàn bộ).</li>
                      <li><strong>Quét thực tế:</strong> Vào chi tiết phiên, nhấn <strong>"Bắt đầu quét"</strong> (sử dụng camera điện thoại/máy quét).</li>
                      <li><strong>Ghi nhận:</strong> Mỗi lần quét thành công, hệ thống tự đánh dấu "Tìm thấy". Những tài sản không quét được trong danh sách cuối phiên sẽ được đánh dấu là "Thiếu".</li>
                      <li><strong>Hoàn thành:</strong> Sau khi kiểm tra xong, nhấn <strong>"Hoàn thành phiên"</strong> để hệ thống tạo báo cáo chênh lệch.</li>
                  </ol>
              </div>
          </section>

          <section id="bao-tri">
              <h1>3. Bảo trì</h1>
              <p>Quản lý vòng đời sửa chữa.</p>
              <div className="card">
                  <ul>
                      <li><strong>Tạo phiếu thủ công:</strong> Dành cho bảo trì định kỳ.</li>
                      <li><strong>Phiếu tự động:</strong> Nếu tài sản chuyển trạng thái sang "Cần sửa chữa" hoặc "Hỏng", hệ thống tự động tạo 1 phiếu bảo trì liên kết.</li>
                      <li><strong>Kết thúc:</strong> Khi sửa xong, nhấn <strong>"Hoàn thành"</strong>, hệ thống sẽ tự cập nhật tài sản về trạng thái "Đang sử dụng".</li>
                  </ul>
              </div>
          </section>

          <section id="quan-ly-xe">
              <h1>4. Quản lý Đăng ký xe</h1>
              <div className="card">
                  <h3>Quy trình đăng ký:</h3>
                  <ol>
                      <li>Điền đầy đủ: Điểm đi, điểm đến, thời gian, phòng ban.</li>
                      <li>Mục <strong>"Thành phần tham gia"</strong>: Nhập danh sách tên người tham gia, ngăn cách bằng dấu phẩy (VD: Nguyễn Văn A, Lê Thị B).</li>
                      <li>Nhấn Lưu → Phiếu chờ duyệt.</li>
                  </ol>
                  <h3>Lưu ý về thay đổi lịch:</h3>
                  <p>Nếu đã được duyệt mà cần đổi thông tin: Nhấn <strong>"Yêu cầu đổi"</strong>, điền thông tin mới. Hệ thống gửi yêu cầu này đến Quản lý xe. Khi quản lý duyệt sự thay đổi, lịch tuần sẽ tự cập nhật.</p>
              </div>
          </section>

          <section id="de-xuat-mua-sam">
              <h1>5. Đề xuất Mua sắm</h1>
              <div className="card">
                  <p>Luồng: <code>Soạn phiếu</code> → <code>Trưởng phòng duyệt</code> → <code>Giám đốc duyệt</code> → <code>Hoàn thành</code>.</p>
                  <p><strong>Mẹo:</strong> Hãy luôn đính kèm file báo giá (PDF/Ảnh) trong phiếu đề xuất để quá trình phê duyệt diễn ra nhanh hơn mà không cần trao đổi thêm.</p>
              </div>
          </section>

          <section id="nguoi-dung">
              <h1>Quản trị: Người dùng & Phân quyền</h1>
              <div className="card">
                  <h3>Quản lý người dùng</h3>
                  <p>Quản trị viên có thể: Khóa tài khoản (khi nhân sự nghỉ), Đặt lại mật khẩu (khi người dùng quên).</p>
                  <h3>Phân quyền (RBAC)</h3>
                  <p><strong>Cảnh báo:</strong> Việc thay đổi quyền hạn của một Role có tác động ngay lập tức. Người dùng thuộc Role đó cần <strong>Đăng xuất và Đăng nhập lại</strong> để cập nhật quyền mới.</p>
              </div>
          </section>
        </main>
      </div>
    </>
  );
};

export default UserGuidePage;