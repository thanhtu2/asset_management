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
        .user-guide-main-content h3 {
            font-size: 18px;
            color: #475569;
            margin-top: 25px;
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
                  <p>Để quản lý thông tin, nhấn vào tên người dùng ở góc dưới bên trái Sidebar:</p>
                  <ul>
                      <li><strong>Xem hồ sơ:</strong> Chỉnh sửa họ tên cá nhân (hệ thống sẽ tự cập nhật thông tin mới nhất).</li>
                      <li><strong>Đăng xuất:</strong> Thoát tài khoản an toàn sau khi kết thúc phiên làm việc.</li>
                      <li><strong>Hủy chuyến đi:</strong>Người dùng có thể chủ động hủy chuyến đi khi đã lên lịch (khi đã hủy chuyến, phiếu đăng ký sẽ cập nhật trái đã hủy và sẽ không xuất hiện trong lịch tuần)</li>
                  </ul>
              </div>
          </section>

          <section id="dang-nhap">
              <h1>Đăng nhập & Giao diện</h1>
              <div className="card">
                  <h2>1. Đăng nhập</h2>
                  <p>Nhập <strong>Tên đăng nhập</strong> và <strong>Mật khẩu</strong> do Quản trị viên cung cấp. Nếu hệ thống thông báo "Sai thông tin", vui lòng kiểm tra lại phím CapsLock và thử lại.</p>
                  
                  <h2>2. Điều hướng</h2>
                  <p>Sử dụng các menu bên trái để di chuyển. Nếu Sidebar quá rộng, nhấn nút <strong>mũi tên {"<"}</strong> ở cạnh phải sidebar để thu gọn, giúp có nhiều không gian làm việc hơn.</p>
              </div>
          </section>

          <section id="quan-ly-tai-san">
              <h1>1. Quản lý Tài sản</h1>
              <div className="card">
                  <h3>Thao tác thêm tài sản</h3>
                  <ol>
                      <li>Nhấn nút <strong>"+ Thêm tài sản"</strong> ở góc trên bên phải bảng.</li>
                      <li>Điền các thông tin: Tên, loại, tình trạng, phòng ban. Các trường có <code>*</code> là bắt buộc.</li>
                      <li>Sau khi nhấn Lưu, mã tài sản sẽ tự động tạo.</li>
                  </ol>
                  
                  <h3>Cách in tem QR Code</h3>
                  <p><strong>Tem QR là bắt buộc để kiểm kê.</strong></p>
                  <ul>
                      <li>Để in một tem: Nhấn nút <strong>"QR"</strong> trên hàng của tài sản đó.</li>
                      <li>Để in nhiều tem: Tích vào ô vuông đầu mỗi hàng (bên trái) → nhấn nút <strong>"In QR"</strong> trên thanh công cụ vừa xuất hiện.</li>
                  </ul>
                  
                  <h3>Troubleshooting (Xử lý lỗi)</h3>
                  <p><strong>Lỗi không tìm thấy tài sản trong danh sách:</strong> Kiểm tra xem bộ lọc (Phòng ban/Trạng thái) có đang được chọn hay không. Hãy nhấn nút <strong>"Đặt lại bộ lọc"</strong> để xem toàn bộ tài sản.</p>
              </div>
              
              <div className="note">
                  <p><strong>Mẹo:</strong> Sử dụng ô tìm kiếm để nhập nhanh Mã tài sản (Barcode) khi bạn có máy quét cầm tay.</p>
              </div>
          </section>

          <section id="kiem-ke">
              <h1>2. Kiểm kê</h1>
              <div className="card">
                  <ol>
                      <li>Nhấn <strong>"+ Tạo phiên kiểm kê"</strong>, chọn phạm vi (VD: Kiểm kê toàn bộ hoặc kiểm kê theo phòng).</li>
                      <li>Vào chi tiết phiên, nhấn <strong>"Bắt đầu quét"</strong>.</li>
                      <li>Dùng điện thoại quét tem QR trên tài sản.</li>
                  </ol>
                  <h3>Xử lý tình huống</h3>
                  <ul>
                      <li><strong>Quét không được/Tem bị hỏng:</strong> Chọn tài sản đó trong danh sách và nhấn nút <strong>✓</strong> (Tìm thấy) hoặc <strong>!</strong> (Hỏng) thủ công.</li>
                      <li><strong>Quên nhấn hoàn thành:</strong> Phiên kiểm kê sẽ vẫn để trạng thái "Đang kiểm kê". Bạn phải nhấn <strong>"Hoàn thành phiên"</strong> để hệ thống chốt dữ liệu.</li>
                  </ul>
              </div>
          </section>

          <section id="bao-tri">
              <h1>3. Bảo trì</h1>
              <div className="card">
                  <p>Quy trình: <code>Tạo/Tự động sinh phiếu</code> → <code>Sửa chữa</code> → <code>Hoàn thành</code>.</p>
                  <p>Khi nhấn <strong>"Hoàn thành"</strong> trên phiếu bảo trì, hệ thống sẽ <strong>tự động</strong> chuyển trạng thái tài sản từ "Cần sửa chữa" về "Đang sử dụng". Bạn không cần vào module tài sản để sửa thủ công.</p>
              </div>
          </section>

          <section id="quan-ly-xe">
              <h1>4. Quản lý Đăng ký xe</h1>
              <div className="card">
                  <p>Hệ thống hỗ trợ quản lý lịch trình xe, từ khâu đăng ký, phê duyệt đến điều phối xe.</p>
                  
                  <h3>Bước 1: Đăng ký chuyến xe</h3>
                  <ol>
                      <li>Nhấn <strong>"+ Thêm Đăng ký xe"</strong>.</li>
                      <li>Điền Điểm đi, điểm đến, thời gian (Ngày/Giờ).</li>
                      <li><strong>Thành phần tham gia (Rất quan trọng):</strong> Phải nhập danh sách tên người tham gia, ngăn cách bằng dấu phẩy.
                          <br/><code>Ví dụ: Nguyễn Văn A, Lê Thị B, Trần Văn C</code>.
                          <br/><em>Hệ thống sẽ dựa vào danh sách này để tính toán số ghế cần thiết.</em>
                      </li>
                      <li>Nhấn <strong>Lưu</strong>. Phiếu sẽ ở trạng thái <code>Chờ duyệt</code>.</li>
                  </ol>

                  <h3>Bước 2: Phê duyệt & Điều phối (Dành cho Quản lý/Lãnh đạo)</h3>
                  <ul>
                      <li><strong>Lãnh đạo phòng:</strong> Xem danh sách, kiểm tra thông tin và nhấn <strong>"Duyệt"</strong> để chuyển phiếu đến bộ phận Quản lý xe.</li>
                      <li><strong>Quản lý xe/Điều phối:</strong> Nhận phiếu đã được duyệt, kiểm tra xe trống và nhấn <strong>"Gán xe"</strong> (chọn xe và tài xế).</li>
                  </ul>

                  <h3>Bước 3: Yêu cầu thay đổi (Nếu có thay đổi)</h3>
                  <p>Khi chuyến đi đã được duyệt mà cần thay đổi thông tin (đổi giờ, đổi người tham gia):</p>
                  <ol>
                      <li>Tìm và chọn chuyến xe đã duyệt đó.</li>
                      <li>Nhấn nút <strong>"Yêu cầu đổi"</strong>.</li>
                      <li>Nhập thông tin <strong>mới</strong> vào form.</li>
                      <li>Nhấn <strong>Lưu</strong>. Phiếu sẽ chuyển trạng thái <code>Chờ duyệt thay đổi</code>.</li>
                  </ol>
                  <p><strong>Hủy chuyến đi:</strong> Người dùng có thể chủ động hủy chuyến đi khi đã lên lịch bằng cách bấm nút <strong>Hủy chuyến</strong>, nhập lý do và bấm <strong>Xác nhận hủy.</strong>
</p>
                  <p><em>Quản lý xe sẽ nhận được thông báo, xem lại thông tin mới và nhấn <strong>"Duyệt thay đổi"</strong> để cập nhật vào lịch tuần.</em></p>
              </div>

              <h3>Các tình huống thường gặp (Troubleshooting)</h3>
              <div className="note">
                  <ul>
                      <li><strong>Lỗi "Xe không khả dụng":</strong> Do đã có chuyến khác đăng ký vào khung giờ đó. Hãy chọn thời gian khác hoặc liên hệ Quản lý xe để được hỗ trợ.</li>
                      <li><strong>Tính năng "Ghép xe":</strong> Hệ thống tự động gợi ý ghép chuyến nếu có các yêu cầu cùng ngày, cùng điểm đến. Khi đó hãy chọn chuyến cần ghép để tối ưu hóa việc sử dụng xe.</li>
                      <li><strong>Không thấy nút "Yêu cầu đổi":</strong> Chỉ xuất hiện khi phiếu đã được duyệt. Nếu phiếu còn ở trạng thái chờ, bạn có thể vào trực tiếp phiếu để chỉnh sửa thông tin.</li>
                  </ul>
              </div>
          </section>

          <section id="de-xuat-mua-sam">
              <h1>5. Đề xuất Mua sắm</h1>
              <div className="card">
                  <p>Khi gửi đề xuất, nếu có file báo giá (PDF, ảnh), hãy đính kèm ngay vào phiếu.</p>
                  <p><strong>Theo dõi trạng thái:</strong></p>
                  <ul>
                      <li><code>Chờ duyệt</code>: Đang đợi Trưởng phòng/Giám đốc xem.</li>
                      <li><code>Đã duyệt</code>: Đã được thông qua.</li>
                      <li><code>Từ chối</code>: Nhấn vào phiếu để đọc lý do tại sao bị từ chối (trong phần comment).</li>
                  </ul>
              </div>
          </section>

          <section id="nguoi-dung">
              <h1>Quản trị: Người dùng & Phân quyền</h1>
              <div className="card">
                  <p><strong>Quy tắc quan trọng cho Quản trị viên:</strong></p>
                  <ul>
                      <li>Khi thêm mới người dùng, hãy nhắc họ <strong>Đăng nhập lần đầu</strong> bằng mật khẩu mặc định (nếu có).</li>
                      <li>Khi thay đổi quyền hạn của một Role: Người dùng thuộc Role đó phải <strong>Đăng xuất</strong> thì quyền mới cập nhật vào phiên làm việc tiếp theo.</li>
                  </ul>
              </div>
          </section>
        </main>
      </div>
    </>
  );
};

export default UserGuidePage;